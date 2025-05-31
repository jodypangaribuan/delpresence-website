import 'dart:io';
import 'dart:async';
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
    } on SocketException {
      // Handle specific network connection errors
      debugPrint('Error fetching student schedules: No internet connection');
      
      // Return mock data for offline mode
      if (kDebugMode) {
        return _getMockSchedules();
      }
      
      throw Exception('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } on TimeoutException {
      debugPrint('Error fetching student schedules: Connection timeout');
      
      // Return mock data for offline mode
      if (kDebugMode) {
        return _getMockSchedules();
      }
      
      throw Exception('Waktu koneksi habis. Coba lagi nanti.');
    } catch (e) {
      // Handle any exceptions
      debugPrint('Exception while fetching student schedules: $e');
      throw Exception('Terjadi kesalahan saat mengambil jadwal: $e');
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
    } on SocketException {
      // Handle specific network connection errors
      debugPrint('Error fetching academic years: No internet connection');
      
      // Return mock data for offline mode
      if (kDebugMode) {
        return _getMockAcademicYears();
      }
      
      throw Exception('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } on TimeoutException {
      debugPrint('Error fetching academic years: Connection timeout');
      
      // Return mock data for offline mode
      if (kDebugMode) {
        return _getMockAcademicYears();
      }
      
      throw Exception('Waktu koneksi habis. Coba lagi nanti.');
    } catch (e) {
      debugPrint('Exception while fetching academic years: $e');
      throw Exception('Terjadi kesalahan saat mengambil tahun akademik: $e');
    }
  }
  
  // Mock data for offline testing
  List<ScheduleModel> _getMockSchedules() {
    return [
      ScheduleModel.fromJson({
        'id': 1,
        'course_id': 101,
        'course_code': 'CS101',
        'course_name': 'Pemrograman Dasar',
        'day': 'Senin',
        'start_time': '08:00',
        'end_time': '10:30',
        'room_name': 'Lab Komputer 1',
        'building_name': 'Gedung A',
        'lecturer_id': 201,
        'lecturer_name': 'Dr. Budi Santoso',
        'student_group_id': 301,
        'student_group_name': 'Kelas A - Informatika',
        'academic_year_id': 1,
        'academic_year_name': '2023/2024 Genap',
        'capacity': 30,
        'enrolled': 25,
        'semester': 'Genap',
      }),
      ScheduleModel.fromJson({
        'id': 2,
        'course_id': 102,
        'course_code': 'CS201',
        'course_name': 'Algoritma dan Struktur Data',
        'day': 'Rabu',
        'start_time': '13:00',
        'end_time': '15:30',
        'room_name': 'Ruang 201',
        'building_name': 'Gedung B',
        'lecturer_id': 202,
        'lecturer_name': 'Dr. Siti Rahayu',
        'student_group_id': 301,
        'student_group_name': 'Kelas A - Informatika',
        'academic_year_id': 1,
        'academic_year_name': '2023/2024 Genap',
        'capacity': 35,
        'enrolled': 30,
        'semester': 'Genap',
      }),
      ScheduleModel.fromJson({
        'id': 3,
        'course_id': 103,
        'course_code': 'CS301',
        'course_name': 'Pengembangan Aplikasi Mobile',
        'day': 'Jumat',
        'start_time': '09:30',
        'end_time': '12:00',
        'room_name': 'Lab Mobile',
        'building_name': 'Gedung C',
        'lecturer_id': 203,
        'lecturer_name': 'Dr. Ahmad Fauzi',
        'student_group_id': 301,
        'student_group_name': 'Kelas A - Informatika',
        'academic_year_id': 1,
        'academic_year_name': '2023/2024 Genap',
        'capacity': 25,
        'enrolled': 22,
        'semester': 'Genap',
      }),
    ];
  }
  
  List<Map<String, dynamic>> _getMockAcademicYears() {
    return [
      {
        'id': 1,
        'name': '2023/2024 Genap',
        'start_date': '2024-01-15',
        'end_date': '2024-06-30',
        'is_active': true,
      },
      {
        'id': 2,
        'name': '2023/2024 Ganjil',
        'start_date': '2023-08-15',
        'end_date': '2023-12-31',
        'is_active': false,
      },
    ];
  }
} 