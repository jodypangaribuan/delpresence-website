import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/services/network_service.dart';
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
  String _todayName = '';

  @override
  void initState() {
    super.initState();
    
    // Get today's day name
    final today = DateTime.now();
    _todayName = _dayNames[today.weekday - 1];
    
    // Initialize network service
    final networkService = NetworkService(
      baseUrl: const String.fromEnvironment('API_BASE_URL', 
        defaultValue: 'http://localhost:8080'),
      timeout: const Duration(seconds: 15),
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
        _errorMessage = 'Gagal memuat tahun akademik: $e';
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
        _errorMessage = 'Gagal memuat jadwal: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
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
    final dateFormat = DateFormat('EEEE, d MMMM yyyy', 'id_ID');
    final formattedDate = dateFormat.format(now);

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
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Time column
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${schedule.startTime} - ${schedule.endTime}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.blue[700],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          schedule.roomName,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.business_outlined,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          schedule.buildingName,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                
                const SizedBox(width: 16),
                
                // Course info column
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        schedule.courseName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        schedule.courseCode,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.person_outline,
                            size: 16,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              schedule.lecturerName,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.group_outlined,
                            size: 16,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              schedule.studentGroupName,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: schedule.getStatusColor().withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    schedule.status,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: schedule.getStatusColor(),
                    ),
                  ),
                ),
                Text(
                  'Tahun Akademik: ${schedule.academicYearName}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
