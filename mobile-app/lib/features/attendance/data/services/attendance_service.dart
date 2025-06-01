import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/attendance_history_model.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/utils/secure_storage.dart';
import 'package:flutter/foundation.dart';

class AttendanceService {
  final ApiConfig _apiConfig = ApiConfig.instance;
  final SecureStorage _secureStorage = SecureStorage();

  // Get attendance history for the current user
  Future<List<AttendanceHistoryModel>> getAttendanceHistory() async {
    try {
      // First, try to get token from secure storage
      String? token = await _secureStorage.getToken();
      
      // If not found, try from SharedPreferences as fallback
      if (token == null) {
        debugPrint('🔒 Token not found in SecureStorage, trying SharedPreferences');
        final prefs = await SharedPreferences.getInstance();
        token = prefs.getString('auth_token');
        
        // If found in SharedPreferences, save to SecureStorage for future use
        if (token != null) {
          debugPrint('🔒 Token found in SharedPreferences, saving to SecureStorage');
          await _secureStorage.storeToken(token);
        }
      }
      
      if (token == null) {
        debugPrint('❌ Authentication token not found in any storage');
        throw Exception('Authentication token not found');
      }
      
      debugPrint('✅ Token retrieved successfully (${token.length} characters)');

      // Prepare the request
      final url = Uri.parse('${_apiConfig.baseUrl}/api/student/attendance/history');
      debugPrint('🔍 Fetching attendance history from: $url');
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      // Check if the request was successful
      if (response.statusCode == 200) {
        debugPrint('✅ Attendance history API response status: Success (200)');
        final Map<String, dynamic> responseData = json.decode(response.body);
        
        if (responseData['status'] == 'success' && responseData['data'] != null) {
          final List<dynamic> attendanceData = responseData['data'];
          debugPrint('📊 Successfully retrieved ${attendanceData.length} attendance records');
          return attendanceData
              .map((item) => AttendanceHistoryModel.fromJson(item))
              .toList();
        } else {
          debugPrint('⚠️ API response success but no data: ${responseData['status']}');
          // Return empty list if no data
          return [];
        }
      } else if (response.statusCode == 401) {
        debugPrint('❌ Attendance history API unauthorized (401) - token may be expired');
        throw Exception('Authentication token expired or invalid');
      } else {
        debugPrint('❌ Attendance history API error: ${response.statusCode}');
        throw Exception('Failed to load attendance history: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('❌ Error fetching attendance history: $e');
      // Return empty list on error
      return [];
    }
  }

  // Get today's attendance history for the current user
  Future<List<AttendanceHistoryModel>> getTodayAttendanceHistory() async {
    try {
      debugPrint('🔍 Fetching today\'s attendance history');
      
      // Get all attendance history
      final allHistory = await getAttendanceHistory();
      
      // Filter for today's records
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      
      final todayRecords = allHistory.where((record) {
        final recordDate = DateTime(
          record.dateTime.year,
          record.dateTime.month,
          record.dateTime.day,
        );
        return recordDate.isAtSameMomentAs(today);
      }).toList();
      
      debugPrint('📊 Found ${todayRecords.length} attendance records for today');
      return todayRecords;
    } catch (e) {
      debugPrint('❌ Error fetching today\'s attendance history: $e');
      return [];
    }
  }
} 