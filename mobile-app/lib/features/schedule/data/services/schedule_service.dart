import 'package:flutter/foundation.dart';
import '../../../../core/services/network_service.dart';
import '../models/schedule_model.dart';

class ScheduleService {
  final NetworkService _networkService;

  ScheduleService({required NetworkService networkService})
      : _networkService = networkService;

  /// Get all schedules for the current student
  Future<List<ScheduleModel>> getStudentSchedules({int? academicYearId}) async {
    try {
      // Build query parameters if academic year ID is provided
      Map<String, dynamic>? queryParams;
      if (academicYearId != null && academicYearId > 0) {
        queryParams = {'academic_year_id': academicYearId.toString()};
      }

      // Make the API call
      final response = await _networkService.get<Map<String, dynamic>>(
        '/api/student/schedules',
        queryParams: queryParams,
      );

      if (response.success && response.data != null) {
        final data = response.data!;
        
        // Check if the data has the expected structure
        if (data.containsKey('status') && 
            data['status'] == 'success' && 
            data.containsKey('data')) {
          
          // Parse the schedules list
          final List<dynamic> schedulesJson = data['data'];
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
        return [];
      }
    } catch (e) {
      // Handle any exceptions
      debugPrint('Exception while fetching student schedules: $e');
      return [];
    }
  }

  /// Get all academic years
  Future<List<Map<String, dynamic>>> getAcademicYears() async {
    try {
      final response = await _networkService.get<Map<String, dynamic>>(
        '/api/student/academic-years',
      );

      if (response.success && response.data != null) {
        final data = response.data!;
        
        if (data.containsKey('status') && 
            data['status'] == 'success' && 
            data.containsKey('data')) {
          
          final List<dynamic> academicYearsJson = data['data'];
          return academicYearsJson.cast<Map<String, dynamic>>();
        } else {
          debugPrint('Unexpected response format for academic years');
          return [];
        }
      } else {
        debugPrint('Error fetching academic years: ${response.errorMessage}');
        return [];
      }
    } catch (e) {
      debugPrint('Exception while fetching academic years: $e');
      return [];
    }
  }
} 