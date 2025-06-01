import 'package:flutter/material.dart';
import '../../../../core/constants/colors.dart';
import '../../../schedule/data/models/schedule_model.dart';
import '../../../schedule/data/services/schedule_service.dart';
import '../../../../core/services/network_service.dart'; // For NetworkService
import '../../../../core/config/api_config.dart'; // For ApiConfig
import 'face_recognition_attendance_screen.dart';

class CourseSelectionScreen extends StatefulWidget {
  const CourseSelectionScreen({super.key});

  @override
  State<CourseSelectionScreen> createState() => _CourseSelectionScreenState();
}

class _CourseSelectionScreenState extends State<CourseSelectionScreen> {
  List<ScheduleModel> _todaySchedules = [];
  bool _isLoadingSchedules = true;
  String? _scheduleError;
  late ScheduleService _scheduleService;
  Map<int, bool> _activeSessionsMap = {}; // To store active session status

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
      _isLoadingSchedules = true;
      _scheduleError = null;
    });

    try {
      // Get academic years first to get the active one
      final academicYears = await _scheduleService.getAcademicYears();
      int? academicYearId;
      if (academicYears.isNotEmpty) {
        final activeYear = academicYears.firstWhere(
          (year) => year['is_active'] == true,
          orElse: () => academicYears.first,
        );
        academicYearId = activeYear['id'];
      }

      // Get all schedules
      final schedules = await _scheduleService.getStudentSchedules(
        academicYearId: academicYearId,
      );

      // Filter schedules for today
      final today = DateTime.now();
      final dayName = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][today.weekday - 1];
      final todaySchedules = ScheduleModel.getSchedulesByDay(schedules, dayName);

      if (mounted) {
        setState(() {
          _todaySchedules = todaySchedules;
          _isLoadingSchedules = false;
        });
        if (todaySchedules.isNotEmpty) {
          await _checkActiveSessionsForSchedules(todaySchedules);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _scheduleError = e.toString();
          _isLoadingSchedules = false;
        });
      }
    }
  }

  Future<void> _checkActiveSessionsForSchedules(List<ScheduleModel> schedules) async {
    if (schedules.isEmpty || !mounted) return;
    
    Map<int, bool> tempMap = {};
    try {
      List<Future> futures = [];
      for (var schedule in schedules) {
        if (schedule.id > 0) { // Ensure valid schedule ID
          futures.add(
            _scheduleService.isAttendanceSessionActive(schedule.id).then((isActive) {
              tempMap[schedule.id] = isActive;
            }).catchError((e) {
              tempMap[schedule.id] = false; // Default to false on error
            })
          );
        } else {
           tempMap[schedule.id] = false; // Default for invalid ID
        }
      }
      await Future.wait(futures);
      if (mounted) {
        setState(() {
          _activeSessionsMap = tempMap;
        });
      }
    } catch (e) {
      // Handle or log error if needed
      if (mounted) {
        setState(() { // Ensure UI reflects that checking might have failed
            _activeSessionsMap = tempMap; // Use whatever was gathered
        });
      }
    }
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
            child: _isLoadingSchedules
                ? const Center(child: CircularProgressIndicator())
                : _scheduleError != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(
                            'Gagal memuat jadwal: $_scheduleError. Silakan coba lagi.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.red.shade700),
                          ),
                        ),
                      )
                    : _todaySchedules.isEmpty
                        ? const Center(
                            child: Text(
                              'Tidak ada jadwal kelas untuk hari ini.',
                              style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _todaySchedules.length,
                            itemBuilder: (context, index) {
                              final schedule = _todaySchedules[index];
                              final bool hasActiveSession = _activeSessionsMap[schedule.id] ?? false;
                              
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


                              return GestureDetector(
                                onTap: (isCurrentlyActiveClass && hasActiveSession)
                                    ? () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                FaceRecognitionAttendanceScreen(
                                              courseName: schedule.courseName,
                                              // scheduleId: schedule.id, // Removed for now
                                            ),
                                          ),
                                        );
                                      }
                                    : null, 
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: (isCurrentlyActiveClass && hasActiveSession)
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
                                      color: (isCurrentlyActiveClass && hasActiveSession)
                                          ? AppColors.primary.withOpacity(0.3)
                                          : Colors.grey.withOpacity(0.1),
                                      width: (isCurrentlyActiveClass && hasActiveSession) ? 1.5 : 1,
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
                                                  color: (isCurrentlyActiveClass && hasActiveSession)
                                                      ? AppColors.textPrimary
                                                      : AppColors.textSecondary,
                                                ),
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: (isCurrentlyActiveClass && hasActiveSession)
                                                    ? AppColors.success.withOpacity(0.08)
                                                    : Colors.grey.withOpacity(0.08),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                (isCurrentlyActiveClass && hasActiveSession)
                                                    ? 'Bisa Absen'
                                                    : schedule.status ?? 'Tidak Aktif', // Show actual status or 'Tidak Aktif'
                                                style: TextStyle(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.w500,
                                                  color: (isCurrentlyActiveClass && hasActiveSession)
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
                                        if (!(isCurrentlyActiveClass && hasActiveSession))
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
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
