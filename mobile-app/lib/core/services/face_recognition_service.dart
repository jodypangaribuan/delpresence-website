import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';

class FaceRecognitionService {
  // Use the dedicated face recognition service URL
  String get _baseUrl => ApiConfig.instance.faceRecognitionBaseUrl;
  
  final _headers = ApiConfig.instance.defaultHeaders;
  
  // Singleton pattern
  static final FaceRecognitionService _instance = FaceRecognitionService._internal();
  factory FaceRecognitionService() => _instance;
  FaceRecognitionService._internal() {
    // Log the face recognition service URL for debugging
    debugPrint('🔌 Face Recognition Service URL: $_baseUrl');
  }
  
  /// Register a face for a student
  /// 
  /// [studentId] - The ID of the student
  /// [imageBytes] - The raw bytes of the image containing the face
  Future<Map<String, dynamic>> registerFace(int studentId, Uint8List imageBytes) async {
    try {
      final requestUrl = '$_baseUrl/api/faces/register';
      debugPrint('🔌 Making face registration request to: $requestUrl');
      final base64Image = base64Encode(imageBytes);
      
      final response = await http.post(
        Uri.parse(requestUrl),
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
        debugPrint('🔌 Face registration failed: ${response.statusCode} - ${response.body}');
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
      final requestUrl = '$_baseUrl/api/faces/verify';
      debugPrint('🔌 Making face verification request to: $requestUrl');
      final base64Image = base64Encode(imageBytes);
      
      final response = await http.post(
        Uri.parse(requestUrl),
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
          debugPrint('🔌 Face verification failed: ${response.body}');
          return {
            'success': false,
            'message': responseData['error'] ?? 'Face verification failed',
          };
        }
      } else {
        debugPrint('🔌 Face verification failed: ${response.statusCode} - ${response.body}');
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
      final requestUrl = '$_baseUrl/api/faces/student/$studentId';
      debugPrint('🔌 Getting student faces from: $requestUrl');
      
      final response = await http.get(
        Uri.parse(requestUrl),
        headers: _headers,
      ).timeout(ApiConfig.instance.timeout);
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'faces': responseData['faces'] ?? [],
        };
      } else {
        debugPrint('🔌 Get student faces failed: ${response.statusCode} - ${response.body}');
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
      final requestUrl = '$_baseUrl/api/faces/$faceId';
      debugPrint('🔌 Deleting face from: $requestUrl');
      
      final response = await http.delete(
        Uri.parse(requestUrl),
        headers: _headers,
      ).timeout(ApiConfig.instance.timeout);
      
      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': responseData['message'] ?? 'Face deleted successfully',
        };
      } else {
        debugPrint('🔌 Delete face failed: ${response.statusCode} - ${response.body}');
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