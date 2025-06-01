import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../../core/services/network_service.dart';
import '../../../../core/config/api_config.dart';
import 'package:shared_preferences/shared_preferences.dart'; 

class FaceService {
  final NetworkService _networkService;
  // Use ApiConfig instead of hardcoded URL
  late final String _faceApiUrl;

  FaceService({required NetworkService networkService})
      : _networkService = networkService {
    // Get the base URL from ApiConfig
    _faceApiUrl = ApiConfig.instance.baseUrl;
    debugPrint('🔌 Face service initialized with URL: $_faceApiUrl');
  }

  /// Get auth token from shared preferences
  Future<String?> _getAuthToken() async {
    // Gunakan implementasi yang sama seperti service lain di aplikasi
    var prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    debugPrint('🔑 Retrieved token: ${token != null ? 'Token exists' : 'No token found'}');
    return token;
  }

  /// Make a direct HTTP request to the face service API
  Future<Map<String, dynamic>> _makeDirectRequest({
    required String path,
    required String method,
    Map<String, String>? headers,
    dynamic body,
  }) async {
    try {
      // Match exact URL structure in face_recognition_handler.go
      final uri = Uri.parse('$_faceApiUrl/api$path');
      debugPrint('🔌 Making direct request to: $uri');
      
      http.Response response;
      
      switch (method) {
        case 'GET':
          response = await http.get(
            uri,
            headers: headers,
          ).timeout(const Duration(seconds: 30));
          break;
        case 'POST':
          response = await http.post(
            uri,
            headers: headers,
            body: body,
          ).timeout(const Duration(seconds: 30));
          break;
        case 'DELETE':
          final request = http.Request('DELETE', uri);
          if (headers != null) request.headers.addAll(headers);
          if (body != null) request.body = body;
          final streamedResponse = await http.Client().send(request)
              .timeout(const Duration(seconds: 30));
          response = await http.Response.fromStream(streamedResponse);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }
      
      debugPrint('🔌 Response status code: ${response.statusCode}');
      
      // Parse response
      Map<String, dynamic> responseData = {};
      if (response.body.isNotEmpty) {
        try {
          responseData = json.decode(response.body);
        } catch (e) {
          debugPrint('🔌 Error decoding response: $e');
          debugPrint('🔌 Response body: ${response.body}');
          
          if (response.statusCode == 404) {
            return {
              'success': false,
              'message': 'API endpoint not found. Please check the server configuration.'
            };
          }
          
          throw Exception('Failed to parse response: $e');
        }
      }
      
      // Check for successful response
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return responseData;
      } else {
        final errorMessage = responseData['message'] ?? 'API request failed with status: ${response.statusCode}';
        debugPrint('🔌 API error: $errorMessage');
        throw Exception(errorMessage);
      }
    } catch (e) {
      debugPrint('🔌 Exception during API request: $e');
      rethrow;
    }
  }

  /// Register face for a student with embedding instead of sending raw image
  Future<Map<String, dynamic>> registerFace(int studentId, String base64Image, List<double>? embedding) async {
    try {
      // Get auth token
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Tidak ada token autentikasi. Silahkan login kembali.');
      }

      // Prepare auth headers
      final headers = {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      };

      // Prepare request body with embedding if available
      final Map<String, dynamic> requestData = {
        'student_id': studentId,
        'image': base64Image,
      };
      
      // If embedding is provided, add it to the request
      if (embedding != null) {
        requestData['embedding'] = embedding;
      }
      
      final body = jsonEncode(requestData);

      // Make a direct API call to the face service - match Go backend
      final result = await _makeDirectRequest(
        path: '/student/face-registration',
        method: 'POST',
        headers: headers,
        body: body,
      );

      debugPrint('🔍 Face registration API result: $result');
      
      return result;
    } catch (e) {
      debugPrint('🔍 Exception during face registration: $e');
      return {
        'success': false,
        'message': 'Terjadi kesalahan saat mendaftarkan wajah: $e',
      };
    }
  }

  /// Verify face for attendance with embedding
  Future<Map<String, dynamic>> verifyFace(int studentId, String base64Image, List<double>? embedding) async {
    try {
      // Get auth token
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Tidak ada token autentikasi. Silahkan login kembali.');
      }

      // Prepare auth headers
      final headers = {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      };

      // Prepare request body with embedding if available
      final Map<String, dynamic> requestData = {
        'student_id': studentId,
        'image': base64Image,
      };
      
      // If embedding is provided, add it to the request
      if (embedding != null) {
        requestData['embedding'] = embedding;
      }
      
      final body = jsonEncode(requestData);

      // Make a direct API call to the face service - match Go backend
      final result = await _makeDirectRequest(
        path: '/attendance/face-verification',
        method: 'POST',
        headers: headers,
        body: body,
      );

      debugPrint('🔍 Face verification API result: $result');
      
      return result;
    } catch (e) {
      debugPrint('🔍 Exception during face verification: $e');
      return {
        'success': false,
        'message': 'Terjadi kesalahan saat verifikasi wajah: $e',
      };
    }
  }

  /// Get registered faces for a student
  Future<Map<String, dynamic>> getRegisteredFaces(int studentId) async {
    try {
      // Get auth token
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Tidak ada token autentikasi. Silahkan login kembali.');
      }

      // Prepare auth headers
      final headers = {
        'Authorization': 'Bearer $token',
      };

      // Make a direct API call to the face service - match Go backend
      final result = await _makeDirectRequest(
        path: '/student/$studentId/registered-faces',
        method: 'GET',
        headers: headers,
      );

      debugPrint('🔍 Get faces API result: $result');
      
      return result;
    } catch (e) {
      debugPrint('🔍 Exception getting registered faces: $e');
      return {
        'success': false,
        'message': 'Terjadi kesalahan saat mengambil data wajah: $e',
      };
    }
  }

  /// Delete a registered face
  Future<Map<String, dynamic>> deleteFace(int studentId, String embeddingId) async {
    try {
      // Get auth token
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Tidak ada token autentikasi. Silahkan login kembali.');
      }

      // Prepare auth headers
      final headers = {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      };

      // Prepare request body
      final body = jsonEncode({
        'student_id': studentId,
        'embedding_id': embeddingId,
      });

      // Make a direct API call to the face service - match Go backend
      final result = await _makeDirectRequest(
        path: '/student/face',
        method: 'DELETE',
        headers: headers,
        body: body,
      );

      debugPrint('🔍 Delete face API result: $result');
      
      return result;
    } catch (e) {
      debugPrint('🔍 Exception deleting face: $e');
      return {
        'success': false,
        'message': 'Terjadi kesalahan saat menghapus data wajah: $e',
      };
    }
  }
}