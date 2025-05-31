import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/services/network_service.dart';
import '../../data/models/schedule_model.dart';
import '../../data/services/schedule_service.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  late DateTime _currentMonth;
  late DateTime _selectedDate;
  late String _selectedDay;
  
  // Add these properties for API integration
  late ScheduleService _scheduleService;
  List<ScheduleModel> _schedules = [];
  List<Map<String, dynamic>> _academicYears = [];
  int? _selectedAcademicYearId;
  bool _isLoading = true;
  String? _errorMessage;

  // Format for month and year (April 2025)
  final DateFormat _monthYearFormat = DateFormat('MMMM yyyy', 'id_ID');

  // Format for day names (Sen, Sel, etc)
  final DateFormat _dayNameFormat = DateFormat('E', 'id_ID');

  // Day names in Indonesian
  final List<String> _dayAbbr = [
    'Sen',
    'Sel',
    'Rab',
    'Kam',
    'Jum',
    'Sab',
    'Min'
  ];

  // Full day names in Indonesian
  final List<String> _dayNames = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu'
  ];

  // Month names in Indonesian
  final Map<int, String> _monthNames = {
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

  @override
  void initState() {
    super.initState();
    // Initialize locale data for Indonesian
    initializeDateFormatting('id_ID', null);
    _currentMonth = DateTime.now();
    _selectedDate = DateTime.now();
    _selectedDay = _dayAbbr[_selectedDate.weekday - 1];
    
    // Initialize the network service and schedule service
    final networkService = NetworkService(
      baseUrl: const String.fromEnvironment('API_BASE_URL', 
        defaultValue: 'http://localhost:8080'),
      timeout: const Duration(seconds: 15),
    );
    _scheduleService = ScheduleService(networkService: networkService);
    
    // Fetch data from the API
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
        _schedules = schedules;
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
          'Jadwal Kuliah',
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
          _buildAcademicYearSelector(),
          _buildMonthSelector(),
          _buildCalendar(),
          _buildSelectedDateHeader(),
          Expanded(
            child: _buildScheduleList(),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthSelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left, color: Colors.black),
            onPressed: () {
              setState(() {
                _currentMonth =
                    DateTime(_currentMonth.year, _currentMonth.month - 1, 1);
              });
            },
          ),
          Text(
            '${_monthNames[_currentMonth.month]} ${_currentMonth.year}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right, color: Colors.black),
            onPressed: () {
              setState(() {
                _currentMonth =
                    DateTime(_currentMonth.year, _currentMonth.month + 1, 1);
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCalendar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        children: [
          // Day names (Sen, Sel, etc.)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: _dayAbbr.map((day) {
              return Expanded(
                child: Center(
                  child: Text(
                    day,
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 12,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          // Calendar grid
          ...(_buildCalendarDates()),
        ],
      ),
    );
  }

  List<Widget> _buildCalendarDates() {
    List<Widget> rows = [];

    // Get the first day of the month
    final firstDay = DateTime(_currentMonth.year, _currentMonth.month, 1);

    // Get the last day of the month
    final lastDay = DateTime(_currentMonth.year, _currentMonth.month + 1, 0);

    // Calculate the number of days in the previous month to show
    int leadingDays = firstDay.weekday - 1; // 0 = Monday in our case

    // Calculate total days to show (leading + days in month + trailing)
    int totalDays = leadingDays + lastDay.day;
    int trailingDays = 7 - (totalDays % 7 == 0 ? 7 : totalDays % 7);
    totalDays += trailingDays;

    // Get previous month's last day
    final prevMonthLastDay =
        DateTime(_currentMonth.year, _currentMonth.month, 0).day;

    // Create list of dates
    List<DateTime?> dates = [];

    // Add leading days from previous month
    for (int i = 0; i < leadingDays; i++) {
      dates.add(DateTime(_currentMonth.year, _currentMonth.month - 1,
          prevMonthLastDay - leadingDays + i + 1));
    }

    // Add days from current month
    for (int i = 1; i <= lastDay.day; i++) {
      dates.add(DateTime(_currentMonth.year, _currentMonth.month, i));
    }

    // Add trailing days from next month
    for (int i = 1; i <= trailingDays; i++) {
      dates.add(DateTime(_currentMonth.year, _currentMonth.month + 1, i));
    }

    // Create rows of 7 days
    for (int i = 0; i < dates.length; i += 7) {
      List<DateTime?> weekDates = dates.sublist(i, i + 7);
      rows.add(Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: weekDates.map((date) {
            return _buildDateCell(date!);
          }).toList(),
        ),
      ));
    }

    return rows;
  }

  Widget _buildDateCell(DateTime date) {
    // Check if this date is in the current month
    bool isCurrentMonth = date.month == _currentMonth.month;

    // Check if this date is today
    bool isToday = isSameDay(date, DateTime.now());

    // Check if this date is selected
    bool isSelected = isSameDay(date, _selectedDate);

    // Check if this date has events (use dots under the date)
    bool hasEvents = _dateHasSchedules(date);

    // Determine the text and background colors based on state
    Color textColor;
    Color backgroundColor;

    if (isSelected) {
      textColor = Colors.white;
      backgroundColor = AppColors.primary;
    } else if (isToday) {
      textColor = AppColors.primary;
      backgroundColor = Colors.white;
    } else {
      textColor = isCurrentMonth ? Colors.black : Colors.grey[400]!;
      backgroundColor = Colors.transparent;
    }

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedDate = date;
            _selectedDay = _dayAbbr[date.weekday - 1];
          });
        },
        child: Column(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: backgroundColor,
                shape: BoxShape.circle,
                border: isToday && !isSelected
                    ? Border.all(color: AppColors.primary, width: 1.5)
                    : null,
              ),
              child: Center(
                child: Text(
                  date.day.toString(),
                  style: TextStyle(
                    color: textColor,
                    fontWeight: isSelected || isToday
                        ? FontWeight.bold
                        : FontWeight.normal,
                  ),
                ),
              ),
            ),
            if (hasEvents)
              Container(
                margin: const EdgeInsets.only(top: 4),
                height: 4,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildEventDot(Colors.blue),
                    const SizedBox(width: 2),
                    _buildEventDot(AppColors.primary),
                    const SizedBox(width: 2),
                    _buildEventDot(Colors.purple),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventDot(Color color) {
    return Container(
      width: 4,
      height: 4,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildSelectedDateHeader() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          margin: const EdgeInsets.only(top: 8.0),
          color: Colors.white,
          child: Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary, width: 1),
                ),
                child: Text(
                  // Display day of week in Bahasa Indonesia
                  '${_dayNames[_selectedDate.weekday - 1]}, ${DateFormat('dd').format(_selectedDate)} ${_monthNames[_selectedDate.month]} ${_selectedDate.year}',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
        Divider(
          height: 1,
          thickness: 1,
          color: Colors.grey[200],
        ),
      ],
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
    
    final dayName = _dayNames[_selectedDate.weekday - 1];
    final daySchedules = ScheduleModel.getSchedulesByDay(_schedules, dayName);
    
    if (daySchedules.isEmpty) {
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
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: daySchedules.length,
      itemBuilder: (context, index) {
        final schedule = daySchedules[index];
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

  // Helper methods
  bool isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  bool _dateHasSchedules(DateTime date) {
    final dayName = _dayNames[date.weekday - 1];
    return _schedules.any((schedule) => 
      schedule.day.toLowerCase() == dayName.toLowerCase());
  }

  Widget _buildAcademicYearSelector() {
    if (_academicYears.isEmpty) return const SizedBox.shrink();
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
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
}
