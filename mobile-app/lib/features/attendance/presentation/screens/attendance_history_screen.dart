import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/utils/toast_utils.dart';
import '../../data/models/attendance_history_model.dart';
import '../../data/services/attendance_service.dart';

class AttendanceHistoryScreen extends StatefulWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  State<AttendanceHistoryScreen> createState() =>
      _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends State<AttendanceHistoryScreen> {
  late List<AttendanceHistoryModel> _attendanceRecords = [];
  late Map<String, List<AttendanceHistoryModel>> _groupedRecords = {};
  bool _isLoading = true;
  String? _errorMessage;
  final AttendanceService _attendanceService = AttendanceService();

  @override
  void initState() {
    super.initState();
    _loadAttendanceData();
  }

  Future<void> _loadAttendanceData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final attendanceHistory = await _attendanceService.getAttendanceHistory();
      
      if (mounted) {
        setState(() {
          _attendanceRecords = attendanceHistory;
          _groupedRecords = AttendanceHistoryModel.groupByDate(_attendanceRecords);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Gagal memuat data absensi: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchAttendanceHistory() async {
    // Show loading indicator
    ToastUtils.showInfoToast(context, 'Mengambil data absensi terbaru...');
    
    try {
      final attendanceHistory = await _attendanceService.getAttendanceHistory();
      
      if (mounted) {
        setState(() {
          _attendanceRecords = attendanceHistory;
          _groupedRecords = AttendanceHistoryModel.groupByDate(_attendanceRecords);
        });
        ToastUtils.showSuccessToast(context, 'Data absensi berhasil diperbarui');
      }
    } catch (e) {
      if (mounted) {
        ToastUtils.showErrorToast(context, 'Gagal memuat data absensi: $e');
      }
    }
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
      body: _isLoading
          ? _buildLoadingIndicator()
          : _errorMessage != null
              ? _buildErrorMessage()
              : _buildAttendanceList(),
    );
  }

  Widget _buildLoadingIndicator() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Memuat data absensi...'),
        ],
      ),
    );
  }

  Widget _buildErrorMessage() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline_rounded,
            size: 80,
            color: Colors.red[300],
          ),
          const SizedBox(height: 16),
          Text(
            _errorMessage ?? 'Terjadi kesalahan',
            style: TextStyle(
              color: Colors.red[700],
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadAttendanceData,
            style: ElevatedButton.styleFrom(
              foregroundColor: Colors.white,
              backgroundColor: AppColors.primary,
            ),
            child: const Text('Coba Lagi'),
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

    return RefreshIndicator(
      onRefresh: _fetchAttendanceHistory,
      child: ListView.builder(
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
      ),
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
          Text(
            '${_groupedRecords[dateKey]?.length ?? 0} kehadiran',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceItem(AttendanceHistoryModel record) {
    // Get status color and icon from the model
    final Color statusColor = record.statusColor;
    final IconData statusIcon = record.statusIcon;

    return Column(
      children: [
        InkWell(
          onTap: () {
            // Show detail dialog
            _showAttendanceDetailDialog(record);
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
                        '${record.buildingName} - ${record.roomName}',
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
                        record.statusInIndonesian,
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
  
  void _showAttendanceDetailDialog(AttendanceHistoryModel record) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Detail Absensi'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _detailRow('Mata Kuliah', record.courseTitle),
                _detailRow('Kode MK', record.courseCode),
                _detailRow('Dosen', record.lecturerName),
                _detailRow('Ruangan', '${record.buildingName} - ${record.roomName}'),
                _detailRow('Tanggal', record.formattedDate),
                _detailRow('Waktu Absensi', record.formattedTime),
                _detailRow('Status', record.statusInIndonesian),
                _detailRow('Metode Verifikasi', record.verificationType.isNotEmpty 
                    ? record.verificationType 
                    : 'Tidak Ada'),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Tutup'),
            ),
          ],
        );
      }
    );
  }
  
  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          const Divider(height: 1),
        ],
      ),
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
