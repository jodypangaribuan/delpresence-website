import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/services/network_service.dart';
import '../models/schedule_model.dart';

class ScheduleService {
  final NetworkService _networkService;

  ScheduleService({required NetworkService networkService})
      : _networkService = networkService;

  /// Get auth token from shared preferences
  Future<String?> _getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    debugPrint('🔑 Retrieved token: ${token != null ? 'Token exists' : 'No token found'}');
    return token;
  }

  /// Get all schedules for the current student
  Future<List<ScheduleModel>> getStudentSchedules({int? academicYearId}) async {
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
      final endpoint = '/api/student/schedules';
      debugPrint('🔍 Attempting to fetch schedules from: ${_networkService.baseUrl}$endpoint');
      debugPrint('🔍 Query params: $queryParams');
      debugPrint('🔍 Using Authorization header: Bearer ${token.substring(0, 10)}...');

      // Make the API call
      final response = await _networkService.get<Map<String, dynamic>>(
        endpoint,
        queryParams: queryParams,
        headers: headers,
      );

      debugPrint('🔍 Schedule API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
      
      if (response.success && response.data != null) {
        final data = response.data!;
        
        // Check if the data has the expected structure
        if (data.containsKey('status') && 
            data['status'] == 'success' && 
            data.containsKey('data')) {
          
          // Parse the schedules list
          final List<dynamic> schedulesJson = data['data'];
          debugPrint('🔍 Successfully parsed ${schedulesJson.length} schedules');
          return schedulesJson
              .map((json) => ScheduleModel.fromJson(json))
              .toList();
        } else {
          // If the response format is unexpected
          debugPrint('Unexpected response format: ${data.toString()}');
          return [];
        }
      } else {
        // If there was an error with the API call
        debugPrint('Error fetching student schedules: ${response.errorMessage}');
        if (response.statusCode == 401) {
          throw Exception('Sesi anda telah berakhir. Silahkan login kembali.');
        }
        if (response.statusCode == 0) {
          debugPrint('🔍 Connection issue - Status code 0 typically means the request didn\'t reach the server');
        }
        return [];
      }
    } on SocketException catch (e) {
      // Handle specific network connection errors
      debugPrint('🔍 Socket exception fetching student schedules: $e');
      throw Exception('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } on TimeoutException catch (e) {
      debugPrint('🔍 Timeout exception fetching student schedules: $e');
      throw Exception('Waktu koneksi habis. Coba lagi nanti.');
    } catch (e) {
      // Handle any exceptions
      debugPrint('🔍 General exception while fetching student schedules: $e');
      throw Exception('Terjadi kesalahan saat mengambil jadwal: $e');
    }
  }

  /// Get all academic years
  Future<List<Map<String, dynamic>>> getAcademicYears() async {
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

      // Log the API request for debugging
      final endpoint = '/api/student/academic-years';
      debugPrint('🔍 Attempting to fetch academic years from: ${_networkService.baseUrl}$endpoint');
      debugPrint('🔍 Using Authorization header: Bearer ${token.substring(0, 10)}...');

      final response = await _networkService.get<Map<String, dynamic>>(
        endpoint,
        headers: headers,
      );

      debugPrint('🔍 Academic years API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
      
      if (response.success && response.data != null) {
        final data = response.data!;
        
        if (data.containsKey('status') && 
            data['status'] == 'success' && 
            data.containsKey('data')) {
          
          final List<dynamic> academicYearsJson = data['data'];
          debugPrint('🔍 Successfully parsed ${academicYearsJson.length} academic years');
          return academicYearsJson.cast<Map<String, dynamic>>();
        } else {
          debugPrint('Unexpected response format for academic years');
          return [];
        }
      } else {
        debugPrint('Error fetching academic years: ${response.errorMessage}');
        if (response.statusCode == 401) {
          throw Exception('Sesi anda telah berakhir. Silahkan login kembali.');
        }
        if (response.statusCode == 0) {
          debugPrint('🔍 Connection issue - Status code 0 typically means the request didn\'t reach the server');
        }
        return [];
      }
    } on SocketException catch (e) {
      // Handle specific network connection errors
      debugPrint('🔍 Socket exception fetching academic years: $e');
      throw Exception('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } on TimeoutException catch (e) {
      debugPrint('🔍 Timeout exception fetching academic years: $e');
      throw Exception('Waktu koneksi habis. Coba lagi nanti.');
    } catch (e) {
      debugPrint('🔍 General exception while fetching academic years: $e');
      throw Exception('Terjadi kesalahan saat mengambil tahun akademik: $e');
    }
  }

  /// Check if there is an active attendance session for a specific schedule
  Future<bool> isAttendanceSessionActive(int scheduleId) async {
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

      // Log the API request for debugging
      final endpoint = '/api/student/attendance/active-sessions';
      debugPrint('🔍 Checking active attendance sessions for schedule: $scheduleId');

      final response = await _networkService.get<Map<String, dynamic>>(
        endpoint,
        headers: headers,
      );

      debugPrint('🔍 Active sessions API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
      
      if (response.success && response.data != null) {
        final data = response.data!;
        
        if (data.containsKey('status') && 
            data['status'] == 'success' && 
            data.containsKey('data')) {
          
          // Parse the active sessions list
          final List<dynamic> sessionsJson = data['data'];
          debugPrint('🔍 Found ${sessionsJson.length} active sessions');
          
          // Check if any of the active sessions match our schedule ID
          for (final session in sessionsJson) {
            // Handle both snake_case and camelCase response formats
            final sessionScheduleId = session['course_schedule_id'] ?? session['courseScheduleId'];
            
            if (sessionScheduleId == scheduleId) {
              debugPrint('🔍 Found active session for schedule $scheduleId');
              return true;
            }
          }
        }
      }
      
      // No active session found for this schedule
      return false;
    } catch (e) {
      debugPrint('🔍 Error checking active sessions: $e');
      return false;
    }
  }
} 