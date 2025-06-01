import 'package:flutter/material.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/services/network_service.dart';
import '../../../../core/config/api_config.dart';
import '../../../schedule/data/services/schedule_service.dart';
import '../../../schedule/data/models/schedule_model.dart';
import 'face_recognition_attendance_screen.dart';

class CourseSelectionScreen extends StatefulWidget {
  const CourseSelectionScreen({super.key});

  @override
  State<CourseSelectionScreen> createState() => _CourseSelectionScreenState();
}

class _CourseSelectionScreenState extends State<CourseSelectionScreen> {
  late ScheduleService _scheduleService;
  bool _isLoading = true;
  List<ScheduleModel> _schedules = [];
  Map<int, bool> _activeSessionsMap = {};
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    
    // Initialize services
    final networkService = NetworkService(
      baseUrl: ApiConfig.instance.baseUrl,
      timeout: ApiConfig.instance.timeout,
    );
    _scheduleService = ScheduleService(networkService: networkService);
    
    // Load schedules and check active sessions
    _loadSchedulesAndCheckSessions();
  }

  Future<void> _loadSchedulesAndCheckSessions() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      // Load all schedules for today
      final schedules = await _scheduleService.getStudentSchedules();
      
      // Filter to only today's schedules (in a real app, would check day of week)
      final todaySchedules = schedules;
      
      // Build a map of schedule IDs to active session status
      final Map<int, bool> activeSessionsMap = {};
      
      // Check active sessions for each schedule
      for (final schedule in todaySchedules) {
        final isActive = await _scheduleService.isAttendanceSessionActive(schedule.id);
        activeSessionsMap[schedule.id] = isActive;
      }
      
      setState(() {
        _schedules = todaySchedules;
        _activeSessionsMap = activeSessionsMap;
        _isLoading = false;
      });
      
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Pilih Mata Kuliah',
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
                  'Absensi Mata Kuliah',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Pilih mata kuliah untuk melakukan absensi',
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
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: Colors.red),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      )
                    : _schedules.isEmpty
                        ? const Center(
                            child: Text(
                              'Tidak ada jadwal kuliah hari ini',
                              style: TextStyle(color: Colors.grey),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadSchedulesAndCheckSessions,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _schedules.length,
                              itemBuilder: (context, index) {
                                final schedule = _schedules[index];
                                final hasActiveSession = _activeSessionsMap[schedule.id] ?? false;
                                
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
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
                                      color: hasActiveSession
                                          ? AppColors.primary.withOpacity(0.3)
                                          : Colors.grey.withOpacity(0.1),
                                      width: hasActiveSession ? 1.5 : 1,
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
                                                  color: hasActiveSession
                                                      ? AppColors.textPrimary
                                                      : AppColors.textSecondary,
                                                ),
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: hasActiveSession
                                                    ? AppColors.success.withOpacity(0.08)
                                                    : Colors.grey.withOpacity(0.08),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                hasActiveSession
                                                    ? 'Sesi Aktif'
                                                    : 'Menunggu',
                                                style: TextStyle(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.w500,
                                                  color: hasActiveSession
                                                      ? AppColors.success
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
                                        const SizedBox(height: 10),
                                        const Divider(
                                            height: 1,
                                            thickness: 1,
                                            color: Color(0xFFEEEEEE)),
                                        const SizedBox(height: 10),
                                        SizedBox(
                                          width: double.infinity,
                                          child: ElevatedButton(
                                            onPressed: hasActiveSession
                                                ? () {
                                                    Navigator.push(
                                                      context,
                                                      MaterialPageRoute(
                                                        builder: (context) =>
                                                            FaceRecognitionAttendanceScreen(
                                                          courseName: schedule.courseName,
                                                        ),
                                                      ),
                                                    );
                                                  }
                                                : null, // Disable button when no active session
                                            style: ElevatedButton.styleFrom(
                                              foregroundColor: Colors.white,
                                              backgroundColor: hasActiveSession
                                                  ? AppColors.primary
                                                  : Colors.grey.withOpacity(0.3),
                                              disabledBackgroundColor:
                                                  Colors.grey.withOpacity(0.3),
                                              disabledForegroundColor:
                                                  Colors.white.withOpacity(0.5),
                                              padding:
                                                  const EdgeInsets.symmetric(vertical: 8),
                                              elevation: 0,
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              textStyle: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            child: Text(
                                              hasActiveSession
                                                  ? 'Absen Sekarang'
                                                  : 'Menunggu Dosen Memulai Presensi',
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
