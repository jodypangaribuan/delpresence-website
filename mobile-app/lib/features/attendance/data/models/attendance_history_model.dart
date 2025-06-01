import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';

class AttendanceHistoryModel {
  static bool _initialized = false;

  // Initialize the locale data
  static void _initializeLocale() {
    if (!_initialized) {
      try {
        initializeDateFormatting('id_ID', null).then((_) {
          _initialized = true;
        });
      } catch (e) {
        print('Error initializing locale: $e');
        // Mark as initialized anyway to prevent repeated attempts
        _initialized = true;
      }
    }
  }

  final String id;
  final String courseTitle;
  final String courseCode;
  final String roomName;
  final String buildingName;
  final String lecturerName;
  final DateTime dateTime;
  final String status; // 'Hadir', 'Terlambat', 'Alpa'
  final String verificationType; // 'QR_CODE', 'FACE_RECOGNITION'

  AttendanceHistoryModel({
    required this.id,
    required this.courseTitle,
    required this.courseCode,
    required this.roomName,
    required this.buildingName,
    required this.lecturerName,
    required this.dateTime,
    required this.status,
    required this.verificationType,
  });

  String get formattedTime {
    return DateFormat('HH.mm').format(dateTime);
  }

  String get formattedDate {
    _initializeLocale();
    return DateFormat('EEEE, d MMM yyyy', 'id_ID').format(dateTime);
  }
  
  String get statusInIndonesian {
    switch (status) {
      case 'PRESENT':
        return 'Hadir';
      case 'LATE':
        return 'Terlambat';
      case 'ABSENT':
        return 'Alpa';
      case 'EXCUSED':
        return 'Izin';
      default:
        return status;
    }
  }
  
  Color get statusColor {
    switch (status) {
      case 'PRESENT':
        return Colors.green;
      case 'LATE':
        return Colors.orange;
      case 'ABSENT':
        return Colors.red;
      case 'EXCUSED':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
  
  IconData get statusIcon {
    switch (status) {
      case 'PRESENT':
        return Icons.check_circle_outline_rounded;
      case 'LATE':
        return Icons.watch_later_outlined;
      case 'ABSENT':
        return Icons.cancel_outlined;
      case 'EXCUSED':
        return Icons.event_note_outlined;
      default:
        return Icons.help_outline_rounded;
    }
  }

  factory AttendanceHistoryModel.fromJson(Map<String, dynamic> json) {
    // Parse date and time from API format
    String dateStr = json['date'] ?? '';
    String sessionStartTimeStr = json['session_start_time'] ?? '';
    String checkInTimeStr = json['check_in_time'] ?? '';
    
    // Prefer check-in time if available, otherwise use session start time
    String timeToUse = checkInTimeStr.isNotEmpty ? checkInTimeStr : sessionStartTimeStr;
    
    DateTime dateTime;
    try {
      // If we have both date and time, combine them
      if (dateStr.isNotEmpty && timeToUse.isNotEmpty) {
        dateTime = DateTime.parse('$dateStr $timeToUse');
      } else {
        // Fallback to current time if data is missing
        dateTime = DateTime.now();
      }
    } catch (e) {
      print('Error parsing date/time: $e');
      dateTime = DateTime.now();
    }
    
    return AttendanceHistoryModel(
      id: json['id']?.toString() ?? '',
      courseTitle: json['course_name'] ?? '',
      courseCode: json['course_code'] ?? '',
      roomName: json['room_name'] ?? '',
      buildingName: json['building_name'] ?? '',
      lecturerName: json['lecturer_name'] ?? '',
      dateTime: dateTime,
      status: json['status'] ?? 'PRESENT',
      verificationType: json['verification_method'] ?? '',
    );
  }

  // Sample data for demonstration
  static List<AttendanceHistoryModel> getSampleData() {
    _initializeLocale();

    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));
    final twoDaysAgo = now.subtract(const Duration(days: 2));
    final threeDaysAgo = now.subtract(const Duration(days: 3));

    return [
      // Today's attendance
      AttendanceHistoryModel(
        id: '1',
        courseTitle: 'Proyek Akhir II',
        courseCode: 'IF1234',
        roomName: 'GD 515',
        buildingName: 'Gedung Informatika',
        lecturerName: 'Dr. Budi Santoso',
        dateTime: DateTime(now.year, now.month, now.day, 8, 5),
        status: 'PRESENT',
        verificationType: 'QR_CODE',
      ),
      AttendanceHistoryModel(
        id: '2',
        courseTitle: 'Aljabar Linier',
        courseCode: 'MT1001',
        roomName: 'Auditorium',
        buildingName: 'Gedung Matematika',
        lecturerName: 'Dr. Ayu Putri',
        dateTime: DateTime(now.year, now.month, now.day, 11, 47),
        status: 'LATE',
        verificationType: 'QR_CODE',
      ),
      AttendanceHistoryModel(
        id: '3',
        courseTitle: 'Keamanan Perangkat Lunak',
        courseCode: 'IF2456',
        roomName: 'Lab Komputer',
        buildingName: 'Gedung Informatika',
        lecturerName: 'Dr. Candra Wijaya',
        dateTime: DateTime(now.year, now.month, now.day, 12, 17),
        status: 'PRESENT',
        verificationType: 'FACE_RECOGNITION',
      ),
      AttendanceHistoryModel(
        id: '4',
        courseTitle: 'Desain Pengalaman Pengguna',
        courseCode: 'IF3780',
        roomName: 'Studio Desain',
        buildingName: 'Gedung Multimedia',
        lecturerName: 'Dr. Dian Pratiwi',
        dateTime: DateTime(now.year, now.month, now.day, 14, 8),
        status: 'PRESENT',
        verificationType: 'QR_CODE',
      ),

      // Yesterday's attendance
      AttendanceHistoryModel(
        id: '5',
        courseTitle: 'Bahasa Inggris III',
        courseCode: 'LG2003',
        roomName: 'Ruang Diskusi',
        buildingName: 'Gedung Bahasa',
        lecturerName: 'Mrs. Elizabeth Johnson',
        dateTime:
            DateTime(yesterday.year, yesterday.month, yesterday.day, 8, 5),
        status: 'PRESENT',
        verificationType: 'QR_CODE',
      ),
      AttendanceHistoryModel(
        id: '6',
        courseTitle: 'Pengujian Keamanan Perangkat Lunak',
        courseCode: 'IF2457',
        roomName: 'Lab Keamanan',
        buildingName: 'Gedung Informatika',
        lecturerName: 'Dr. Eko Prasetyo',
        dateTime:
            DateTime(yesterday.year, yesterday.month, yesterday.day, 10, 15),
        status: 'LATE',
        verificationType: 'QR_CODE',
      ),
      AttendanceHistoryModel(
        id: '7',
        courseTitle: 'Sistem Komputasi Awan',
        courseCode: 'IF3890',
        roomName: 'Lab Server',
        buildingName: 'Gedung Informatika',
        lecturerName: 'Dr. Faisal Rahman',
        dateTime:
            DateTime(yesterday.year, yesterday.month, yesterday.day, 13, 30),
        status: 'PRESENT',
        verificationType: 'FACE_RECOGNITION',
      ),
      
      // Two days ago
      AttendanceHistoryModel(
        id: '9',
        courseTitle: 'Bahasa Inggris III',
        courseCode: 'LG2003',
        roomName: 'Ruang Diskusi',
        buildingName: 'Gedung Bahasa',
        lecturerName: 'Mrs. Elizabeth Johnson',
        dateTime:
            DateTime(twoDaysAgo.year, twoDaysAgo.month, twoDaysAgo.day, 8, 5),
        status: 'PRESENT',
        verificationType: 'QR_CODE',
      ),
      AttendanceHistoryModel(
        id: '10',
        courseTitle: 'Pengujian Keamanan Perangkat Lunak',
        courseCode: 'IF2457',
        roomName: 'Lab Keamanan',
        buildingName: 'Gedung Informatika',
        lecturerName: 'Dr. Eko Prasetyo',
        dateTime:
            DateTime(twoDaysAgo.year, twoDaysAgo.month, twoDaysAgo.day, 10, 15),
        status: 'LATE',
        verificationType: 'QR_CODE',
      ),
      AttendanceHistoryModel(
        id: '11',
        courseTitle: 'Sistem Komputasi Awan',
        courseCode: 'IF3890',
        roomName: 'Lab Server',
        buildingName: 'Gedung Informatika',
        lecturerName: 'Dr. Faisal Rahman',
        dateTime:
            DateTime(twoDaysAgo.year, twoDaysAgo.month, twoDaysAgo.day, 13, 30),
        status: 'ABSENT',
        verificationType: '',
      ),
    ];
  }

  // Helper to group attendance records by date
  static Map<String, List<AttendanceHistoryModel>> groupByDate(
      List<AttendanceHistoryModel> attendances) {
    final Map<String, List<AttendanceHistoryModel>> grouped = {};

    for (var attendance in attendances) {
      final DateTime date = DateTime(
        attendance.dateTime.year,
        attendance.dateTime.month,
        attendance.dateTime.day,
      );

      String key;
      final DateTime today = DateTime(
        DateTime.now().year,
        DateTime.now().month,
        DateTime.now().day,
      );

      final DateTime yesterday = today.subtract(const Duration(days: 1));

      if (date.isAtSameMomentAs(today)) {
        key = 'Hari Ini';
      } else if (date.isAtSameMomentAs(yesterday)) {
        key = 'Kemarin';
      } else {
        // Format: "Rabu, 12 Apr 2025"
        key = DateFormat('EEEE, d MMM yyyy', 'id_ID').format(date);
      }

      if (!grouped.containsKey(key)) {
        grouped[key] = [];
      }

      grouped[key]!.add(attendance);
    }

    return grouped;
  }
}
