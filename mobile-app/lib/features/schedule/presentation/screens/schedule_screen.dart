import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/services/network_service.dart';
import '../../../../core/config/api_config.dart';
import '../../data/models/schedule_model.dart';
import '../../data/services/schedule_service.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  // Initialize with default values to prevent LateInitializationError
  late DateTime _currentMonth = DateTime.now();
  late DateTime _selectedDate = DateTime.now();
  late String _selectedDay = _dayAbbr[DateTime.now().weekday - 1];

  // Add these properties for API integration
  late ScheduleService _scheduleService;
  List<ScheduleModel> _schedules = [];
  List<Map<String, dynamic>> _academicYears = [];
  int? _selectedAcademicYearId;
  bool _isLoading = true;
  String? _errorMessage;

  // Initialize with dummy formatter that will be replaced
  late DateFormat _monthYearFormat = DateFormat('MMMM yyyy');
  late DateFormat _dayNameFormat = DateFormat('E');

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
    
    // Initialize locale data for Indonesian with proper handling
    initializeDateFormatting('id_ID', null).then((_) {
      // Set initial state values after locale data is initialized
      setState(() {
        _currentMonth = DateTime.now();
        _selectedDate = DateTime.now();
        _selectedDay = _dayAbbr[_selectedDate.weekday - 1];
        
        // Try to initialize DateFormat after locale data is loaded
        try {
          _monthYearFormat = DateFormat('MMMM yyyy', 'id_ID');
          _dayNameFormat = DateFormat('E', 'id_ID');
        } catch (e) {
          debugPrint('Error initializing DateFormat: $e');
          // Will use the fallback in formatMonthYear
        }
      });
    }).catchError((e) {
      debugPrint('Error initializing locale data: $e');
      setState(() {
    _currentMonth = DateTime.now();
    _selectedDate = DateTime.now();
    _selectedDay = _dayAbbr[_selectedDate.weekday - 1];
      });
    });
    
    // Initialize the network service and schedule service
    final networkService = NetworkService(
      baseUrl: ApiConfig.instance.baseUrl,
      timeout: ApiConfig.instance.timeout,
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
        _schedules = schedules;
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
          _buildMonthSelector(),
          _buildCalendar(),
          _buildSelectedDateHeader(),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primary,
              backgroundColor: Colors.white,
              onRefresh: () async {
                await _fetchSchedules();
              },
              child: _buildScheduleList(),
            ),
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
            formatMonthYear(_currentMonth),
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
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height / 3),
          const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.event_busy,
                  size: 48,
                  color: Colors.grey,
                ),
                SizedBox(height: 16),
                Text(
                  'Tidak ada jadwal untuk hari ini',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: daySchedules.length,
      physics: const AlwaysScrollableScrollPhysics(),
      itemBuilder: (context, index) {
        final schedule = daySchedules[index];
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

  // Add a helper method to safely format the month and year
  String formatMonthYear(DateTime date) {
    try {
      return _monthYearFormat.format(date);
    } catch (e) {
      // Fallback to using the month names map
      return '${_monthNames[date.month]} ${date.year}';
    }
  }
}
