import 'package:flutter/material.dart';

class ScheduleModel {
  final String id;
  final String courseTitle;
  final String day;
  final String startTime;
  final String endTime;
  final String roomName;
  final String lecturerName;
  final String status; // 'Akan Datang', 'Sedang Berlangsung', 'Selesai'
  final int credits;

  ScheduleModel({
    required this.id,
    required this.courseTitle,
    required this.day,
    required this.startTime,
    required this.endTime,
    required this.roomName,
    required this.lecturerName,
    required this.status,
    required this.credits,
  });

  // Get status color based on current status
  Color getStatusColor() {
    switch (status) {
      case 'Sedang Berlangsung':
        return const Color(0xFF43A047); // Green for active
      case 'Akan Datang':
        return const Color(0xFF1976D2); // Blue for upcoming
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
    return ScheduleModel(
      id: json['id'] ?? '',
      courseTitle: json['course_title'] ?? '',
      day: json['day'] ?? '',
      startTime: json['start_time'] ?? '',
      endTime: json['end_time'] ?? '',
      roomName: json['room_name'] ?? '',
      lecturerName: json['lecturer_name'] ?? '',
      status: json['status'] ?? 'Akan Datang',
      credits: json['credits'] ?? 0,
    );
  }

  // Sample data for demonstration
  static List<ScheduleModel> getSampleSchedules() {
    return [
      // Senin
      ScheduleModel(
        id: '1',
        courseTitle: 'Pemrograman Mobile',
        day: 'Senin',
        startTime: '08:00',
        endTime: '10:30',
        roomName: 'Ruang 51',
        lecturerName: 'Dr. Ahmad Wijaya',
        status: 'Akan Datang',
        credits: 3,
      ),
      ScheduleModel(
        id: '2',
        courseTitle: 'Basis Data Lanjut',
        day: 'Senin',
        startTime: '13:00',
        endTime: '15:30',
        roomName: 'Lab Komputer 2',
        lecturerName: 'Prof. Ani Wijaya',
        status: 'Akan Datang',
        credits: 3,
      ),

      // Selasa
      ScheduleModel(
        id: '3',
        courseTitle: 'Bahasa Inggris III',
        day: 'Selasa',
        startTime: '09:30',
        endTime: '11:00',
        roomName: 'Ruang 42',
        lecturerName: 'Prof. Robert Smith',
        status: 'Akan Datang',
        credits: 2,
      ),
      ScheduleModel(
        id: '10',
        courseTitle: 'Keamanan Perangkat Lunak',
        day: 'Selasa',
        startTime: '13:00',
        endTime: '14:50',
        roomName: 'GD 515 - 156',
        lecturerName: 'Dr. Budi Santoso',
        status: 'Akan Datang',
        credits: 3,
      ),

      // Rabu
      ScheduleModel(
        id: '4',
        courseTitle: 'Pengujian Kualitas Perangkat Lunak',
        day: 'Rabu',
        startTime: '10:00',
        endTime: '12:30',
        roomName: 'Lab Software 1',
        lecturerName: 'Dr. Jessica Williams',
        status: 'Akan Datang',
        credits: 3,
      ),

      // Kamis
      ScheduleModel(
        id: '5',
        courseTitle: 'Desain Pengalaman Pengguna',
        day: 'Kamis',
        startTime: '08:00',
        endTime: '10:30',
        roomName: 'Ruang 38',
        lecturerName: 'Prof. Michael Brown',
        status: 'Sedang Berlangsung',
        credits: 3,
      ),
      ScheduleModel(
        id: '8',
        courseTitle: 'Keamanan Perangkat Lunak',
        day: 'Kamis',
        startTime: '08:00',
        endTime: '09:50',
        roomName: 'GD 515 - 156',
        lecturerName: 'Dr. Budi Santoso',
        status: 'Akan Datang',
        credits: 3,
      ),
      ScheduleModel(
        id: '9',
        courseTitle: 'Sistem Komputasi Awan',
        day: 'Kamis',
        startTime: '10:00',
        endTime: '11:50',
        roomName: 'GD 515 - 516',
        lecturerName: 'Dr. Siti Aminah',
        status: 'Akan Datang',
        credits: 3,
      ),
      ScheduleModel(
        id: '11',
        courseTitle: 'Bahasa Inggris III',
        day: 'Kamis',
        startTime: '13:00',
        endTime: '14:50',
        roomName: 'GD 214',
        lecturerName: 'Prof. Robert Smith',
        status: 'Akan Datang',
        credits: 2,
      ),

      // Jumat
      ScheduleModel(
        id: '6',
        courseTitle: 'Aljabar Linear',
        day: 'Jumat',
        startTime: '13:00',
        endTime: '15:30',
        roomName: 'Ruang 12',
        lecturerName: 'Dr. Lisa Davis',
        status: 'Selesai',
        credits: 3,
      ),
      ScheduleModel(
        id: '7',
        courseTitle: 'Pemrograman Mobile',
        day: 'Jumat',
        startTime: '08:00',
        endTime: '10:30',
        roomName: 'Lab Mobile',
        lecturerName: 'Dr. Ahmad Wijaya',
        status: 'Akan Datang',
        credits: 3,
      ),
    ];
  }

  // Get days of the week in Indonesian
  static List<String> getDaysOfWeek() {
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  }

  // Get schedules for a specific day
  static List<ScheduleModel> getSchedulesByDay(String day) {
    return getSampleSchedules()
        .where((schedule) => schedule.day == day)
        .toList();
  }
}
