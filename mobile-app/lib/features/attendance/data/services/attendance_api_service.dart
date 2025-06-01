import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../../../../core/services/network_service.dart';
import '../models/attendance_history_model.dart';

class AttendanceApiService {
  final NetworkService _networkService;

  AttendanceApiService({required NetworkService networkService})
      : _networkService = networkService;

  /// Fetch attendance history for the current user
  Future<List<AttendanceHistoryModel>> getAttendanceHistory({
    String? startDate,
    String? endDate,
  }) async {
    try {
      // Build query parameters
      final Map<String, dynamic> queryParams = {};
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;

      // Make API request
      final response = await _networkService.get<Map<String, dynamic>>(
        '/api/student/attendance/history',
        queryParams: queryParams,
      );

      if (response.success && response.data != null) {
        final data = response.data!;
        
        if (data['status'] == 'success' && data['data'] != null) {
          final List<dynamic> attendanceList = data['data'];
          
          return attendanceList.map((item) {
            // Map API response to our model
            return AttendanceHistoryModel(
              id: item['id'].toString(),
              courseTitle: item['course_name'] ?? 'Unknown Course',
              roomName: '${item['room_name'] ?? 'Unknown Room'} - ${item['building_name'] ?? ''}',
              // Parse date and time
              dateTime: _parseDateTime(item['date'], item['check_in_time']),
              status: _mapAttendanceStatus(item['status']),
            );
          }).toList();
        }
      }
      
      // Return empty list if there's an error or no data
      return [];
    } catch (e) {
      debugPrint('Error fetching attendance history: $e');
      return [];
    }
  }

  /// Parse date and time from API response
  DateTime _parseDateTime(String? dateStr, String? timeStr) {
    try {
      final date = dateStr != null ? DateTime.parse(dateStr) : DateTime.now();
      
      if (timeStr != null && timeStr.isNotEmpty) {
        final timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
          final hour = int.parse(timeParts[0]);
          final minute = int.parse(timeParts[1]);
          final second = timeParts.length > 2 ? int.parse(timeParts[2]) : 0;
          
          return DateTime(
            date.year, 
            date.month, 
            date.day, 
            hour, 
            minute, 
            second,
          );
        }
      }
      
      // Return date with 00:00:00 time if no valid time provided
      return date;
    } catch (e) {
      debugPrint('Error parsing date/time: $e');
      return DateTime.now();
    }
  }

  /// Map attendance status from API to our model
  String _mapAttendanceStatus(String? apiStatus) {
    switch (apiStatus?.toUpperCase()) {
      case 'PRESENT':
        return 'Hadir';
      case 'LATE':
        return 'Terlambat';
      case 'ABSENT':
        return 'Alpa';
      case 'EXCUSED':
        return 'Izin';
      default:
        return 'Hadir';
    }
  }
} 