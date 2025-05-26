import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/services.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/widgets/global_bottom_nav.dart';
import '../../../../core/utils/toast_utils.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import '../../../schedule/presentation/screens/today_schedule_page.dart';
import '../../../schedule/presentation/screens/schedule_screen.dart';
import '../../../attendance/presentation/screens/attendance_history_screen.dart';
import '../../../attendance/presentation/screens/today_attendance_history_page.dart';
import '../../../attendance/presentation/screens/course_selection_screen.dart';
import '../widgets/home_header.dart';
import '../bloc/student_bloc.dart';
import '../../domain/repositories/student_repository.dart';
import 'course_list_screen.dart';
import 'profile_screen.dart';
import '../../../../features/settings/presentation/screens/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  // Halaman yang akan ditampilkan berdasarkan index bottom navbar
  late final List<Widget> _pages;

  void _onNavTap(int index) {
    print('Bottom navbar tapped with index: $index');
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  void initState() {
    super.initState();

    // Initialize pages list
    _pages = [
      const _HomePage(),
      const TodaySchedulePage(),
      const CourseSelectionScreen(),
      const TodayAttendanceHistoryPage(),
      const ProfileScreen(),
    ];

    // Ensure UI overlay style is set consistently
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarDividerColor: Colors.transparent,
      ),
    );
  }

  // Handle navigation to different pages based on bottom navbar index
  Widget _getPageForIndex(int index) {
    switch (index) {
      case 0:
        return const _HomePage();
      case 1:
        return const TodaySchedulePage();
      case 2:
        return const CourseSelectionScreen();
      case 3:
        return const TodayAttendanceHistoryPage();
      case 4:
        return const ProfileScreen();
      default:
        return const _HomePage();
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => StudentBloc(
        context.read<StudentRepository>(),
      )..add(const LoadStudentDataEvent()),
      child: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthInitial) {
            // Navigate to login screen when logout is successful
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const LoginScreen()),
            );
          }
        },
        child: AnnotatedRegion<SystemUiOverlayStyle>(
          value: const SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.light,
            systemNavigationBarColor: Colors.transparent,
          ),
          child: Scaffold(
            backgroundColor: AppColors.background,
            extendBodyBehindAppBar: true,
            extendBody: true,
            body: _getPageForIndex(_currentIndex),
            // Center floating action button for QR scan (index 2)
            floatingActionButton: FloatingActionButton(
              onPressed: () {
                HapticFeedback.mediumImpact();
                // Navigate directly to the CourseSelectionScreen
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CourseSelectionScreen(),
                  ),
                );
              },
              backgroundColor: AppColors.primary,
              elevation: 4,
              child: const Icon(
                Icons.face,
                color: Colors.white,
                size: 30,
              ),
            ),
            floatingActionButtonLocation:
                FloatingActionButtonLocation.centerDocked,
            bottomNavigationBar: GlobalBottomNav(
              currentIndex: _currentIndex,
              onTap: _onNavTap,
            ),
          ),
        ),
      ),
    );
  }

  void _handleLogout() {
    // Dispatch logout event to AuthBloc
    context.read<AuthBloc>().add(LogoutEvent());
    // Navigation will be handled by BlocListener
  }
}

// Halaman beranda baru dengan header dan konten kosong
class _HomePage extends StatelessWidget {
  const _HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    // Set status bar to transparent with light icons
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    // Calculate screen width to determine icon size
    final screenWidth = MediaQuery.of(context).size.width;
    // Size for icons to fit approximately 4 across with spacing - reduced by 15%
    final iconSize = ((screenWidth - 80) / 4) * 0.80;

    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      appBar: null, // Remove AppBar to fix status bar issue
      body: BlocBuilder<StudentBloc, StudentState>(
        builder: (context, state) {
          return Stack(
            children: [
              // Header with user information
              const Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: HomeHeader(),
              ),

              // Content with rounded top corners
              Positioned(
                top: 140, // Return to original position
                left: 0,
                right: 0,
                bottom: 0,
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(25),
                    topRight: Radius.circular(25),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          spreadRadius: 0,
                          offset: const Offset(0, -2),
                        ),
                      ],
                    ),
                    child: RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () async {
                        context
                            .read<StudentBloc>()
                            .add(const LoadStudentDataEvent());
                      },
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 100),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Menu Grid - Improved layout
                              Container(
                                padding:
                                    const EdgeInsets.fromLTRB(20, 16, 20, 15),
                                margin: const EdgeInsets.only(top: 0),
                                decoration: const BoxDecoration(
                                  color: Colors.transparent,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Horizontally scrollable menu row
                                    Container(
                                      height: iconSize +
                                          30, // Adjusted for icon + text height
                                      margin: const EdgeInsets.symmetric(
                                          vertical: 10),
                                      child: ListView(
                                        scrollDirection: Axis.horizontal,
                                        physics: const ClampingScrollPhysics(),
                                        padding: EdgeInsets.zero,
                                        children: [
                                          // First item with left padding to match container
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                right: 20),
                                            child: _buildMenuItem(
                                              context,
                                              title: 'Absensi',
                                              iconPath:
                                                  'assets/images/menu-absensi.png',
                                              iconSize: iconSize,
                                              onTap: () {
                                                _showAbsensiBottomSheet(
                                                    context);
                                              },
                                            ),
                                          ),

                                          // Mata Kuliah menu item
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                right: 20),
                                            child: _buildMenuItem(
                                              context,
                                              title: 'Mata Kuliah',
                                              iconPath:
                                                  'assets/images/menu-matakuliah.png',
                                              iconSize: iconSize,
                                              onTap: () {
                                                Navigator.push(
                                                  context,
                                                  MaterialPageRoute(
                                                    builder: (context) =>
                                                        const CourseListScreen(),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),

                                          // Jadwal menu item
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                right: 20),
                                            child: _buildMenuItem(
                                              context,
                                              title: 'Jadwal',
                                              iconPath:
                                                  'assets/images/menu-riwayat.png',
                                              iconSize: iconSize,
                                              onTap: () {
                                                Navigator.push(
                                                  context,
                                                  MaterialPageRoute(
                                                    builder: (context) =>
                                                        const ScheduleScreen(),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),

                                          // Riwayat menu item
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                right: 20),
                                            child: _buildMenuItem(
                                              context,
                                              title: 'Riwayat',
                                              iconPath:
                                                  'assets/images/menu-riwayat.png',
                                              iconSize: iconSize,
                                              onTap: () {
                                                Navigator.push(
                                                  context,
                                                  MaterialPageRoute(
                                                    builder: (context) =>
                                                        const AttendanceHistoryScreen(),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),

                                          // Pengaturan menu item
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                right: 20),
                                            child: _buildMenuItem(
                                              context,
                                              title: 'Pengaturan',
                                              iconPath:
                                                  'assets/images/menu-pengaturan.png',
                                              iconSize: iconSize,
                                              onTap: () {
                                                Navigator.push(
                                                  context,
                                                  MaterialPageRoute(
                                                    builder: (context) =>
                                                        const SettingsScreen(),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Today's Class Section with improved UI
                              Container(
                                padding:
                                    const EdgeInsets.fromLTRB(20, 0, 20, 16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.today,
                                            color: AppColors.primary, size: 20),
                                        const SizedBox(width: 8),
                                        GestureDetector(
                                          onTap: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    const TodaySchedulePage(),
                                              ),
                                            );
                                          },
                                          child: Row(
                                            children: [
                                              Text(
                                                'Jadwal Kelas Hari Ini',
                                                style: TextStyle(
                                                  fontSize: 13.5,
                                                  fontWeight: FontWeight.w600,
                                                  color: AppColors.textPrimary,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              Icon(
                                                Icons.arrow_forward_ios,
                                                size: 12,
                                                color: AppColors.primary,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    if (_getTodayClasses().isEmpty)
                                      _buildEmptyClassesMessage()
                                    else
                                      Column(
                                        children: _getTodayClasses()
                                            .map((classData) => _buildClassCard(
                                                context, classData))
                                            .toList(),
                                      ),
                                  ],
                                ),
                              ),

                              // Recent Attendance Activity with improved UI
                              Container(
                                padding:
                                    const EdgeInsets.fromLTRB(20, 4, 20, 16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.history_outlined,
                                            color: AppColors.primary, size: 20),
                                        const SizedBox(width: 8),
                                        GestureDetector(
                                          onTap: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    const AttendanceHistoryScreen(),
                                              ),
                                            );
                                          },
                                          child: Row(
                                            children: [
                                              Text(
                                                'Riwayat Absensi Terakhir',
                                                style: TextStyle(
                                                  fontSize: 13.5,
                                                  fontWeight: FontWeight.w600,
                                                  color: AppColors.textPrimary,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              Icon(
                                                Icons.arrow_forward_ios,
                                                size: 12,
                                                color: AppColors.primary,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    if (_getRecentActivities().isEmpty)
                                      _buildEmptyActivitiesMessage()
                                    else
                                      Column(
                                        children: _getRecentActivities()
                                            .map((activity) =>
                                                _buildActivityCard(activity))
                                            .toList(),
                                      ),
                                  ],
                                ),
                              ),

                              // Today's Status Report with improved UI
                              Container(
                                padding:
                                    const EdgeInsets.fromLTRB(20, 0, 20, 24),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(Icons.assignment_outlined,
                                            color: AppColors.primary, size: 20),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Status Hari Ini',
                                          style: TextStyle(
                                            fontSize: 13.5,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                      ],
                                    ),
                                    _buildTodayStatusReport(),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  // Helper method to build menu items with just the icon and text (keep original)
  Widget _buildMenuItem(
    BuildContext context, {
    required String title,
    required String iconPath,
    required double iconSize,
    required VoidCallback onTap,
  }) {
    return _PressableMenuItem(
      title: title,
      iconPath: iconPath,
      iconSize: iconSize,
      onTap: onTap,
    );
  }

  // Get today's classes data
  List<Map<String, dynamic>> _getTodayClasses() {
    return [
      {
        'title': 'Pemrograman Mobile',
        'time': '08:00 - 10:30',
        'room': 'Ruang 516',
        'lecturer': 'Tegar Arifin Prasetyo, S.Si., M.Si.',
        'status': 'Sedang Berlangsung',
        'isActive': true,
      },
      {
        'title': 'Aplikasi Terdistribusi dan Layanan Virtual',
        'time': '13:00 - 15:30',
        'room': 'Ruang 527',
        'lecturer': 'Rudy Chandra, S.Kom., M.Kom',
        'status': 'Akan Datang',
        'isActive': false,
      },
    ];
  }

  // Empty classes message
  Widget _buildEmptyClassesMessage() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      alignment: Alignment.center,
      child: Text(
        'Tidak ada kelas hari ini',
        style: TextStyle(
          fontSize: 12,
          color: AppColors.textSecondary,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  // Build class card - improved design
  Widget _buildClassCard(BuildContext context, Map<String, dynamic> classData) {
    return GestureDetector(
      onTap: () {
        // Navigate to today's schedule screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const TodaySchedulePage(),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
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
            color: classData['isActive'] as bool
                ? AppColors.primary.withOpacity(0.3)
                : Colors.grey.withOpacity(0.1),
            width: classData['isActive'] as bool ? 1.5 : 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      classData['title'] as String,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: classData['isActive'] as bool
                          ? AppColors.primary.withOpacity(0.08)
                          : Colors.grey.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      classData['status'] as String,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w500,
                        color: classData['isActive'] as bool
                            ? AppColors.primary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              Row(
                children: [
                  Icon(
                    Icons.access_time_rounded,
                    size: 12,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    classData['time'] as String,
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
                    classData['room'] as String,
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
                  Text(
                    classData['lecturer'] as String,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              if (classData['isActive'] as bool) ...[
                const SizedBox(height: 10),
                const Divider(
                    height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      _showAbsensiBottomSheet(context);
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
      ),
    );
  }

  // Get recent attendance activities
  List<Map<String, dynamic>> _getRecentActivities() {
    return [
      {
        'course': 'Pemrograman Mobile',
        'date': '21 Mei 2024',
        'time': '09:15',
        'status': 'Hadir',
        'method': 'Face Recognition',
      },
      {
        'course': 'Aljabar Linier',
        'date': '20 Mei 2024',
        'time': '14:05',
        'status': 'Terlambat',
        'method': 'QR Code',
      },
      {
        'course': 'Sistem Komputasi Awan',
        'date': '19 Mei 2024',
        'time': '10:30',
        'status': 'Alpa',
        'method': 'QR Code',
      },
    ];
  }

  // Empty activities message
  Widget _buildEmptyActivitiesMessage() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      alignment: Alignment.center,
      child: Text(
        'Belum ada aktivitas absensi',
        style: TextStyle(
          fontSize: 12,
          color: AppColors.textSecondary,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  // Build activity card - improved design
  Widget _buildActivityCard(Map<String, dynamic> activity) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
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
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 32,
              width: 32,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(
                activity['method'] == 'QR Code'
                    ? Icons.qr_code_scanner_rounded
                    : Icons.face_outlined,
                color: AppColors.primary,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    activity['course'] as String,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today_outlined,
                        size: 10,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 3),
                      Text(
                        '${activity['date']} · ${activity['time']}',
                        style: TextStyle(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 6,
                vertical: 2,
              ),
              decoration: BoxDecoration(
                color: _getStatusColor(activity['status'] as String)
                    .withOpacity(0.08),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                activity['status'] as String,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w500,
                  color: _getStatusColor(activity['status'] as String),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Helper to get color based on status
  Color _getStatusColor(String status) {
    switch (status) {
      case 'Hadir':
        return AppColors.success;
      case 'Terlambat':
        return AppColors.warning;
      case 'Alpa':
        return AppColors.error;
      default:
        return AppColors.success;
    }
  }

  // Today's status report - improved design
  Widget _buildTodayStatusReport() {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
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
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.check_circle_outlined,
                    color: AppColors.success,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '2 dari 4 kelas sudah dihadiri',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '1 kelas terlambat, 1 kelas alpa',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
            const SizedBox(height: 14),
            // Attendance status counters with improved design
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildAttendanceCounter('2', 'Hadir', AppColors.primary),
                Container(
                  height: 28,
                  width: 1,
                  color: Colors.grey.withOpacity(0.2),
                ),
                _buildAttendanceCounter('1', 'Terlambat', AppColors.warning),
                Container(
                  height: 28,
                  width: 1,
                  color: Colors.grey.withOpacity(0.2),
                ),
                _buildAttendanceCounter('1', 'Alpa', AppColors.error),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Helper method for creating attendance counters
  Widget _buildAttendanceCounter(String count, String label, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(
            count,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  // Improved bottom sheet method
  void _showAbsensiBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.42, // Adjusted height
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
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

            // Title
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

            // Content - two options
            Column(
              children: [
                // QR Code Option
                _buildMinimalistAbsensiOption(
                  context,
                  icon: Icons.qr_code_scanner_rounded,
                  title: 'Scan QR',
                  description: 'Pindai kode QR untuk melakukan absensi',
                  onTap: () {
                    Navigator.pop(context);
                    ToastUtils.showInfoToast(context, 'Scan QR dipilih');
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
                    Navigator.pop(context);
                    // Navigate to course selection screen for face recognition
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const CourseSelectionScreen(),
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
  }

  // Helper to build minimalist absensi option items
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
}

// Stateful wrapper for menu item with press effect
class _PressableMenuItem extends StatefulWidget {
  final String title;
  final String iconPath;
  final double iconSize;
  final VoidCallback onTap;

  const _PressableMenuItem({
    required this.title,
    required this.iconPath,
    required this.iconSize,
    required this.onTap,
  });

  @override
  State<_PressableMenuItem> createState() => _PressableMenuItemState();
}

class _PressableMenuItemState extends State<_PressableMenuItem>
    with SingleTickerProviderStateMixin {
  bool _isPressed = false;
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _shadowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic),
    );

    _shadowAnimation = Tween<double>(begin: 1.0, end: 0.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(_) {
    setState(() => _isPressed = true);
    _controller.forward();
  }

  void _handleTapUp(_) {
    setState(() => _isPressed = false);
    _controller.reverse();
    widget.onTap();
  }

  void _handleTapCancel() {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: Column(
        children: [
          // Animated builder for more complex animations
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: Container(
                  width: widget.iconSize,
                  height: widget.iconSize,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      // Bottom shadow - reduces when pressed
                      BoxShadow(
                        color: Colors.black
                            .withOpacity(0.08 * _shadowAnimation.value),
                        offset: Offset(0, 3 * _shadowAnimation.value),
                        blurRadius: 5 * _shadowAnimation.value,
                        spreadRadius: -1,
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.asset(
                      widget.iconPath,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              );
            },
          ),

          const SizedBox(height: 5),

          // Menu title text
          Text(
            widget.title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

// Dummy page for placeholder tabs
class _DummyPage extends StatelessWidget {
  final String title;
  final Color color;

  const _DummyPage({
    required this.title,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: color,
      ),
      body: Center(
        child: Text(
          title,
          style: const TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}
