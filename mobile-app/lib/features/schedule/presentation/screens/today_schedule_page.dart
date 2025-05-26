import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../../../core/constants/colors.dart';
import '../../data/models/schedule_model.dart';

class TodaySchedulePage extends StatefulWidget {
  const TodaySchedulePage({super.key});

  @override
  State<TodaySchedulePage> createState() => _TodaySchedulePageState();
}

class _TodaySchedulePageState extends State<TodaySchedulePage> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    // Initialize locale data for Indonesian
    initializeDateFormatting('id_ID', null).then((_) {
      if (mounted) {
        setState(() {
          _initialized = true;
        });
      }
    }).catchError((error) {
      print('Error initializing locale: $error');
      if (mounted) {
        setState(() {
          _initialized = true; // Still mark as initialized to avoid hanging
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0, // Prevents color change when scrolled
        centerTitle: true,
        title: const Text(
          'Jadwal Hari Ini',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        automaticallyImplyLeading:
            false, // Remove back button since it's in navbar
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
          _buildTodayDateHeader(),
          Expanded(
            child: _buildTodayScheduleList(),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayDateHeader() {
    final today = DateTime.now();
    final dayNames = [
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
      'Minggu'
    ];
    final monthNames = {
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

    final dayName = dayNames[today.weekday - 1]; // weekday starts at 1
    final formattedDate =
        '$dayName, ${today.day} ${monthNames[today.month]} ${today.year}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      color: Colors.white,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primary, width: 1),
            ),
            child: Text(
              formattedDate,
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayScheduleList() {
    // Get the current day of the week in Indonesian
    final today = DateTime.now();
    final dayNames = [
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
      'Minggu'
    ];
    final dayName = dayNames[today.weekday - 1]; // weekday starts at 1

    // Get schedules for today
    final schedules = ScheduleModel.getSchedulesByDay(dayName);

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
              'Tidak ada jadwal hari ini',
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
                  color: Colors.black87,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  '${schedule.startTime} - ${schedule.endTime} WIB',
                  style: const TextStyle(
                    color: Colors.black87,
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

          // Room and credits info
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

  // Helper method to get course description
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
          'Related to SW-Testing, this course: introduces the role/importance of software testing, presents testing techniques, and discusses test planning.',
      'Desain Pengalaman Pengguna':
          'User Experience Design bukan tentang membuat sesuai yang cantik, tetapi tentang menciptakan pengalaman yang menyeluruh bagi pengguna akhir.',
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
