import 'dart:convert';
import 'dart:io';
import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/services/network_service.dart';
import '../models/attendance_history_model.dart';

/// Service to handle attendance-related API calls
class AttendanceService {
  final NetworkService _networkService;
  
  AttendanceService({
    NetworkService? networkService,
  }) : _networkService = networkService ?? NetworkService(
         baseUrl: ApiConfig.instance.baseUrl,
         timeout: ApiConfig.instance.timeout,
       );
  
  /// Get authentication headers
  Future<Map<String, String>> _getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    if (token == null) {
      debugPrint('No authentication token found');
      return {};
    }
    
    return {'Authorization': 'Bearer $token'};
  }
  
  /// Get all attendance history for the logged-in student
  Future<List<AttendanceHistoryModel>> getAttendanceHistory({
    String? academicYearId,
    String? startDate,
    String? endDate,
  }) async {
    try {
      // Build query parameters
      final queryParams = <String, String>{};
      if (academicYearId != null) queryParams['academic_year_id'] = academicYearId;
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;
      
      // Get auth headers
      final headers = await _getAuthHeaders();
      
      // Make API request
      final response = await _networkService.get(
        '/api/student/attendance/history',
        headers: headers,
        queryParams: queryParams,
      );
      
      // Parse response
      if (response.success && response.data != null) {
        final responseData = response.data;
        if (responseData != null && responseData['status'] == 'success' && responseData['data'] != null) {
          final List<dynamic> attendanceData = responseData['data'];
          final List<AttendanceHistoryModel> attendanceHistory = attendanceData
              .map((data) => AttendanceHistoryModel.fromJson(data))
              .toList();
          
          return attendanceHistory;
        }
      }
      
      // If something went wrong or data format doesn't match
      debugPrint('Error fetching attendance history: ${response.errorMessage}');
      return [];
    } on SocketException {
      debugPrint('No internet connection');
      return [];
    } on TimeoutException {
      debugPrint('Connection timeout');
      return [];
    } catch (e) {
      debugPrint('Error fetching attendance history: $e');
      return [];
    }
  }
  
  /// Get today's attendance history for the logged-in student
  Future<List<AttendanceHistoryModel>> getTodayAttendanceHistory() async {
    try {
      // Get auth headers
      final headers = await _getAuthHeaders();
      
      // Make API request
      final response = await _networkService.get(
        '/api/student/attendance/history/today',
        headers: headers,
      );
      
      // Parse response
      if (response.success && response.data != null) {
        final responseData = response.data;
        if (responseData != null && responseData['status'] == 'success' && responseData['data'] != null) {
          final List<dynamic> attendanceData = responseData['data'];
          final List<AttendanceHistoryModel> todayAttendanceHistory = attendanceData
              .map((data) => AttendanceHistoryModel.fromJson(data))
              .toList();
          
          return todayAttendanceHistory;
        }
      }
      
      // If something went wrong or data format doesn't match
      debugPrint('Error fetching today\'s attendance history: ${response.errorMessage}');
      return [];
    } on SocketException {
      debugPrint('No internet connection');
      return [];
    } on TimeoutException {
      debugPrint('Connection timeout');
      return [];
    } catch (e) {
      debugPrint('Error fetching today\'s attendance history: $e');
      return [];
    }
  }
  
  /// Get statistics about student's attendance (percentages etc.)
  Future<Map<String, dynamic>> getAttendanceStatistics({
    String? academicYearId,
  }) async {
    try {
      // Build query parameters
      final queryParams = <String, String>{};
      if (academicYearId != null) queryParams['academic_year_id'] = academicYearId;
      
      // Get auth headers
      final headers = await _getAuthHeaders();
      
      // Make API request - this endpoint doesn't exist yet, just a placeholder
      final response = await _networkService.get(
        '/api/student/attendance/statistics',
        headers: headers,
        queryParams: queryParams,
      );
      
      // Parse response
      if (response.success && response.data != null) {
        final responseData = response.data;
        if (responseData != null && responseData['status'] == 'success' && responseData['data'] != null) {
          return responseData['data'];
        }
      }
      
      return {
        'total': 0,
        'present': 0,
        'late': 0,
        'absent': 0,
        'excused': 0,
      };
    } catch (e) {
      debugPrint('Error fetching attendance statistics: $e');
      return {
        'total': 0,
        'present': 0,
        'late': 0,
        'absent': 0,
        'excused': 0,
      };
    }
  }
  
  /// Check if attendance is already completed for a specific schedule
  Future<bool> checkAttendanceStatus(int scheduleId) async {
    try {
      debugPrint('🔍 Checking attendance status for schedule ID: $scheduleId');
      
      // Get auth headers
      final headers = await _getAuthHeaders();
      
      // Make API request to check attendance status
      final response = await _networkService.get(
        '/api/student/attendance/check-status/$scheduleId',
        headers: headers,
      );
      
      // Log response for debugging
      debugPrint('📊 Check attendance response: ${response.data}');
      
      // Parse response
      if (response.success && response.data != null) {
        final responseData = response.data;
        if (responseData != null && responseData['status'] == 'success') {
          // Return the completed status from the server
          final bool isCompleted = responseData['completed'] == true;
          debugPrint('📝 Attendance completed status: $isCompleted');
          return isCompleted;
        }
      }
      
      debugPrint('⚠️ Check attendance failed or returned invalid data');
      // Default to not completed in case of errors
      return false;
    } catch (e) {
      debugPrint('❌ Error checking attendance status: $e');
      return false;
    }
  }
} 