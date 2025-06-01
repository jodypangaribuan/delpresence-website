import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/services/network_service.dart';
import '../../../../core/services/cache_service.dart';
import '../../data/models/schedule_model.dart';
import '../../../../core/services/storage_service.dart';

class ScheduleService {
  final NetworkService _networkService;
  final CacheService _cacheService = CacheService();
  final StorageService _storageService = StorageService();

  ScheduleService({required NetworkService networkService})
      : _networkService = networkService;

  /// Get auth token from storage
  Future<String?> _getAuthToken() async {
    try {
      final token = await _storageService.getToken();
      debugPrint('🔑 Retrieved token: ${token != null ? 'Token exists' : 'No token found'}');
      return token;
    } catch (e) {
      debugPrint('🔑 Error retrieving token: $e');
      return null;
    }
  }

  /// Get all schedules for the current student
  Future<List<ScheduleModel>> getStudentSchedules({int? academicYearId}) async {
    try {
      // Try to get from cache if academicYearId is not specified
      if (academicYearId == null) {
        final cachedData = await _cacheService.getTodaySchedules();
        if (cachedData != null) {
          return ScheduleModel.fromJsonList(cachedData);
        }
      }
      
      // Get auth token
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Tidak ada token autentikasi. Silahkan login kembali.');
      }

      // Prepare auth headers
      final headers = {
        'Authorization': 'Bearer $token',
      };

      // Prepare query parameters
      final Map<String, dynamic> queryParams = {};
      if (academicYearId != null) {
        queryParams['academic_year_id'] = academicYearId.toString();
      }

      // Log the API request for debugging
      final endpoint = '/api/student/schedules';
      debugPrint('🔍 Attempting to fetch schedules from: ${_networkService.baseUrl}$endpoint');
      debugPrint('🔍 Query params: $queryParams');
      debugPrint('🔍 Using Authorization header: Bearer ${token.substring(0, 10)}...');

      final response = await _networkService.get<Map<String, dynamic>>(
        endpoint,
        headers: headers,
        queryParams: queryParams,
      );

      // Log the response for debugging
      debugPrint('🔍 Schedule API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');

      if (!response.success || response.data == null) {
        throw Exception(response.message ?? 'Failed to get student schedules');
      }

      // Get schedules from response
      final List<dynamic> schedulesJson = response.data!['data'];
      
      // Convert to List<ScheduleModel>
      final schedules = ScheduleModel.fromJsonList(schedulesJson);
      
      // Cache the result if not filtering by academicYearId
      if (academicYearId == null) {
        _cacheService.saveTodaySchedules(schedulesJson);
      }
      
      debugPrint('🔍 Successfully parsed ${schedules.length} schedules');
      return schedules;
    } catch (e) {
      debugPrint('🔍 Error getting student schedules: $e');
      rethrow;
    }
  }

  /// Get all academic years
  Future<List<Map<String, dynamic>>> getAcademicYears() async {
    try {
      // Try to get from cache first
      final cachedData = await _cacheService.getAcademicYears();
      if (cachedData != null) {
        return List<Map<String, dynamic>>.from(
          cachedData.map((item) => Map<String, dynamic>.from(item))
        );
      }
      
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

      // Log the response for debugging
      debugPrint('🔍 Academic years API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');

      if (!response.success || response.data == null) {
        throw Exception(response.message ?? 'Failed to get academic years');
      }

      // Get academic years from response
      final List<dynamic> academicYearsJson = response.data!['data'];
      
      // Convert to List<Map<String, dynamic>>
      final academicYears = academicYearsJson
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      
      // Cache the result
      _cacheService.saveAcademicYears(academicYears);
      
      debugPrint('🔍 Successfully parsed ${academicYears.length} academic years');
      return academicYears;
    } catch (e) {
      debugPrint('🔍 Error getting academic years: $e');
      rethrow;
    }
  }

  /// Check if there is an active attendance session for a specific schedule
  Future<bool> isAttendanceSessionActive(int scheduleId) async {
    try {
      // Try to get from cache first
      final cachedActiveSessions = await _cacheService.getActiveSessions();
      if (cachedActiveSessions != null && cachedActiveSessions.containsKey(scheduleId)) {
        return cachedActiveSessions[scheduleId] ?? false;
      }
      
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

      // Log response status
      debugPrint('🔍 Active sessions API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');

      if (!response.success || response.data == null) {
        final errorMsg = response.message ?? 'Failed to get active sessions';
        debugPrint('🔍 API error or no data: $errorMsg');
        return false;
      }

      // Get active sessions from response
      final List<dynamic> activeSessions = response.data!['data'];
      
      // Check if schedule ID is in active sessions
      bool isActive = false;
      for (var session in activeSessions) {
        if (session['course_schedule_id'] == scheduleId) {
          isActive = true;
          break;
        }
      }
      
      // Efficiently update the cache
      Map<int, bool> activeSessionsMap = cachedActiveSessions ?? {};
      activeSessionsMap[scheduleId] = isActive;
      _cacheService.saveActiveSessions(activeSessionsMap);
      
      return isActive;
    } catch (e) {
      debugPrint('🔍 Error checking active attendance session: $e');
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

      // Log response status
      debugPrint('🔍 Active sessions API response status: ${response.success ? 'Success' : 'Failed'} (${response.statusCode})');

      if (!response.success || response.data == null) {
        final errorMsg = response.message ?? 'Failed to get active sessions';
        debugPrint('🔍 Error fetching active sessions: $errorMsg');
        return [];
      }

      // Get active sessions from response
      final List<dynamic> activeSessionsJson = response.data!['data'];
      
      // Convert to List<Map<String, dynamic>>
      final activeSessions = activeSessionsJson
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      
      // Cache the active sessions
      final Map<int, bool> activeSessionsMap = {};
      for (var session in activeSessions) {
        final scheduleId = session['course_schedule_id'];
        if (scheduleId != null) {
          activeSessionsMap[scheduleId] = true;
        }
      }
      _cacheService.saveActiveSessions(activeSessionsMap);
      
      debugPrint('🔍 Got ${activeSessions.length} total active sessions from API');
      return activeSessions;
    } catch (e) {
      debugPrint('🔍 Error fetching active sessions: $e');
      return [];
    }
  }
} 