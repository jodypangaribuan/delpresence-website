import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../../../core/constants/colors.dart';
import '../../data/models/schedule_model.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  late DateTime _currentMonth;
  late DateTime _selectedDate;
  late String _selectedDay;

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
    // Get schedules for the selected date's day
    final indonesianDayName = _dayNames[_selectedDate.weekday - 1];
    final schedules = ScheduleModel.getSchedulesByDay(indonesianDayName);

    if (schedules.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_busy,
              size: 80,
              color: Colors.grey[200],
            ),
            const SizedBox(height: 16),
            Text(
              'Tidak ada jadwal di hari ini',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Nikmati waktu luang Anda!',
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
      itemCount: schedules.length,
      padding: const EdgeInsets.all(16),
      physics: const BouncingScrollPhysics(),
      itemBuilder: (context, index) {
        final schedule = schedules[index];
        return _buildScheduleCard(schedule);
      },
    );
  }

  Widget _buildScheduleCard(ScheduleModel schedule) {
    // Determine the border color based on course
    Color borderColor = _getCourseColor(schedule.courseTitle);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Time and box icon at the top
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
              border: Border(
                bottom: BorderSide(color: Colors.grey[200]!, width: 1),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.book_outlined,
                  color: borderColor,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  '${schedule.startTime} - ${schedule.endTime} WIB',
                  style: TextStyle(
                    color: borderColor,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                Icon(
                  Icons.more_vert,
                  size: 18,
                  color: Colors.grey[400],
                ),
              ],
            ),
          ),

          // Course title and description
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  schedule.courseTitle,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _getCourseDescription(schedule.courseTitle),
                  style: TextStyle(
                    fontSize: 12.5,
                    color: Colors.grey[600],
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Divider
          Divider(height: 1, thickness: 1, color: Colors.grey[100]),

          // Room and lecturer info
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 16,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 6),
                Text(
                  schedule.roomName,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Icon(
                  Icons.book_outlined,
                  size: 16,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 6),
                Text(
                  "${schedule.credits} SKS",
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Helper methods
  bool isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  bool _dateHasSchedules(DateTime date) {
    // Get Indonesian day name directly from weekday
    final indonesianDayName = _dayNames[date.weekday - 1];

    // Check if there are schedules for this day
    final schedules = ScheduleModel.getSchedulesByDay(indonesianDayName);
    return schedules.isNotEmpty;
  }

  Color _getCourseColor(String courseName) {
    // Use consistent black color for all courses
    return Colors.black87;
  }

  String _getCourseDescription(String courseName) {
    // Sample descriptions for each course
    final Map<String, String> courseDescriptions = {
      'Pemrograman Mobile':
          'Mata kuliah ini mengajarkan tentang pengembangan aplikasi mobile untuk platform Android dan iOS menggunakan Flutter.',
      'Basis Data Lanjut':
          'Kuliah ini membahas konsep lanjutan dari database, termasuk normalisasi, query optimization, dan distributed databases.',
      'Bahasa Inggris III':
          'Mata kuliah ini bertujuan untuk mempersiapkan mahasiswa dalam mengikuti tes TOEFL ITP yang menjadi persyaratan kelulusan di universitas.',
      'Pengujian Kualitas Perangkat Lunak':
          'Mata kuliah ini memperkenalkan peran/pentingnya pengujian perangkat lunak, teknik pengujian, dan perencanaan pengujian.',
      'Desain Pengalaman Pengguna':
          'Pengalaman Pengguna bukan tentang membuat sesuatu yang cantik, tetapi tentang menciptakan pengalaman yang menyeluruh bagi pengguna akhir.',
      'Aljabar Linear':
          'Aljabar Linier dan Matriks berisi bahasan bagaimana menerapkan konsep matriks dan berbagai metode penyelesaian.',
      'Keamanan Perangkat Lunak':
          'Secara garis besar, terdapat 3 topik yang akan diberikan, yakni (1) prinsip keamanan komputer, (2) teknik keamanan, dan (3) implementasi keamanan perangkat lunak.',
      'Sistem Komputasi Awan':
          'Kuliah ini menawarkan pembelajaran tingkat lanjut mengenai implementasi sebuah jaringan sistem komputasi awan dan penerapannya dalam dunia industri.',
    };

    return courseDescriptions[courseName] ??
        'Deskripsi mata kuliah tidak tersedia.';
  }
}
