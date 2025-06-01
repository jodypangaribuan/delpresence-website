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
      debugPrint('🔍 Using endpoint: ${_networkService.baseUrl}$endpoint');

      final response = await _networkService.get<Map<String, dynamic>>(
        endpoint,
        headers: headers,
      );

      debugPrint('🔍 Active sessions API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
      
      if (response.success && response.data != null) {
        final data = response.data!;
        debugPrint('🔍 Response data: ${data.toString()}');
        
        if (data.containsKey('status') && 
            data['status'] == 'success' && 
            data.containsKey('data')) {
          
          // Handle null data properly
          if (data['data'] == null) {
            debugPrint('🔍 No active sessions data (null) from API');
            return false;
          }
          
          // Parse the active sessions list
          final List<dynamic> sessionsJson = data['data'] as List<dynamic>;
          debugPrint('🔍 Found ${sessionsJson.length} active sessions');
          
          if (sessionsJson.isEmpty) {
            debugPrint('🔍 No active sessions available from API');
            return false;
          }
          
          // Log all session IDs for debugging
          for (final session in sessionsJson) {
            final sessionScheduleId = session['course_schedule_id'] ?? session['courseScheduleId'];
            debugPrint('🔍 Active session found for schedule ID: $sessionScheduleId (checking against $scheduleId)');
            
            // Try both string and int comparison
            if (sessionScheduleId.toString() == scheduleId.toString()) {
              debugPrint('🔍 ✅ Match found! Active session exists for schedule $scheduleId');
              return true;
            }
          }
          
          debugPrint('🔍 ❌ No matching active session for schedule $scheduleId');
        } else {
          debugPrint('🔍 Unexpected API response format: ${data.toString()}');
        }
      } else {
        debugPrint('🔍 API error or no data: ${response.errorMessage}');
      }
      
      // No active session found for this schedule
      return false;
    } catch (e) {
      debugPrint('🔍 Error checking active sessions: $e');
      return false;
    }
  }

  /// Get all active attendance sessions to help with debugging
  Future<List<Map<String, dynamic>>> getAllActiveAttendanceSessions() async {
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
      debugPrint('🔍 Getting all active attendance sessions');
      debugPrint('🔍 Using endpoint: ${_networkService.baseUrl}$endpoint');

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
          
          // Handle null data properly
          if (data['data'] == null) {
            debugPrint('🔍 No active sessions data (null) from API');
            return [];
          }
          
          final List<dynamic> sessionsJson = data['data'] as List<dynamic>;
          debugPrint('🔍 Successfully parsed ${sessionsJson.length} active sessions');
          
          // Log each session for debugging
          for (int i = 0; i < sessionsJson.length; i++) {
            final session = sessionsJson[i];
            final scheduleId = session['course_schedule_id'] ?? session['courseScheduleId'];
            final courseName = session['course_name'] ?? session['courseName'];
            debugPrint('🔍 Session $i: Schedule ID=$scheduleId, Course=$courseName');
          }
          
          return List<Map<String, dynamic>>.from(sessionsJson);
        } else {
          debugPrint('🔍 Unexpected response format for active sessions');
          return [];
        }
      } else {
        debugPrint('🔍 Error fetching active sessions: ${response.errorMessage}');
        return [];
      }
    } catch (e) {
      debugPrint('🔍 Error getting all active sessions: $e');
      return [];
    }
  }

  /// Check student attendance status for a specific schedule directly from server
  Future<bool> checkAttendanceStatus(int scheduleId) async {
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
      final endpoint = '/api/student/attendance/status/$scheduleId';
      debugPrint('🔍 Checking attendance status for schedule: $scheduleId');
      debugPrint('🔍 Using endpoint: ${_networkService.baseUrl}$endpoint');

      try {
        final response = await _networkService.get<Map<String, dynamic>>(
          endpoint,
          headers: headers,
        );

        debugPrint('🔍 Attendance status API response: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');
        
        if (response.success && response.data != null) {
          final data = response.data!;
          debugPrint('🔍 Response data: ${data.toString()}');
          
          // Check if the response indicates the student has attended this schedule
          if (data.containsKey('status') && data['status'] == 'success') {
            if (data.containsKey('data') && data['data'] != null) {
              // If data exists and contains attendance_record_exists or has_attended, use it
              if (data['data']['attendance_recorded'] == true || 
                  data['data']['has_attended'] == true) {
                debugPrint('✅ Server confirms student has attended schedule $scheduleId');
                
                // Update the local SharedPreferences to match server status
                final prefs = await SharedPreferences.getInstance();
                await prefs.setBool('attendance_completed_$scheduleId', true);
                
                return true;
              } else if (data['data']['attendance_recorded'] == false || 
                        data['data']['has_attended'] == false) {
                debugPrint('❌ Server confirms student has NOT attended schedule $scheduleId');
                
                // Update the local SharedPreferences to match server status
                final prefs = await SharedPreferences.getInstance();
                await prefs.setBool('attendance_completed_$scheduleId', false);
                
                return false;
              }
            }
          }
        }
      } catch (e) {
        debugPrint('🔍 Error with direct status endpoint: $e');
        debugPrint('🔍 Likely the endpoint does not exist yet. Using alternative method...');
      }
      
      // Try alternative method - check general attendance records API
      try {
        debugPrint('🔍 Trying alternative attendance check using records endpoint...');
        final altEndpoint = '/api/student/attendance/records';
        
        final altResponse = await _networkService.get<Map<String, dynamic>>(
          altEndpoint,
          headers: headers,
        );
        
        if (altResponse.success && altResponse.data != null) {
          final data = altResponse.data!;
          
          if (data.containsKey('status') && data['status'] == 'success' && 
              data.containsKey('data') && data['data'] is List) {
            
            final List<dynamic> records = data['data'];
            for (var record in records) {
              final int recordScheduleId = record['course_schedule_id'] ?? 0;
              if (recordScheduleId == scheduleId) {
                debugPrint('✅ Found attendance record for schedule $scheduleId in records API');
                
                // Save to local storage
                final prefs = await SharedPreferences.getInstance();
                await prefs.setBool('attendance_completed_$scheduleId', true);
                
                return true;
              }
            }
            debugPrint('❌ No matching attendance record found in records API');
          }
        }
      } catch (e) {
        debugPrint('🔍 Error with alternative attendance check: $e');
      }
      
      // If we can't determine from server, fall back to local storage
      final prefs = await SharedPreferences.getInstance();
      final hasAttended = prefs.getBool('attendance_completed_$scheduleId') ?? false;
      debugPrint('⚠️ Using cached attendance status for schedule $scheduleId: ${hasAttended ? 'Attended' : 'Not attended'}');
      return hasAttended;
    } catch (e) {
      debugPrint('🔍 Error checking attendance status: $e');
      // Fall back to local storage on error
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('attendance_completed_$scheduleId') ?? false;
    }
  }
} 