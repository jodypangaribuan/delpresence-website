import 'package:flutter/material.dart';
import '../../../schedule/data/models/schedule_model.dart';
import '../../../schedule/data/services/schedule_service.dart';
import '../../../../core/services/network_service.dart'; // For NetworkService
import '../../../../core/config/api_config.dart'; // For ApiConfig
import 'face_recognition_attendance_screen.dart';
import '../../../../core/utils/toast_utils.dart'; // Added for ToastUtils
import 'package:delpresence/features/qr_scanner/qr_scanner_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/services/attendance_service.dart';

class CourseSelectionScreen extends StatefulWidget {
  const CourseSelectionScreen({super.key});

  @override
  State<CourseSelectionScreen> createState() => _CourseSelectionScreenState();
}

class _CourseSelectionScreenState extends State<CourseSelectionScreen> {
  bool _isLoading = true;
  List<ScheduleModel> _todaySchedules = []; // Use ScheduleModel for now
  Map<int, bool> _activeSessionsMap = {};
  Map<int, bool> _attendanceCompletedMap = {};
  String? _scheduleError;
  late ScheduleService _scheduleService;

  @override
  void initState() {
    super.initState();
    final networkService = NetworkService(
      baseUrl: ApiConfig.instance.baseUrl,
      timeout: ApiConfig.instance.timeout,
    );
    _scheduleService = ScheduleService(networkService: networkService);
    _fetchTodaySchedules();
  }

  Future<void> _fetchTodaySchedules() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _scheduleError = null;
    });

    try {
      // Fetch today's schedule data
      final schedules = await _scheduleService.getTodaySchedules();
      
      // Create a new map to store active session status
      final Map<int, bool> newActiveSessionsMap = {};
      
      // For each schedule, check if it has an active session
      for (var schedule in schedules) {
        final hasActiveSession = await _scheduleService.hasActiveSession(schedule.id);
        newActiveSessionsMap[schedule.id] = hasActiveSession;
      }
      
      // Create a new map to store attendance completed status
      final Map<int, bool> newAttendanceCompletedMap = {};
      
      // Check attendance status for each schedule
      final AttendanceService attendanceService = AttendanceService();
      for (var schedule in schedules) {
        try {
          final isCompleted = await attendanceService.checkAttendanceStatus(schedule.id);
          newAttendanceCompletedMap[schedule.id] = isCompleted;
        } catch (e) {
          // Default to not completed if there's an error
          newAttendanceCompletedMap[schedule.id] = false;
        }
      }
      
      if (mounted) {
        setState(() {
          _todaySchedules = schedules;
          _activeSessionsMap = newActiveSessionsMap;
          _attendanceCompletedMap = newAttendanceCompletedMap;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _scheduleError = e.toString();
          _isLoading = false;
        });
        ToastUtils.showErrorToast(context, 'Gagal memuat jadwal: $e');
      }
    }
  }

  // Adapted from home_screen.dart - updated to use ScheduleModel
  void _showAbsensiBottomSheet(BuildContext context, ScheduleModel schedule) {
    debugPrint('📋 Opening attendance bottom sheet for schedule ID: ${schedule.id}');
    
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );
    
    // Check attendance status from backend
    AttendanceService().checkAttendanceStatus(schedule.id).then((isAlreadyCompleted) {
      // Close loading dialog
      Navigator.pop(context);
      
      debugPrint('📝 Backend returned attendance status: $isAlreadyCompleted for schedule ID: ${schedule.id}');
      
      if (isAlreadyCompleted) {
        // If attendance is already completed according to server, show a message and refresh data
        ToastUtils.showInfoToast(context, 'Anda sudah melakukan absensi untuk kelas ini');
        _fetchTodaySchedules(); // Refresh data
        return;
      }
      
      // Continue with showing the bottom sheet
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (context) => Container(
          height: MediaQuery.of(context).size.height * 0.42, // Adjusted height for two options
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  margin: const EdgeInsets.only(bottom: 20),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              Row(
                children: [
                  Icon(
                    Icons.how_to_reg,
                    color: AppColors.primary,
                    size: 22,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Pilih Metode Absensi',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF333333),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Column(
                children: [
                  // QR Code Option (Re-added)
                  _buildMinimalistAbsensiOption(
                    context,
                    icon: Icons.qr_code_scanner_rounded,
                    title: 'Scan QR',
                    description: 'Pindai kode QR untuk melakukan absensi',
                    onTap: () {
                      Navigator.pop(context); // Close bottom sheet
                      
                      // Callback for when scan is successful
                      void onQrScanSuccessCallback(int successScheduleId) {
                        // Update the status for this schedule
                        setState(() {
                          // Update active sessions map
                          _activeSessionsMap[successScheduleId] = false;
                          
                          // Find and update the schedule in the list
                          for (var i = 0; i < _todaySchedules.length; i++) {
                            if (_todaySchedules[i].id == successScheduleId) {
                              _todaySchedules[i] = _todaySchedules[i].copyWith(
                                status: "Selesai"
                              );
                              break;
                            }
                          }
                        });
                        
                        // Refresh the data after a short delay
                        Future.delayed(const Duration(milliseconds: 500), () {
                          if (mounted) {
                            _fetchTodaySchedules();
                          }
                        });
                      }
                      
                      // Use the enhanced QR scanner service method with original schedule ID and callback
                      QRScannerService.scanAndSubmitAttendance(
                        context, 
                        scheduleId: schedule.id,
                        onSuccessCallback: onQrScanSuccessCallback,
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  // Face Recognition Option
                  _buildMinimalistAbsensiOption(
                    context,
                    icon: Icons.face_rounded,
                    title: 'Face Recognition',
                    description: 'Gunakan pengenalan wajah untuk absensi',
                    onTap: () {
                      Navigator.pop(context); // Close bottom sheet
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              FaceRecognitionAttendanceScreen(
                            courseName: schedule.courseName,
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }).catchError((error) {
      // Close loading dialog in case of error
      Navigator.pop(context);
      
      // Show error toast
      ToastUtils.showErrorToast(context, 'Gagal memeriksa status absensi');
    });
  }

  // Adapted from home_screen.dart
  Widget _buildMinimalistAbsensiOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: AppColors.primary,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 16,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              color: AppColors.textLight,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Demo courses - Pemrograman Mobile can be selected multiple times
    // final courses = [
    //   {
    //     'title': 'Pemrograman Mobile',
    //     'time': '08:00 - 10:30',
    //     'room': 'Ruang 516',
    //     'lecturer': 'Tegar Arifin Prasetyo, S.Si., M.Si.',
    //     'status': 'Dapat Diabsen Berkali-kali (Demo)',
    //     'isActive': true,
    //   },
    //   {
    //     'title': 'Basis Data',
    //     'time': '13:00 - 15:30',
    //     'room': 'Ruang 527',
    //     'lecturer': 'Dr. Andi Wahju, S.Kom., M.Eng.',
    //     'status': 'Hanya Dapat Diabsen Sekali',
    //     'isActive': false,
    //   },
    //   {
    //     'title': 'Algoritma dan Struktur Data',
    //     'time': '10:30 - 13:00',
    //     'room': 'Ruang 512',
    //     'lecturer': 'Dr. Budi Santoso, S.Kom., M.Cs.',
    //     'status': 'Hanya Dapat Diabsen Sekali',
    //     'isActive': false,
    //   },
    //   {
    //     'title': 'Pemrograman Web',
    //     'time': '15:30 - 18:00',
    //     'room': 'Lab Komputer 2',
    //     'lecturer': 'Dr. Citra Dewi, S.Kom., M.T.',
    //     'status': 'Hanya Dapat Diabsen Sekali',
    //     'isActive': false,
    //   },
    //   {
    //     'title': 'Interaksi Manusia dan Komputer',
    //     'time': '07:30 - 10:00',
    //     'room': 'Ruang 520',
    //     'lecturer': 'Dr. Dian Pratiwi, S.Kom., M.M.',
    //     'status': 'Hanya Dapat Diabsen Sekali',
    //     'isActive': false,
    //   },
    // ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Pilih Jadwal', // Changed title
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Pilih Jadwal Kelas', // Changed header
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Pilih jadwal kelas yang akan diikuti untuk absensi', // Changed sub-header
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),

          // Course list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _scheduleError != null
                    ? Center(
                        child: Text(_scheduleError!),
                      )
                    : _todaySchedules.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.calendar_today_outlined,
                                  size: 64,
                                  color: Colors.grey[300],
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  'Tidak ada jadwal hari ini',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _fetchTodaySchedules,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _todaySchedules.length,
                              itemBuilder: (context, index) {
                                final schedule = _todaySchedules[index];
                                final hasActiveSession = _activeSessionsMap[schedule.id] ?? false;
                                
                                return _buildScheduleItem(schedule, hasActiveSession);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleItem(ScheduleModel schedule, bool hasActiveSession) {
    // Determine if the class is currently active based on time and status
    final now = DateTime.now();
    final currentTime = now.hour * 60 + now.minute;
    final startTimeParts = schedule.startTime.split(':');
    final endTimeParts = schedule.endTime.split(':');
    final startTimeMinutes = int.parse(startTimeParts[0]) * 60 + int.parse(startTimeParts[1]);
    final endTimeMinutes = int.parse(endTimeParts[0]) * 60 + int.parse(endTimeParts[1]);
    final bool timeBasedActive = currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
    final bool statusBasedActive = schedule.status?.toLowerCase() == 'sedang berlangsung';
    final bool isCurrentlyActiveClass = timeBasedActive || statusBasedActive;
    
    // Get attendance completed status from the map
    final isAttendanceCompleted = _attendanceCompletedMap[schedule.id] ?? false;
    
    // Determine if the schedule is active and can be selected
    final bool canSelectForAttendance = 
        isCurrentlyActiveClass && 
        hasActiveSession && 
        !isAttendanceCompleted;
    
    // Set the status text based on various conditions
    String statusText;
    if (isAttendanceCompleted) {
      statusText = 'Sudah Absen';
    } else if (hasActiveSession) {
      statusText = 'Bisa Absen';
    } else if (schedule.status?.toLowerCase() == 'selesai') {
      statusText = 'Selesai';
    } else {
      statusText = schedule.status ?? 'Tidak Aktif';
    }

    return GestureDetector(
      onTap: canSelectForAttendance
          ? () {
              // Show bottom sheet instead of direct navigation
              _showAbsensiBottomSheet(context, schedule);
            }
          : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: canSelectForAttendance
              ? Colors.white
              : Colors.white.withOpacity(0.8),
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              offset: const Offset(0, 1),
              blurRadius: 3,
              spreadRadius: 0,
            ),
          ],
          border: Border.all(
            color: canSelectForAttendance
                ? AppColors.primary.withOpacity(0.3)
                : isAttendanceCompleted
                  ? AppColors.success.withOpacity(0.3)
                  : Colors.grey.withOpacity(0.1),
            width: canSelectForAttendance || isAttendanceCompleted ? 1.5 : 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      schedule.courseName,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isAttendanceCompleted
                            ? AppColors.success
                            : canSelectForAttendance
                              ? AppColors.textPrimary
                              : AppColors.textSecondary,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isAttendanceCompleted
                          ? AppColors.success.withOpacity(0.08)
                          : canSelectForAttendance
                            ? AppColors.primary.withOpacity(0.08)
                            : Colors.grey.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w500,
                        color: isAttendanceCompleted
                            ? AppColors.success
                            : canSelectForAttendance
                              ? AppColors.primary
                              : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(
                    Icons.access_time_rounded,
                    size: 12,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    '${schedule.startTime} - ${schedule.endTime}',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Icon(
                    Icons.location_on_outlined,
                    size: 12,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    schedule.roomName,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 3),
              Row(
                children: [
                  Icon(
                    Icons.person_outline,
                    size: 12,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 3),
                  Expanded(
                    child: Text(
                      schedule.lecturerName,
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              if (!(canSelectForAttendance || isAttendanceCompleted))
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    isCurrentlyActiveClass ? 'Sesi absensi belum dibuka dosen.' : 'Jadwal tidak aktif atau sudah selesai.',
                    style: TextStyle(
                      fontSize: 10,
                      fontStyle: FontStyle.italic,
                      color: AppColors.warning,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
