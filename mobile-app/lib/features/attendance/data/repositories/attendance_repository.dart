import '../models/attendance_history_model.dart';
import '../services/attendance_api_service.dart';

class AttendanceRepository {
  final AttendanceApiService _apiService;

  AttendanceRepository({required AttendanceApiService apiService})
      : _apiService = apiService;

  /// Get attendance history for the current user
  Future<List<AttendanceHistoryModel>> getAttendanceHistory({
    String? startDate,
    String? endDate,
  }) async {
    try {
      return await _apiService.getAttendanceHistory(
        startDate: startDate,
        endDate: endDate,
      );
    } catch (e) {
      // Return empty list on error
      return [];
    }
  }

  /// Get today's attendance history
  Future<List<AttendanceHistoryModel>> getTodayAttendanceHistory() async {
    final today = DateTime.now();
    final formattedDate = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    
    try {
      return await _apiService.getAttendanceHistory(
        startDate: formattedDate,
        endDate: formattedDate,
      );
    } catch (e) {
      // Return empty list on error
      return [];
    }
  }
} 