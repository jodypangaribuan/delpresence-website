import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/services/network_service.dart';
import '../models/course_model.dart';

class CourseService {
  final NetworkService _networkService;

  CourseService({required NetworkService networkService})
      : _networkService = networkService;

  /// Get auth token from shared preferences
  Future<String?> _getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    debugPrint('🔑 Retrieved token: ${token != null ? 'Token exists' : 'No token found'}');
    return token;
  }

  /// Get all courses for the current student
  Future<List<CourseModel>> getStudentCourses({int? academicYearId}) async {
    try {
      // Get auth token
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Tidak ada token autentikasi. Silahkan login kembali.');
      }

      // Build query parameters if academic year ID is provided
      Map<String, dynamic>? queryParams;
      if (academicYearId != null && academicYearId > 0) {
        queryParams = {'academic_year_id': academicYearId.toString()};
      }

      // Prepare auth headers
      final headers = {
        'Authorization': 'Bearer $token',
      };

      // Log the API request for debugging
      final endpoint = '/api/student/courses';
      debugPrint('🔍 Attempting to fetch courses from: ${_networkService.baseUrl}$endpoint');
      debugPrint('🔍 Query params: $queryParams');
      debugPrint('🔍 Using Authorization header: Bearer ${token.substring(0, min(10, token.length))}...');

      // Make the API call
      final response = await _networkService.get<Map<String, dynamic>>(
        endpoint,
        queryParams: queryParams,
        headers: headers,
      );

      debugPrint('🔍 Courses API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
      
      if (response.success && response.data != null) {
        final data = response.data!;
        
        // Check if the data has the expected structure
        if (data.containsKey('status') && 
            data['status'] == 'success' && 
            data.containsKey('data')) {
          
          // Parse the courses list
          final List<dynamic> coursesJson = data['data'];
          debugPrint('🔍 Successfully parsed ${coursesJson.length} courses');
          
          // Debug: Print detailed information about courses
          if (coursesJson.isNotEmpty) {
            debugPrint('🔍 First course data: ${jsonEncode(coursesJson.first)}');
            
            // Check specifically for lecturer data in all courses
            for (int i = 0; i < min(coursesJson.length, 5); i++) {
              final course = coursesJson[i];
              debugPrint('🔍 Course ${i+1} - ${course['course_name']} - ' +
                         'Lecturer data: ${course['lecturer_name']} - ' +
                         'LecturerID: ${course['lecturer_id']}');
            }
          }
          
          return coursesJson
              .map((json) => CourseModel.fromJson(json))
              .toList();
        } else {
          // If the response format is unexpected
          debugPrint('Unexpected response format: ${data.toString()}');
          throw Exception('Format respons API tidak valid.');
        }
      } else {
        // If there was an error with the API call
        debugPrint('Error fetching student courses: ${response.errorMessage}');
        if (response.statusCode == 401) {
          throw Exception('Sesi anda telah berakhir. Silahkan login kembali.');
        }
        if (response.statusCode == 0) {
          debugPrint('🔍 Connection issue - Status code 0 typically means the request didn\'t reach the server');
          throw Exception('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        }
        throw Exception(response.errorMessage ?? 'Gagal mengambil data mata kuliah.');
      }
    } on SocketException catch (e) {
      // Handle specific network connection errors
      debugPrint('🔍 Socket exception fetching student courses: $e');
      throw Exception('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } on TimeoutException catch (e) {
      debugPrint('🔍 Timeout exception fetching student courses: $e');
      throw Exception('Waktu koneksi habis. Coba lagi nanti.');
    } catch (e) {
      // Handle any exceptions
      debugPrint('🔍 General exception while fetching student courses: $e');
      throw Exception('Terjadi kesalahan saat mengambil daftar mata kuliah: $e');
    }
  }
  
  // Helper function to get minimum of two integers
  int min(int a, int b) {
    return a < b ? a : b;
  }
} 