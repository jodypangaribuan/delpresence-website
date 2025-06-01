import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../../../core/constants/colors.dart';
import '../../data/models/attendance_history_model.dart';
import '../../../../core/utils/toast_utils.dart';
import '../../data/services/attendance_service.dart';

class TodayAttendanceHistoryPage extends StatefulWidget {
  const TodayAttendanceHistoryPage({super.key});

  @override
  State<TodayAttendanceHistoryPage> createState() =>
      _TodayAttendanceHistoryPageState();
}

class _TodayAttendanceHistoryPageState
    extends State<TodayAttendanceHistoryPage> {
  late List<AttendanceHistoryModel> _todayRecords;
  final AttendanceService _attendanceService = AttendanceService();
  bool _initialized = false;
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    // Initialize locale data for Indonesian
    initializeDateFormatting('id_ID', null).then((_) {
      if (mounted) {
        setState(() {
          _initialized = true;
          _loadTodayAttendance();
        });
      }
    }).catchError((error) {
      print('Error initializing locale: $error');
      if (mounted) {
        setState(() {
          _initialized = true; // Still mark as initialized to avoid hanging
          _loadTodayAttendance();
        });
      }
    });
    
    _todayRecords = [];
  }

  Future<void> _loadTodayAttendance() async {
    if (!_initialized) return;
    
    setState(() {
      _isLoading = true;
      _hasError = false;
    });
    
    try {
      final records = await _attendanceService.getTodayAttendanceHistory();
      
      if (mounted) {
        setState(() {
          _todayRecords = records;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = 'Gagal memuat data: ${e.toString()}';
          _isLoading = false;
          
          // Use sample data as fallback in case of error
          final allRecords = AttendanceHistoryModel.getSampleData();
          
          // Filter records for today
          final now = DateTime.now();
          final today = DateTime(now.year, now.month, now.day);
          
          _todayRecords = allRecords.where((record) {
            final recordDate = DateTime(
              record.dateTime.year,
              record.dateTime.month,
              record.dateTime.day,
            );
            return recordDate.isAtSameMomentAs(today);
          }).toList();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0, // Prevents color change when scrolled
        centerTitle: true,
        title: const Text(
          'Riwayat Hari Ini',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        automaticallyImplyLeading:
            false, // Remove back button since it's in navbar
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Divider(
            height: 1,
            thickness: 1,
            color: Colors.grey[200],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, color: Colors.black87),
            onPressed: _loadTodayAttendance,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildTodayDateHeader(),
          Expanded(
            child: _isLoading 
                ? _buildLoadingIndicator() 
                : _hasError 
                    ? _buildErrorView() 
                    : _buildTodayAttendanceList(),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text(
            'Memuat data absensi...',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 80,
            color: Colors.red[300],
          ),
          const SizedBox(height: 16),
          Text(
            'Terjadi kesalahan',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.red[700],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadTodayAttendance,
            child: const Text('Coba Lagi'),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayDateHeader() {
    final today = DateTime.now();

    // Use Indonesian locale for date formatting
    final dayNames = [
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
      'Minggu'
    ];

    final monthNames = {
      1: 'Januari',
      2: 'Februari',
      3: 'Maret',
      4: 'April',
      5: 'Mei',
      6: 'Juni',
      7: 'Juli',
      8: 'Agustus',
      9: 'September',
      10: 'Oktober',
      11: 'November',
      12: 'Desember'
    };

    final dayName = dayNames[today.weekday - 1]; // weekday starts at 1
    final formattedDate =
        '$dayName, ${today.day} ${monthNames[today.month]} ${today.year}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      color: Colors.white,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primary, width: 1),
            ),
            child: Text(
              formattedDate,
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayAttendanceList() {
    if (_todayRecords.isEmpty) {
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
              'Belum ada absensi hari ini',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Scan QR code atau gunakan Face Recognition untuk absen',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[400],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 24),
      itemCount: _todayRecords.length,
      itemBuilder: (context, index) {
        final record = _todayRecords[index];
        return _buildAttendanceItem(record);
      },
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
