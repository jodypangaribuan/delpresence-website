import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/attendance_history_model.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/utils/secure_storage.dart';

class AttendanceService {
  final ApiConfig _apiConfig = ApiConfig.instance;
  final SecureStorage _secureStorage = SecureStorage();

  // Get attendance history for the current user
  Future<List<AttendanceHistoryModel>> getAttendanceHistory() async {
    try {
      // Get the auth token
      final token = await _secureStorage.getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      // Prepare the request
      final url = Uri.parse('${_apiConfig.baseUrl}/api/student/attendance/history');
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      // Check if the request was successful
      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        
        if (responseData['status'] == 'success' && responseData['data'] != null) {
          final List<dynamic> attendanceData = responseData['data'];
          return attendanceData
              .map((item) => AttendanceHistoryModel.fromJson(item))
              .toList();
        } else {
          // Return empty list if no data
          return [];
        }
      } else {
        throw Exception('Failed to load attendance history: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching attendance history: $e');
      // Return empty list on error
      return [];
    }
  }

  // Get today's attendance history for the current user
  Future<List<AttendanceHistoryModel>> getTodayAttendanceHistory() async {
    try {
      // Get all attendance history
      final allHistory = await getAttendanceHistory();
      
      // Filter for today's records
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      
      return allHistory.where((record) {
        final recordDate = DateTime(
          record.dateTime.year,
          record.dateTime.month,
          record.dateTime.day,
        );
        return recordDate.isAtSameMomentAs(today);
      }).toList();
    } catch (e) {
      print('Error fetching today\'s attendance history: $e');
      return [];
    }
  }
} 