import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';

class FaceRecognitionService {
  // Use the face recognition service URL with port 5000
  // This gets the host part of the URL and adds port 5000
  String get _baseUrl {
    final uri = Uri.parse(ApiConfig.instance.baseUrl);
    return '${uri.scheme}://${uri.host}:5000';
  }
  
  final _headers = ApiConfig.instance.defaultHeaders;
  
  // Singleton pattern
  static final FaceRecognitionService _instance = FaceRecognitionService._internal();
  factory FaceRecognitionService() => _instance;
  FaceRecognitionService._internal();
  
  /// Register a face for a student
  /// 
  /// [studentId] - The ID of the student
  /// [imageBytes] - The raw bytes of the image containing the face
  Future<Map<String, dynamic>> registerFace(int studentId, Uint8List imageBytes) async {
    try {
      final base64Image = base64Encode(imageBytes);
      
      final response = await http.post(
        Uri.parse('$_baseUrl/api/faces/register'),
        headers: _headers,
        body: jsonEncode({
          'student_id': studentId,
          'image': base64Image,
        }),
      ).timeout(ApiConfig.instance.timeout);
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Face registered successfully',
        };
      } else {
        return {
          'success': false,
          'message': responseData['error'] ?? 'Failed to register face',
        };
      }
    } catch (e) {
      debugPrint('Error registering face: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }
  
  /// Verify a face for attendance
  /// 
  /// [imageBytes] - The raw bytes of the image containing the face to verify
  Future<Map<String, dynamic>> verifyFace(Uint8List imageBytes) async {
    try {
      final base64Image = base64Encode(imageBytes);
      
      final response = await http.post(
        Uri.parse('$_baseUrl/api/faces/verify'),
        headers: _headers,
        body: jsonEncode({
          'image': base64Image,
        }),
      ).timeout(ApiConfig.instance.timeout);
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        if (responseData['success'] == true) {
          if (responseData['match'] == true) {
            return {
              'success': true,
              'match': true,
              'student_id': responseData['student_id'],
              'confidence': responseData['confidence'],
            };
          } else {
            return {
              'success': true,
              'match': false,
              'message': responseData['message'] ?? 'No face match found',
            };
          }
        } else {
          return {
            'success': false,
            'message': responseData['error'] ?? 'Face verification failed',
          };
        }
      } else {
        return {
          'success': false,
          'message': responseData['error'] ?? 'Failed to verify face',
        };
      }
    } catch (e) {
      debugPrint('Error verifying face: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }
  
  /// Get all registered faces for a student
  /// 
  /// [studentId] - The ID of the student
  Future<Map<String, dynamic>> getStudentFaces(int studentId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/faces/student/$studentId'),
        headers: _headers,
      ).timeout(ApiConfig.instance.timeout);
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'faces': responseData['faces'] ?? [],
        };
      } else {
        return {
          'success': false,
          'message': responseData['error'] ?? 'Failed to get student faces',
        };
      }
    } catch (e) {
      debugPrint('Error getting student faces: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }
  
  /// Delete a registered face
  /// 
  /// [faceId] - The ID of the face to delete
  Future<Map<String, dynamic>> deleteFace(int faceId) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/api/faces/$faceId'),
        headers: _headers,
      ).timeout(ApiConfig.instance.timeout);
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Face deleted successfully',
        };
      } else {
        return {
          'success': false,
          'message': responseData['error'] ?? 'Failed to delete face',
        };
      }
    } catch (e) {
      debugPrint('Error deleting face: $e');
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }
} 