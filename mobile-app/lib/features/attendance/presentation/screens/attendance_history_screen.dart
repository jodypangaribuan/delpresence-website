import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/utils/toast_utils.dart';
import '../../data/models/attendance_history_model.dart';

class AttendanceHistoryScreen extends StatefulWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  State<AttendanceHistoryScreen> createState() =>
      _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends State<AttendanceHistoryScreen> {
  late List<AttendanceHistoryModel> _attendanceRecords;
  late Map<String, List<AttendanceHistoryModel>> _groupedRecords;
  String _todayFormattedDate = '';  // Initialize with empty string

  @override
  void initState() {
    super.initState();
    _initializeDateFormatting();
    _loadAttendanceData();
  }

  void _initializeDateFormatting() {
    // Initialize locale data for Indonesian
    initializeDateFormatting('id_ID', null).then((_) {
      // Format today's date in Indonesian
      final now = DateTime.now();
      setState(() {
        try {
          final dateFormat = DateFormat('EEEE, d MMMM yyyy', 'id_ID');
          _todayFormattedDate = dateFormat.format(now);
        } catch (e) {
          // Fallback if locale data is not initialized
          _todayFormattedDate = "${_getDayName(now.weekday)}, ${now.day} ${_getMonthName(now.month)} ${now.year}";
        }
      });
    });
  }

  // Helper method to get Indonesian day name
  String _getDayName(int weekday) {
    final List<String> dayNames = [
      'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
    ];
    return dayNames[weekday - 1];
  }

  // Helper method to get Indonesian month name
  String _getMonthName(int month) {
    switch (month) {
      case 1: return 'Januari';
      case 2: return 'Februari';
      case 3: return 'Maret';
      case 4: return 'April';
      case 5: return 'Mei';
      case 6: return 'Juni';
      case 7: return 'Juli';
      case 8: return 'Agustus';
      case 9: return 'September';
      case 10: return 'Oktober';
      case 11: return 'November';
      case 12: return 'Desember';
      default: return '';
    }
  }

  void _loadAttendanceData() {
    // Load sample data for now, this would be replaced with an API call in production
    _attendanceRecords = AttendanceHistoryModel.getSampleData();
    _groupedRecords = AttendanceHistoryModel.groupByDate(_attendanceRecords);
  }

  void _fetchAttendanceHistory() {
    // Show loading indicator
    ToastUtils.showInfoToast(context, 'Mengambil data absensi terbaru...');
    
    // This would be replaced with an actual API call in production
    // For now, just reload the sample data with a slight delay to simulate network request
    Future.delayed(const Duration(milliseconds: 800), () {
      setState(() {
        _loadAttendanceData();
      });
      ToastUtils.showSuccessToast(context, 'Data absensi berhasil diperbarui');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0, // Prevents color change when scrolled
        centerTitle: true,
        title: const Text(
          'Riwayat Absensi',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, color: Colors.black87),
            onPressed: _fetchAttendanceHistory,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Divider(
            height: 1,
            thickness: 1,
            color: Colors.grey[200],
          ),
        ),
      ),
      body: Column(
        children: [
          _buildTodayHeader(),
          Expanded(
            child: _buildAttendanceList(),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            offset: const Offset(0, 2),
            blurRadius: 5,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _todayFormattedDate,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Riwayat Absensi Hari Ini',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceList() {
    if (_groupedRecords.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history_outlined,
              size: 80,
              color: Colors.grey[200],
            ),
            const SizedBox(height: 16),
            Text(
              'Tidak ada riwayat absensi',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 24),
      itemCount: _groupedRecords.keys.length,
      itemBuilder: (context, index) {
        final dateKey = _groupedRecords.keys.elementAt(index);
        final records = _groupedRecords[dateKey]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDateHeader(dateKey),
            ...records.map((record) => _buildAttendanceItem(record)),
          ],
        );
      },
    );
  }

  Widget _buildDateHeader(String dateKey) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            dateKey,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          GestureDetector(
            onTap: () {
              // Handle "See More" tap
              ToastUtils.showInfoToast(
                  context, 'Lihat semua absensi untuk $dateKey');
            },
            child: const Text(
              'See More',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceItem(AttendanceHistoryModel record) {
    // Determine icon and color based on status
    IconData statusIcon;
    Color statusColor;

    switch (record.status) {
      case 'Hadir':
        statusIcon = Icons.check_circle_outline_rounded;
        statusColor = Colors.green;
        break;
      case 'Terlambat':
        statusIcon = Icons.watch_later_outlined;
        statusColor = Colors.orange;
        break;
      case 'Alpa':
        statusIcon = Icons.cancel_outlined;
        statusColor = Colors.red;
        break;
      default:
        statusIcon = Icons.check_circle_outline_rounded;
        statusColor = Colors.green;
    }

    return Column(
      children: [
        InkWell(
          onTap: () {
            // Handle attendance item tap
            ToastUtils.showInfoToast(
                context, 'Detail absensi: ${record.courseTitle}');
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    statusIcon,
                    size: 18,
                    color: statusColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        record.courseTitle,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        record.roomName,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      record.formattedTime,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        record.status,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w500,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        Divider(
          height: 1,
          thickness: 1,
          color: Colors.grey[100],
          indent: 56,
          endIndent: 0,
        ),
      ],
    );
  }
}

class AttendanceHistoryItem extends StatelessWidget {
  final String courseTitle;
  final String room;
  final String time;

  const AttendanceHistoryItem({
    super.key,
    required this.courseTitle,
    required this.room,
    required this.time,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.check_circle_outline_rounded,
                  size: 18,
                  color: Colors.black54,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      courseTitle,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      room,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                time,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
        Divider(
          height: 1,
          thickness: 1,
          color: Colors.grey[100],
          indent: 56,
          endIndent: 0,
        ),
      ],
    );
  }
}

// For showing all attendance details of a specific day
class SeeAllAttendanceButton extends StatelessWidget {
  final VoidCallback onTap;

  const SeeAllAttendanceButton({
    super.key,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'See All',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down,
              size: 18,
              color: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }
}
