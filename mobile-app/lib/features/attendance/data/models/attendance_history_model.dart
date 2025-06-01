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
