import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../../core/services/network_service.dart';
import '../../../../core/config/api_config.dart';
import 'package:shared_preferences/shared_preferences.dart'; 

class FaceService {
  final NetworkService _networkService;

  FaceService({required NetworkService networkService})
      : _networkService = networkService;

  /// Get auth token from shared preferences
  Future<String?> _getAuthToken() async {
    // Gunakan implementasi yang sama seperti service lain di aplikasi
    var prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    debugPrint('🔑 Retrieved token: ${token != null ? 'Token exists' : 'No token found'}');
    return token;
  }

  /// Register face for a student
  Future<Map<String, dynamic>> registerFace(int studentId, String base64Image) async {
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
        'image': base64Image,
      });

      // Make the API call
      final response = await _networkService.post<Map<String, dynamic>>(
        '/api/student/face-registration',
        headers: headers,
        body: body,
      );

      debugPrint('🔍 Face registration API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
      
      if (response.success && response.data != null) {
        return response.data!;
      } else {
        // If there was an error with the API call
        debugPrint('Error registering face: ${response.errorMessage}');
        return {
          'success': false,
          'message': response.errorMessage ?? 'Gagal mendaftarkan wajah.',
        };
      }
    } catch (e) {
      debugPrint('🔍 Exception during face registration: $e');
      return {
        'success': false,
        'message': 'Terjadi kesalahan saat mendaftarkan wajah: $e',
      };
    }
  }

  /// Verify face for attendance
  Future<Map<String, dynamic>> verifyFace(int studentId, String base64Image) async {
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
        'image': base64Image,
      });

      // Make the API call
      final response = await _networkService.post<Map<String, dynamic>>(
        '/api/attendance/face-verification',
        headers: headers,
        body: body,
      );

      debugPrint('🔍 Face verification API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
      
      if (response.data != null) {
        return response.data!;
      } else {
        // If there was an error with the API call
        debugPrint('Error verifying face: ${response.errorMessage}');
        return {
          'success': false,
          'message': response.errorMessage ?? 'Gagal verifikasi wajah.',
        };
      }
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

      // Make the API call
      final response = await _networkService.get<Map<String, dynamic>>(
        '/api/student/$studentId/registered-faces',
        headers: headers,
      );

      debugPrint('🔍 Get faces API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
      
      if (response.success && response.data != null) {
        return response.data!;
      } else {
        // If there was an error with the API call
        debugPrint('Error getting registered faces: ${response.errorMessage}');
        return {
          'success': false,
          'message': response.errorMessage ?? 'Gagal mengambil data wajah.',
        };
      }
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

      // Make the API call using direct http call because NetworkService might not support DELETE with body
      final uri = Uri.parse('${_networkService.baseUrl}/api/student/face');
      final request = http.Request('DELETE', uri);
      request.headers.addAll(headers);
      request.body = body;
      
      final httpResponse = await http.Client().send(request);
      final responseBody = await httpResponse.stream.bytesToString();
      
      debugPrint('🔍 Delete face API response status: ${httpResponse.statusCode}');
      
      if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
        return jsonDecode(responseBody);
      } else {
        // If there was an error with the API call
        debugPrint('Error deleting face: $responseBody');
        return {
          'success': false,
          'message': 'Gagal menghapus data wajah.',
        };
      }
    } catch (e) {
      debugPrint('🔍 Exception deleting face: $e');
      return {
        'success': false,
        'message': 'Terjadi kesalahan saat menghapus data wajah: $e',
      };
    }
  }
}