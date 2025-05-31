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
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.black87),
            onPressed: _fetchSchedules,
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
          _buildAcademicYearSelector(),
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
      color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!, width: 1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Hari Ini',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
            ),
          const SizedBox(height: 4),
          Text(
              formattedDate,
              style: TextStyle(
                fontSize: 14,
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
  
  Widget _buildAcademicYearSelector() {
    if (_academicYears.isEmpty) return const SizedBox.shrink();
    
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: DropdownButton<int>(
        isExpanded: true,
        value: _selectedAcademicYearId,
        hint: const Text('Pilih Tahun Akademik'),
        onChanged: (int? newValue) {
          setState(() {
            _selectedAcademicYearId = newValue;
          });
          _fetchSchedules();
        },
        items: _academicYears.map<DropdownMenuItem<int>>((year) {
          return DropdownMenuItem<int>(
            value: year['id'],
            child: Text(
              '${year['name']} ${year['is_active'] == true ? "(Aktif)" : ""}',
            ),
          );
        }).toList(),
      ),
    );
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
            if (_academicYears.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text(
                'Pilih Tahun Akademik:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButton<int>(
                value: _selectedAcademicYearId,
                hint: const Text('Pilih Tahun Akademik'),
                onChanged: (int? newValue) {
                  setState(() {
                    _selectedAcademicYearId = newValue;
                  });
                  _fetchSchedules();
                },
                items: _academicYears.map<DropdownMenuItem<int>>((year) {
                  return DropdownMenuItem<int>(
                    value: year['id'],
                    child: Text(
                      '${year['name']} ${year['is_active'] == true ? "(Aktif)" : ""}',
                    ),
                  );
                }).toList(),
              ),
            ],
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
          color: schedule.status == 'Sedang Berlangsung'
              ? AppColors.primary.withOpacity(0.3)
              : Colors.grey.withOpacity(0.1),
          width: schedule.status == 'Sedang Berlangsung' ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Course title and status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    schedule.courseName,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: schedule.getStatusColor().withOpacity(0.08),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    schedule.status,
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w500,
                      color: schedule.getStatusColor(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 5),
            
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
            
            // Add "Absen" button for ongoing classes
            if (schedule.status == 'Sedang Berlangsung') ...[
              const SizedBox(height: 10),
              const Divider(height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Navigate to attendance screen
                  },
                  style: ElevatedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  child: const Text('Absen Sekarang'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
