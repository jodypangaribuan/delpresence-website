import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/services/network_service.dart';
import '../../../../core/config/api_config.dart';
import '../../data/models/schedule_model.dart';
import '../../data/services/schedule_service.dart';

class TodaySchedulePage extends StatefulWidget {
  const TodaySchedulePage({super.key});

  @override
  State<TodaySchedulePage> createState() => _TodaySchedulePageState();
}

class _TodaySchedulePageState extends State<TodaySchedulePage> {
  // Day names in Indonesian
  final List<String> _dayNames = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu'
  ];

  late ScheduleService _scheduleService;
  List<ScheduleModel> _allSchedules = [];
  List<ScheduleModel> _todaySchedules = [];
  List<Map<String, dynamic>> _academicYears = [];
  int? _selectedAcademicYearId;
  bool _isLoading = true;
  String? _errorMessage;
  // Initialize with current weekday to prevent initialization issues
  String _todayName = DateTime.now().weekday >= 1 && DateTime.now().weekday <= 7 
      ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][DateTime.now().weekday - 1] 
      : '';

  @override
  void initState() {
    super.initState();
    
    // Initialize locale data for Indonesian
    initializeDateFormatting('id_ID', null).then((_) {
      // Get today's day name after locale is initialized
      final today = DateTime.now();
      setState(() {
        _todayName = _dayNames[today.weekday - 1];
      });
    });
    
    // Initialize network service
    final networkService = NetworkService(
      baseUrl: ApiConfig.instance.baseUrl,
      timeout: ApiConfig.instance.timeout,
    );
    _scheduleService = ScheduleService(networkService: networkService);
    
    // Fetch data
    _fetchAcademicYears();
  }
  
  // Fetch academic years from the API
  Future<void> _fetchAcademicYears() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final academicYears = await _scheduleService.getAcademicYears();
      
      setState(() {
        _academicYears = academicYears;
        
        // Set selected academic year to the first active one or the most recent
        if (academicYears.isNotEmpty) {
          // First try to find an active academic year
          final activeYear = academicYears.firstWhere(
            (year) => year['is_active'] == true,
            orElse: () => academicYears.first,
          );
          _selectedAcademicYearId = activeYear['id'];
        }
      });
      
      // After getting academic years, fetch schedules
      await _fetchSchedules();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }
  
  // Fetch schedules from the API
  Future<void> _fetchSchedules() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final schedules = await _scheduleService.getStudentSchedules(
        academicYearId: _selectedAcademicYearId,
      );
      
      setState(() {
        _allSchedules = schedules;
        // Filter for today's schedules
        _todaySchedules = ScheduleModel.getSchedulesByDay(schedules, _todayName);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Set a custom error widget handler for image loading errors
    ErrorWidget.builder = (FlutterErrorDetails details) {
      if (details.exception.toString().contains('image')) {
        debugPrint('Image loading error: ${details.exception}');
        return Container(
          height: 30,
          width: 30,
          color: Colors.grey[300],
          child: const Icon(Icons.error, size: 16, color: Colors.red),
        );
      }
      return const Center(
        child: Text('An error occurred.', style: TextStyle(color: Colors.red)),
      );
    };

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        title: const Text(
          'Jadwal Hari Ini',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        automaticallyImplyLeading: false,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(100),
              child: InkWell(
                borderRadius: BorderRadius.circular(100),
                onTap: () {
                  _fetchAcademicYears(); // This fetches academic years first, then schedules
                },
                child: Padding(
                  padding: const EdgeInsets.all(10.0),
                  child: Icon(
                    Icons.refresh_rounded,
                    color: AppColors.primary,
                    size: 22,
                  ),
                ),
              ),
            ),
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
            child: _buildScheduleList(),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayHeader() {
    // Get today's date in Indonesian format
    final now = DateTime.now();
    
    // Check if locale data is initialized before creating DateFormat
    String formattedDate;
    try {
      final dateFormat = DateFormat('EEEE, d MMMM yyyy', 'id_ID');
      formattedDate = dateFormat.format(now);
    } catch (e) {
      // Fallback if locale data is not initialized
      formattedDate = "${_dayNames[now.weekday - 1]}, ${now.day} ${_getMonthName(now.month)} ${now.year}";
    }

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Date aligned to the left with appropriate style
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              formattedDate,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ),
          const SizedBox(height: 4),
          // Academic year with semester type (Ganjil/Genap)
          Text(
            // Get active academic year name and add semester type
            _academicYears.isNotEmpty 
                ? "${_academicYears.firstWhere(
                    (year) => year['is_active'] == true,
                    orElse: () => _academicYears.first,
                  )['name'].toString()} - ${_getSemesterType(DateTime.now())}"
                : 'Tahun Akademik Aktif',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
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
  
  // Helper method to get semester type (Ganjil/Genap)
  String _getSemesterType(DateTime now) {
    if (now.month >= 8 && now.month <= 12) {
      return 'Ganjil';
    } else if (now.month >= 1 && now.month <= 7) {
      return 'Genap';
    } else {
      throw Exception('Invalid month for semester type calculation');
    }
  }
  
  Widget _buildScheduleList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }
    
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 48,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchSchedules,
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      );
    }

    if (_todaySchedules.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.event_busy,
              size: 48,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            const Text(
              'Tidak ada jadwal untuk hari ini',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    // Sort by start time
    _todaySchedules.sort((a, b) {
      final aTimeParts = a.startTime.split(':');
      final bTimeParts = b.startTime.split(':');
      
      final aHour = int.tryParse(aTimeParts[0]) ?? 0;
      final aMinute = int.tryParse(aTimeParts[1]) ?? 0;
      final bHour = int.tryParse(bTimeParts[0]) ?? 0;
      final bMinute = int.tryParse(bTimeParts[1]) ?? 0;
      
      final aMinutes = aHour * 60 + aMinute;
      final bMinutes = bHour * 60 + bMinute;
      
      return aMinutes.compareTo(bMinutes);
    });

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _todaySchedules.length,
      itemBuilder: (context, index) {
        final schedule = _todaySchedules[index];
        return _buildScheduleCard(schedule);
      },
    );
  }

  Widget _buildScheduleCard(ScheduleModel schedule) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
          color: Colors.grey.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Course title only, without status
            Text(
              schedule.courseName,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            
            // Course code
            Text(
              schedule.courseCode,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            
            // Time and Room
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
                Expanded(
                  child: Text(
                    schedule.roomName,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            
            // Building
            Row(
              children: [
                Icon(
                  Icons.business_outlined,
                  size: 12,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 3),
                Expanded(
                  child: Text(
                    schedule.buildingName,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            
            // Lecturer
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
            const SizedBox(height: 4),
            
            // Student Group
            Row(
              children: [
                Icon(
                  Icons.group_outlined,
                  size: 12,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 3),
                Expanded(
                  child: Text(
                    schedule.studentGroupName,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            
            // No absen button
          ],
        ),
      ),
    );
  }
}
