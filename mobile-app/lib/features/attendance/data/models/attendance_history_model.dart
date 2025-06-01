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
  final String roomName;
  final DateTime dateTime;
  final String status; // 'Hadir', 'Terlambat', 'Alpa'

  AttendanceHistoryModel({
    required this.id,
    required this.courseTitle,
    required this.roomName,
    required this.dateTime,
    required this.status,
  });

  String get formattedTime {
    return DateFormat('HH.mm').format(dateTime);
  }

  String get formattedDate {
    _initializeLocale();
    return DateFormat('EEEE, d MMM yyyy', 'id_ID').format(dateTime);
  }

  factory AttendanceHistoryModel.fromJson(Map<String, dynamic> json) {
    return AttendanceHistoryModel(
      id: json['id'] ?? '',
      courseTitle: json['courseTitle'] ?? '',
      roomName: json['roomName'] ?? '',
      dateTime: json['dateTime'] != null
          ? DateTime.parse(json['dateTime'])
          : DateTime.now(),
      status: json['status'] ?? 'Hadir',
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
        roomName: 'GD 515 - 156',
        dateTime: DateTime(now.year, now.month, now.day, 8, 5),
        status: 'Hadir',
      ),
      AttendanceHistoryModel(
        id: '2',
        courseTitle: 'Aljabar Linier',
        roomName: 'GD Audit',
        dateTime: DateTime(now.year, now.month, now.day, 11, 47),
        status: 'Terlambat',
      ),
      AttendanceHistoryModel(
        id: '3',
        courseTitle: 'Keamanan Perangkat Lunak',
        roomName: 'GD 525',
        dateTime: DateTime(now.year, now.month, now.day, 12, 17),
        status: 'Hadir',
      ),
      AttendanceHistoryModel(
        id: '4',
        courseTitle: 'Desain Pengalaman Pengguna',
        roomName: 'GD 517',
        dateTime: DateTime(now.year, now.month, now.day, 14, 8),
        status: 'Hadir',
      ),

      // Yesterday's attendance
      AttendanceHistoryModel(
        id: '5',
        courseTitle: 'Bahasa Inggris III',
        roomName: 'GD 515 - 156',
        dateTime:
            DateTime(yesterday.year, yesterday.month, yesterday.day, 8, 5),
        status: 'Hadir',
      ),
      AttendanceHistoryModel(
        id: '6',
        courseTitle: 'Pengujian Keamanan Perangkat Lunak',
        roomName: 'GD 515 - 156',
        dateTime:
            DateTime(yesterday.year, yesterday.month, yesterday.day, 8, 5),
        status: 'Terlambat',
      ),
      AttendanceHistoryModel(
        id: '7',
        courseTitle: 'Sistem Komputasi Awan',
        roomName: 'GD 515 - 156',
        dateTime:
            DateTime(yesterday.year, yesterday.month, yesterday.day, 8, 5),
        status: 'Hadir',
      ),
      AttendanceHistoryModel(
        id: '8',
        courseTitle: 'Sistem Komputasi Awan',
        roomName: 'GD 515 - 156',
        dateTime:
            DateTime(yesterday.year, yesterday.month, yesterday.day, 8, 5),
        status: 'Hadir',
      ),

      // Two days ago
      AttendanceHistoryModel(
        id: '9',
        courseTitle: 'Bahasa Inggris III',
        roomName: 'GD 515 - 156',
        dateTime:
            DateTime(twoDaysAgo.year, twoDaysAgo.month, twoDaysAgo.day, 8, 5),
        status: 'Hadir',
      ),
      AttendanceHistoryModel(
        id: '10',
        courseTitle: 'Pengujian Keamanan Perangkat Lunak',
        roomName: 'GD 515 - 156',
        dateTime:
            DateTime(twoDaysAgo.year, twoDaysAgo.month, twoDaysAgo.day, 8, 5),
        status: 'Terlambat',
      ),
      AttendanceHistoryModel(
        id: '11',
        courseTitle: 'Sistem Komputasi Awan',
        roomName: 'GD 515 - 156',
        dateTime:
            DateTime(twoDaysAgo.year, twoDaysAgo.month, twoDaysAgo.day, 8, 5),
        status: 'Alpa',
      ),
      AttendanceHistoryModel(
        id: '12',
        courseTitle: 'Sistem Komputasi Awan',
        roomName: 'GD 515 - 156',
        dateTime:
            DateTime(twoDaysAgo.year, twoDaysAgo.month, twoDaysAgo.day, 8, 5),
        status: 'Hadir',
      ),

      // Three days ago
      AttendanceHistoryModel(
        id: '13',
        courseTitle: 'Sistem Komputasi Awan',
        roomName: 'GD 515 - 156',
        dateTime: DateTime(
            threeDaysAgo.year, threeDaysAgo.month, threeDaysAgo.day, 8, 5),
        status: 'Hadir',
      ),
      AttendanceHistoryModel(
        id: '14',
        courseTitle: 'Sistem Komputasi Awan',
        roomName: 'GD 515 - 156',
        dateTime: DateTime(
            threeDaysAgo.year, threeDaysAgo.month, threeDaysAgo.day, 8, 5),
        status: 'Hadir',
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
