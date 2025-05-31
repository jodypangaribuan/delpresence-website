import 'package:flutter/material.dart';

class ScheduleModel {
  final int id;
  final int courseId;
  final String courseCode;
  final String courseName;
  final String day;
  final String startTime;
  final String endTime;
  final String roomName;
  final String buildingName;
  final int lecturerId;
  final String lecturerName;
  final int studentGroupId;
  final String studentGroupName;
  final int academicYearId;
  final String academicYearName;
  final int capacity;
  final int enrolled;
  final String? semester;
  final String status; // 'Akan Datang', 'Sedang Berlangsung', 'Selesai'

  ScheduleModel({
    required this.id,
    required this.courseId,
    required this.courseCode,
    required this.courseName,
    required this.day,
    required this.startTime,
    required this.endTime,
    required this.roomName,
    required this.buildingName,
    required this.lecturerId,
    required this.lecturerName,
    required this.studentGroupId,
    required this.studentGroupName,
    required this.academicYearId,
    required this.academicYearName,
    required this.capacity,
    required this.enrolled,
    this.semester,
    required this.status,
  });

  // Get status color based on current status
  Color getStatusColor() {
    switch (status) {
      case 'Sedang Berlangsung':
        return const Color(0xFF43A047); // Green for active
      case 'Akan Datang':
        return const Color(0xFF1976D2); // Blue for upcoming
      case 'Hari Ini':
        return const Color(0xFFFFA000); // Orange for today
      case 'Selesai':
        return const Color(0xFF616161); // Grey for completed
      case 'Dibatalkan':
        return const Color(0xFFE53935); // Red for cancelled
      default:
        return const Color(0xFF616161); // Default grey
    }
  }

  // Factory method to create model from JSON
  factory ScheduleModel.fromJson(Map<String, dynamic> json) {
    // Determine status based on schedule time
    String scheduleStatus = 'Akan Datang';
    final now = DateTime.now();
    final dayOfWeek = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'][now.weekday % 7];
    final currentTimeMinutes = now.hour * 60 + now.minute;
    
    final day = json['day']?.toString().toLowerCase() ?? '';
    final startTime = json['start_time'] ?? '';
    final endTime = json['end_time'] ?? '';
    
    if (startTime.isNotEmpty && endTime.isNotEmpty) {
      final startTimeParts = startTime.split(':');
      final endTimeParts = endTime.split(':');
      
      if (startTimeParts.length >= 2 && endTimeParts.length >= 2) {
        final startHour = int.tryParse(startTimeParts[0]) ?? 0;
        final startMinute = int.tryParse(startTimeParts[1]) ?? 0;
        final endHour = int.tryParse(endTimeParts[0]) ?? 0;
        final endMinute = int.tryParse(endTimeParts[1]) ?? 0;
        
        final startTimeMinutes = startHour * 60 + startMinute;
        final endTimeMinutes = endHour * 60 + endMinute;
        
        if (day == dayOfWeek) {
          scheduleStatus = 'Hari Ini';
          if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes) {
            scheduleStatus = 'Sedang Berlangsung';
          } else if (currentTimeMinutes > endTimeMinutes) {
            scheduleStatus = 'Selesai';
          }
        }
      }
    }
    
    return ScheduleModel(
      id: json['id'] ?? 0,
      courseId: json['course_id'] ?? 0,
      courseCode: json['course_code'] ?? '',
      courseName: json['course_name'] ?? '',
      day: json['day'] ?? '',
      startTime: json['start_time'] ?? '',
      endTime: json['end_time'] ?? '',
      roomName: json['room_name'] ?? '',
      buildingName: json['building_name'] ?? '',
      lecturerId: json['lecturer_id'] ?? 0,
      lecturerName: json['lecturer_name'] ?? '',
      studentGroupId: json['student_group_id'] ?? 0,
      studentGroupName: json['student_group_name'] ?? '',
      academicYearId: json['academic_year_id'] ?? 0,
      academicYearName: json['academic_year_name'] ?? '',
      capacity: json['capacity'] ?? 0,
      enrolled: json['enrolled'] ?? 0,
      semester: json['semester'],
      status: scheduleStatus,
    );
  }

  // Get days of the week in Indonesian
  static List<String> getDaysOfWeek() {
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  }

  // Get schedules for a specific day
  static List<ScheduleModel> getSchedulesByDay(List<ScheduleModel> schedules, String day) {
    return schedules.where((schedule) => schedule.day.toLowerCase() == day.toLowerCase()).toList();
  }
}
