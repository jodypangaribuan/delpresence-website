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
import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'dart:math' as math;
import '../../../../core/services/network_service.dart';
import '../../../../core/config/api_config.dart';
import '../../../schedule/data/services/schedule_service.dart';
import '../../../schedule/data/models/schedule_model.dart';

// Custom refresh indicator controller class
class IndicatorController extends ChangeNotifier {
  bool _isLoading = false;
  double _value = 0.0;

  bool get isLoading => _isLoading;
  double get value => _value;

  set value(double val) {
    _value = val;
    notifyListeners();
  }

  void startLoading() {
    _isLoading = true;
    notifyListeners();
  }

  void stopLoading() {
    _isLoading = false;
    notifyListeners();
  }
}

// Custom refresh indicator widget
class CustomRefreshIndicator extends StatefulWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final Widget Function(BuildContext, Widget, IndicatorController) builder;

  const CustomRefreshIndicator({
    Key? key,
    required this.child,
    required this.onRefresh,
    required this.builder,
  }) : super(key: key);

  @override
  State<CustomRefreshIndicator> createState() => _CustomRefreshIndicatorState();
}

class _CustomRefreshIndicatorState extends State<CustomRefreshIndicator> with SingleTickerProviderStateMixin {
  final IndicatorController _controller = IndicatorController();
  late AnimationController _animationController;
  bool _isPulling = false;
  double _dragOffset = 0.0;
  final double _dragThreshold = 80.0;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _handleRefresh() async {
    // Start loading animation
    _controller.startLoading();
    _animationController.repeat();
    
    try {
      // Execute the provided refresh callback
      await widget.onRefresh();
    } catch (e) {
      debugPrint('Error during refresh: $e');
    } finally {
      // Introduce a small delay to ensure user sees the refresh animation
      await Future.delayed(const Duration(milliseconds: 500));
      
      if (mounted) {
        _controller.stopLoading();
        _animationController.stop();
        
        // Smoothly return to initial state
        await Future.delayed(const Duration(milliseconds: 300));
        if (mounted) {
          setState(() {
            _controller.value = 0.0;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        // Handle scroll notifications for pull to refresh detection
        if (notification is ScrollStartNotification) {
          if (notification.metrics.pixels <= 0) {
            setState(() {
              _isPulling = true;
              _dragOffset = 0.0;
            });
          }
        } else if (notification is ScrollUpdateNotification) {
          if (_isPulling && notification.metrics.pixels <= 0) {
            // Calculate how far the user has pulled
            setState(() {
              _dragOffset = math.min(_dragThreshold, -notification.metrics.pixels * 0.5);
              _controller.value = _dragOffset / _dragThreshold;
            });
          }
        } else if (notification is ScrollEndNotification || notification is UserScrollNotification) {
          if (_isPulling) {
            if (_controller.value >= 0.6) {
              _handleRefresh();
            } else {
              setState(() {
                _controller.value = 0.0;
                _dragOffset = 0.0;
              });
            }
            setState(() {
              _isPulling = false;
            });
          }
        } else if (notification is OverscrollNotification && notification.overscroll < 0) {
          // Additional handling for overscroll
          if (!_controller.isLoading) {
            setState(() {
              _dragOffset = math.min(_dragThreshold, _dragOffset - notification.overscroll * 0.3);
              _controller.value = _dragOffset / _dragThreshold;
            });
          }
        }
        return false;
      },
      child: RefreshIndicator(
        // Add a native RefreshIndicator as a fallback
        color: Colors.transparent,
        backgroundColor: Colors.transparent,
        strokeWidth: 0.0,
        onRefresh: _handleRefresh,
        child: widget.builder(context, widget.child, _controller),
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin, WidgetsBindingObserver {
  int _currentIndex = 0;
  bool _isFaceRecognition = false; // Track which attendance method is selected
  late AnimationController _animationController;
  late Animation<double> _slideAnimation;
  Timer? _autoToggleTimer;
  late AnimationController _indicatorAnimController;
  late Animation<double> _indicatorAnimation;
  
  // Tambahkan variabel untuk jadwal
  List<ScheduleModel> _todaySchedules = [];
  bool _isLoadingSchedules = true;
  String? _scheduleError;
  late ScheduleService _scheduleService;
  
  // Map to track active attendance sessions for each schedule
  Map<int, bool> _activeSessionsMap = {};
  bool _isCheckingActiveSessions = false;

  // Halaman yang akan ditampilkan berdasarkan index bottom navbar
  late final List<Widget> _pages;

  // Store the last refresh time to prevent excessive API calls
  DateTime? _lastRefreshTime;

  void _onNavTap(int index) {
    print('Bottom navbar tapped with index: $index');
    
    // Only refresh when navigating TO the home tab (index 0)
    bool navigatingToHome = (_currentIndex != 0 && index == 0);
    
    // Update current index
    setState(() {
      _currentIndex = index;
    });
    
    // If navigating back to home screen, refresh data with a delay
    if (navigatingToHome) {
      // Add a small delay to prevent gesture conflicts
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) {
          _fetchTodaySchedules();
        }
      });
    }
  }
  
  // Method to refresh home screen data
  Future<void> _refreshHomeScreenData() async {
    debugPrint('🔄 Refreshing home screen data');
    // Clear active sessions to avoid stale data
    setState(() {
      _activeSessionsMap.clear();
      _isLoadingSchedules = true; // Show loading indicator
    });
    // Fetch fresh data and wait for it
    await _fetchTodaySchedules();
  }

  void _toggleAttendanceMethod({bool isAutomatic = false}) {
    setState(() {
      _isFaceRecognition = !_isFaceRecognition;
    });
    _animationController.forward(from: 0.0);

    // Only show toast for manual changes
    if (!isAutomatic) {
      // Show toast indicating the current mode
      ToastUtils.showInfoToast(
          context,
          _isFaceRecognition
              ? 'Mode Face Recognition aktif'
              : 'Mode QR Code aktif');
    }

    // Reset auto toggle timer
    _resetAutoToggleTimer();
  }

  void _resetAutoToggleTimer() {
    // Cancel existing timer if any
    _autoToggleTimer?.cancel();

    // Create new timer
    _autoToggleTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _toggleAttendanceMethod(isAutomatic: true);
    });
  }

  @override
  void initState() {
    super.initState();
    
    // Register lifecycle observer
    WidgetsBinding.instance.addObserver(this);

    // Initialize animation controller for FAB
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _slideAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    // Initialize indicator animation controller
    _indicatorAnimController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    // Add the indicator animation initialization
    _indicatorAnimation = Tween<double>(
      begin: 0.4,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _indicatorAnimController,
      curve: Curves.easeInOut,
    ));
    _indicatorAnimController.repeat(reverse: true);
    
    // Initialize network service for schedule data
    final networkService = NetworkService(
      baseUrl: ApiConfig.instance.baseUrl,
      timeout: ApiConfig.instance.timeout,
    );
    _scheduleService = ScheduleService(networkService: networkService);
    
    // Fetch today's schedule data
    _fetchTodaySchedules();

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

    // Start auto toggle timer
    _resetAutoToggleTimer();
  }

  @override
  void dispose() {
    _autoToggleTimer?.cancel();
    _animationController.dispose();
    _indicatorAnimController.dispose();
    
    // Remove observer
    WidgetsBinding.instance.removeObserver(this);
    
    super.dispose();
  }

  // Implement app lifecycle method to refresh data when app resumes
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    if (state == AppLifecycleState.resumed) {
      // App resumed from background, refresh data if on home screen
      if (_currentIndex == 0) {
        debugPrint('🔄 App resumed - refreshing home screen data');
        _refreshHomeScreenData();
      }
    }
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
            // Toggleable floating action button with swipe gesture
            floatingActionButton: GestureDetector(
              onHorizontalDragEnd: (details) {
                // Toggle mode on any horizontal swipe, regardless of direction
                if (details.primaryVelocity != null &&
                    details.primaryVelocity!.abs() > 200) {
                  // Only toggle if the swipe has enough velocity
                  _toggleAttendanceMethod();
                }
              },
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Main Button
                  FloatingActionButton(
                    onPressed: () {
                      HapticFeedback.mediumImpact();

                      if (_isFaceRecognition) {
                        // Navigate to face recognition screen
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const CourseSelectionScreen(),
                          ),
                        );
                      } else {
                        // Navigate to QR code scanner
                        _showQRScannerBottomSheet(context);
                      }
                    },
                    backgroundColor: AppColors.primary,
                    elevation: 4,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      transitionBuilder:
                          (Widget child, Animation<double> animation) {
                        return SlideTransition(
                          position: Tween<Offset>(
                            begin: _isFaceRecognition
                                ? const Offset(-1.5, 0.0)
                                : const Offset(1.5, 0.0),
                            end: Offset.zero,
                          ).animate(animation),
                          child: FadeTransition(
                            opacity: animation,
                            child: child,
                          ),
                        );
                      },
                      child: _isFaceRecognition
                          ? const Icon(
                              Icons.face_outlined,
                              key: ValueKey('face'),
                              color: Colors.white,
                              size: 28,
                            )
                          : const Icon(
                              Icons.qr_code_scanner_rounded,
                              key: ValueKey('qr'),
                              color: Colors.white,
                              size: 28,
                            ),
                    ),
                  ),
                ],
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

  // Helper method to build menu items with just the icon and text
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

  // Show QR scanner bottom sheet
  void _showQRScannerBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.3,
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
                  Icons.qr_code_scanner,
                  color: AppColors.primary,
                  size: 22,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Scan QR Code',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF333333),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Scan QR button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  // Navigate to QR code scanner (simulated for now)
                  ToastUtils.showInfoToast(
                      context, 'QR Scanner akan segera hadir');
                },
                style: ElevatedButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Mulai Scan',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Fungsi untuk mengambil jadwal hari ini
  Future<void> _fetchTodaySchedules() async {
    // Throttle API calls - don't refresh more than once every 3 seconds
    final now = DateTime.now();
    if (_lastRefreshTime != null && 
        now.difference(_lastRefreshTime!).inSeconds < 3) {
      debugPrint('🔄 Throttling API call - too soon since last refresh');
      setState(() {
        _isLoadingSchedules = false; // Hide loading state
      });
      return;
    }
    
    // Update last refresh time
    _lastRefreshTime = now;
    
    setState(() {
      _isLoadingSchedules = true;
      _scheduleError = null;
    });
    
    try {
      debugPrint('🔄 Refreshing home screen data from API...');
      
      // Get academic years first to get the active one
      final academicYears = await _scheduleService.getAcademicYears();
      
      int? academicYearId;
      if (academicYears.isNotEmpty) {
        // Find active academic year
        final activeYear = academicYears.firstWhere(
          (year) => year['is_active'] == true,
          orElse: () => academicYears.first,
        );
        academicYearId = activeYear['id'];
      }
      
      // Get all schedules for today directly
      final today = DateTime.now();
      final dayName = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][today.weekday - 1];
      
      final schedules = await _scheduleService.getStudentSchedules(
        academicYearId: academicYearId,
      );
      
      // Filter schedules for today
      final todaySchedules = ScheduleModel.getSchedulesByDay(schedules, dayName);
      
      // Update state with schedule results first
      if (mounted) {
        setState(() {
          _todaySchedules = todaySchedules;
          _isLoadingSchedules = false;
        });
      }
      
      // After loading schedules, immediately check for active sessions
      if (todaySchedules.isNotEmpty && mounted) {
        await _checkActiveSessionsForSchedules(todaySchedules);
      } else if (mounted) {
        // If no schedules, ensure active sessions map is empty
        setState(() {
          _activeSessionsMap = {};
        });
      }
    } catch (e) {
      debugPrint('🔍 Error refreshing home screen data: $e');
      if (mounted) {
        setState(() {
          _scheduleError = e.toString();
          _isLoadingSchedules = false;
          // Clear active sessions on error to avoid inconsistent state
          _activeSessionsMap = {};
        });
      }
    }
  }

  // Check for active attendance sessions for all schedules
  Future<void> _checkActiveSessionsForSchedules(List<ScheduleModel> schedules) async {
    if (schedules.isEmpty) return;
    
    setState(() {
      _isCheckingActiveSessions = true;
    });
    
    try {
      debugPrint('🔍 Checking for active attendance sessions...');
      
      // Create a temporary map to store results
      Map<int, bool> tempMap = {};
      
      // Check each schedule for active sessions with parallel requests
      List<Future> futures = [];
      for (var schedule in schedules) {
        if (schedule.id != null && schedule.id > 0) {
          futures.add(
            _scheduleService.isAttendanceSessionActive(schedule.id).then((isActive) {
              tempMap[schedule.id] = isActive;
              debugPrint('🔍 Schedule ${schedule.id} active: $isActive');
            }).catchError((e) {
              debugPrint('🔍 Error checking schedule ${schedule.id}: $e');
              // Default to false on error
              tempMap[schedule.id] = false;
            })
          );
        }
      }
      
      // Wait for all checks to complete
      await Future.wait(futures);
      
      // Debug output to help troubleshoot
      debugPrint('🔍 Active sessions map: $tempMap');
      
      // Update state with results if the component is still mounted
      if (mounted) {
        setState(() {
          _activeSessionsMap = tempMap;
          _isCheckingActiveSessions = false;
        });
      }
    } catch (e) {
      debugPrint('🔍 Error checking active sessions: $e');
      if (mounted) {
        setState(() {
          _isCheckingActiveSessions = false;
        });
      }
    }
  }

  // Get today's classes data - now using actual data from backend
  List<Map<String, dynamic>> _getTodayClasses() {
    if (_isLoadingSchedules) {
      return [];
    }
    
    if (_scheduleError != null) {
      return [];
    }
    
    if (_todaySchedules.isEmpty) {
      return [];
    }
    
    // Convert ScheduleModel list to the format expected by the UI
    final now = DateTime.now();
    final currentTime = now.hour * 60 + now.minute;
    
    return _todaySchedules.map((schedule) {
      // Parse times to determine if class is active
      final startTimeParts = schedule.startTime.split(':');
      final endTimeParts = schedule.endTime.split(':');
      
      final startTimeMinutes = int.parse(startTimeParts[0]) * 60 + int.parse(startTimeParts[1]);
      final endTimeMinutes = int.parse(endTimeParts[0]) * 60 + int.parse(endTimeParts[1]);
      
      final bool isActive = currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
      
      // Check if this schedule has an active attendance session
      final bool hasActiveSession = schedule.id != null ? (_activeSessionsMap[schedule.id!] ?? false) : false;
      
      return {
        'title': schedule.courseName,
        'time': '${schedule.startTime} - ${schedule.endTime}',
        'room': schedule.roomName,
        'lecturer': schedule.lecturerName,
        'status': schedule.status,
        'isActive': isActive || schedule.status == 'Sedang Berlangsung',
        'scheduleId': schedule.id,
        'hasActiveSession': hasActiveSession,
      };
    }).toList();
  }

  // Empty classes message - updated with loading indicator
  Widget _buildEmptyClassesMessage() {
    if (_isLoadingSchedules) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        child: const SizedBox(
          height: 20,
          width: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
          ),
                                          ),
      );
    }
    
    if (_scheduleError != null) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
                                child: Column(
                                  children: [
                                        Text(
              'Gagal memuat jadwal',
                                          style: TextStyle(
                fontSize: 12,
                color: Colors.red[600],
                fontStyle: FontStyle.italic,
                                          ),
                                        ),
            TextButton(
              onPressed: _fetchTodaySchedules,
              child: const Text('Coba Lagi', style: TextStyle(fontSize: 12)),
              ),
            ],
      ),
    );
  }

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
    // Get the attendance session status
    final int? scheduleId = classData['scheduleId'];
    final bool hasActiveSession = classData['hasActiveSession'] ?? false;
    final bool isActive = classData['isActive'] as bool;
    
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
            color: (isActive && hasActiveSession)
                ? AppColors.primary.withOpacity(0.3)
                : Colors.grey.withOpacity(0.1),
            width: (isActive && hasActiveSession) ? 1.5 : 1,
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
                      color: (isActive && hasActiveSession)
                          ? AppColors.primary.withOpacity(0.08)
                          : Colors.grey.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      classData['status'] as String,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w500,
                        color: (isActive && hasActiveSession)
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
              if (isActive) ...[
                const SizedBox(height: 10),
                const Divider(
                    height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: hasActiveSession ? () {
                      _showAbsensiBottomSheet(context);
                    } : null, // Button is disabled when no active session
                    style: ElevatedButton.styleFrom(
                      foregroundColor: Colors.white,
                      backgroundColor: hasActiveSession ? AppColors.primary : Colors.grey.shade400,
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
                    child: Text(
                      hasActiveSession ? 'Absen Sekarang' : 'Belum Ada Sesi Absensi'
                    ),
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
    // Check if there are any active sessions
    bool hasAnyActiveSession = _activeSessionsMap.values.contains(true);
    
    if (!hasAnyActiveSession) {
      // Show toast if no active sessions
      ToastUtils.showInfoToast(context, 'Tidak ada sesi absensi yang aktif saat ini');
      return;
    }
    
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

// Halaman beranda baru dengan header dan konten kosong
class _HomePage extends StatefulWidget {
  const _HomePage({Key? key}) : super(key: key);

  @override
  State<_HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<_HomePage> {
  bool _initialRefreshDone = false;

  @override
  void initState() {
    super.initState();
    // Use a post-frame callback with a small delay to avoid the mouse tracker error
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        _refreshData();
      }
    });
  }

  void _refreshData() {
    if (mounted && !_initialRefreshDone) {
      final homeState = context.findAncestorStateOfType<_HomeScreenState>();
      if (homeState != null) {
        // Use this flag to avoid duplicate refreshes
        _initialRefreshDone = true;
        homeState._fetchTodaySchedules();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Get the HomeScreen parent state using findAncestorStateOfType
    final homeState = context.findAncestorStateOfType<_HomeScreenState>();
    
    // Check if there are any active sessions
    bool hasAnyActiveSession = false;
    if (homeState != null) {
      hasAnyActiveSession = homeState._activeSessionsMap.values.contains(true);
    }
    
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
                      backgroundColor: Colors.white,
                      displacement: 20.0,
                      strokeWidth: 3.0, // Make the indicator more visible
                      onRefresh: () async {
                        // Properly refresh data and wait for completion
                        if (homeState != null) {
                          // Add a small delay to prevent Flutter gesture conflict
                          await Future.delayed(const Duration(milliseconds: 100));
                          await homeState._fetchTodaySchedules();
                        }
                        // Return a completed future to satisfy the RefreshIndicator
                        return Future<void>.value();
                      },
                      child: SingleChildScrollView(
                        // Use AlwaysScrollableScrollPhysics to ensure refresh works even when content doesn't fill screen
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
                                            child: homeState?._buildMenuItem(
                                              context,
                                              title: 'Absensi',
                                              iconPath:
                                                  'assets/images/menu-absensi.png',
                                              iconSize: iconSize,
                                              onTap: () {
                                                // Only show bottom sheet if there are active sessions
                                                if (hasAnyActiveSession) {
                                                  homeState?._showAbsensiBottomSheet(context);
                                                } else {
                                                  // Show toast if no active sessions
                                                  ToastUtils.showInfoToast(context, 'Tidak ada sesi absensi yang aktif saat ini');
                                                }
                                              },
                                            ),
                                          ),

                                          // Mata Kuliah menu item
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                right: 20),
                                            child: homeState?._buildMenuItem(
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
                                            child: homeState?._buildMenuItem(
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
                                            child: homeState?._buildMenuItem(
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
                                            child: homeState?._buildMenuItem(
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
                                        const Spacer(),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    if (homeState?._getTodayClasses().isEmpty ?? true)
                                      homeState?._buildEmptyClassesMessage() ?? Container()
                                    else
                                      Column(
                                        children: (homeState?._getTodayClasses() ?? [])
                                            .map((classData) => homeState?._buildClassCard(
                                                context, classData) ?? Container())
                                            .toList(),
                                      ),
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
}
