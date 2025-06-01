import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:toastification/toastification.dart';
import '../../../../core/constants/colors.dart';
import '../../../../features/face/data/services/face_service.dart';
import '../../../../features/face/data/utils/face_recognition_util.dart';
import '../../../../core/services/network_service.dart';
import '../../../../core/config/api_config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FaceRecognitionAttendanceScreen extends StatefulWidget {
  final String courseName;

  const FaceRecognitionAttendanceScreen({
    super.key,
    required this.courseName,
  });

  @override
  State<FaceRecognitionAttendanceScreen> createState() =>
      _FaceRecognitionAttendanceScreenState();
}

class _FaceRecognitionAttendanceScreenState
    extends State<FaceRecognitionAttendanceScreen> with WidgetsBindingObserver {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isFaceDetected = false;
  bool _isProcessing = false;
  FaceRecognitionUtil? _faceRecognitionUtil;
  FaceService? _faceService;
  int? _studentId;
  Timer? _faceDetectionTimer;
  bool _hasShownError = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeDependencies();
    _requestCameraPermission();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Handle app lifecycle changes
    if (state == AppLifecycleState.inactive) {
      // App is inactive: pause camera
      _cameraController?.pausePreview();
    } else if (state == AppLifecycleState.resumed) {
      // App is resumed: resume camera if it was initialized before
      if (_cameraController != null && _cameraController!.value.isInitialized) {
        _cameraController?.resumePreview();
      }
    }
  }

  Future<void> _initializeDependencies() async {
    // Setup network service with API config
    final networkService = NetworkService(
      baseUrl: ApiConfig.instance.apiUrl,
      defaultHeaders: ApiConfig.instance.defaultHeaders,
      timeout: ApiConfig.instance.timeout,
    );

    // Initialize face service
    _faceService = FaceService(networkService: networkService);
    
    // Initialize face recognition util
    _faceRecognitionUtil = FaceRecognitionUtil();
    try {
      await _faceRecognitionUtil!.initModel();
    } catch (e) {
      debugPrint('Error initializing face recognition model: $e');
    }

    // Get student ID from shared preferences
    await _getStudentId();
  }

  Future<void> _getStudentId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final studentIdStr = prefs.getString('student_id');
      if (studentIdStr != null) {
        setState(() {
          _studentId = int.parse(studentIdStr);
        });
        debugPrint('Student ID loaded: $_studentId');
      } else {
        debugPrint('No student_id found in SharedPreferences');
        // For demo, set a default student ID
        setState(() {
          _studentId = 12345; // Demo ID
        });
      }
    } catch (e) {
      debugPrint('Error loading student ID: $e');
      // Set demo ID as fallback
      setState(() {
        _studentId = 12345; // Demo ID
      });
    }
  }

  Future<void> _requestCameraPermission() async {
    final status = await Permission.camera.request();

    if (!mounted) return;

    if (status.isGranted) {
      _initializeCamera();
    } else if (status.isPermanentlyDenied) {
      _showPermissionPermanentlyDeniedDialog();
    } else {
      if (mounted) {
        Navigator.pop(context);
        toastification.show(
          context: context,
          type: ToastificationType.warning,
          style: ToastificationStyle.fillColored,
          autoCloseDuration: const Duration(seconds: 3),
          title: const Text('Izin Dibutuhkan'),
          description: const Text('Izin kamera diperlukan untuk absensi wajah'),
          showProgressBar: true,
          primaryColor: AppColors.warning,
          closeOnClick: true,
          dragToClose: true,
        );
      }
    }
  }

  void _showPermissionPermanentlyDeniedDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Izin Kamera Diperlukan'),
          content: const Text(
            'Izin kamera diperlukan untuk absensi wajah. '
            'Silakan buka pengaturan aplikasi untuk mengaktifkan izin kamera.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to previous screen
              },
              child: const Text('Batal'),
            ),
            TextButton(
              onPressed: () {
                openAppSettings();
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to previous screen
              },
              child: const Text('Buka Pengaturan'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _initializeCamera() async {
    try {
      // Safely dispose of any previous camera controller
      await _cameraController?.dispose();
      
      final cameras = await availableCameras();

      if (!mounted) return;

      if (cameras.isEmpty) {
        debugPrint('No cameras available');
        return;
      }

      // Use front camera for face recognition
      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      debugPrint('Using camera: ${frontCamera.name}, ${frontCamera.lensDirection}');

      // Use a more compatible resolution preset
      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid 
            ? ImageFormatGroup.jpeg  // Use JPEG for Android
            : ImageFormatGroup.yuv420,
      );

      // Initialize with error handling
      await _cameraController!.initialize().catchError((e) {
        debugPrint('Camera initialization error: $e');
        _showCameraError(e.toString());
        return null;
      });

      if (!mounted) return;

      setState(() {
        _isCameraInitialized = _cameraController!.value.isInitialized;
      });

      if (_isCameraInitialized) {
        _startFaceDetection();
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      _showCameraError(e.toString());
    }
  }

  void _showCameraError(String error) {
    if (!mounted || _hasShownError) return;
    
    setState(() {
      _hasShownError = true; 
    });
    
    // Show error notification
    toastification.show(
      context: context,
      type: ToastificationType.error,
      style: ToastificationStyle.fillColored,
      title: const Text('Error Kamera'),
      description: Text('Gagal menginisialisasi kamera. Coba lagi nanti.'),
      autoCloseDuration: const Duration(seconds: 3),
      primaryColor: AppColors.error,
    );
    
    // Go back to previous screen after a short delay
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        Navigator.of(context).pop();
      }
    });
  }

  void _startFaceDetection() {
    // Use real face detection instead of simulation
    _faceDetectionTimer = Timer.periodic(
      const Duration(milliseconds: 300),
      (_) async {
        if (!_isCameraInitialized || _isProcessing || !mounted) return;
        
        try {
          final file = await _cameraController!.takePicture();
          
          // Use ML Kit to detect faces
          final faceRect = await _faceRecognitionUtil?.detectFace(file.path);
          
          if (faceRect != null && mounted) {
            setState(() {
              _isFaceDetected = true;
              _isProcessing = true;
            });
            
            // Cancel the timer
            _faceDetectionTimer?.cancel();
            
            // Process for attendance
            await _processAttendance(file);
          } else {
            // Delete the file if no face detected
            await File(file.path).delete();
          }
        } catch (e) {
          debugPrint('Error in face detection loop: $e');
        }
      },
    );
  }

  Future<void> _processAttendance(XFile imageFile) async {
    try {
      if (_studentId == null) {
        throw Exception('Student ID not available');
      }
      
      // Extract embedding
      final embedding = await _faceRecognitionUtil?.processImageForEmbedding(imageFile.path);
      
      if (embedding == null) {
        throw Exception('Gagal mengekstrak fitur wajah');
      }
      
      // Convert image to base64 for sending to server
      final imageBytes = await File(imageFile.path).readAsBytes();
      final base64Image = base64Encode(imageBytes);
      
      // Call the API with extracted embedding
      if (_faceService == null) {
        throw Exception('Face service not initialized');
      }
      
      final result = await _faceService!.verifyFace(_studentId!, base64Image, embedding);
      
      // Clean up the image file
      await File(imageFile.path).delete();
      
      if (result['success'] == true) {
        _markAttendanceSuccess();
      } else {
        throw Exception(result['message'] ?? 'Verifikasi wajah gagal');
      }
    } catch (e) {
      debugPrint('Error during attendance: $e');
      if (mounted) {
        // Navigate back to previous screen
        Navigator.pop(context);
        
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          autoCloseDuration: const Duration(seconds: 3),
          title: const Text('Gagal'),
          description: Text('Verifikasi wajah gagal: $e'),
          showProgressBar: true,
          primaryColor: AppColors.error,
          closeOnClick: true,
          dragToClose: true,
        );
      }
    }
  }

  void _markAttendanceSuccess() {
    // Navigate back to previous screen with a slight delay to ensure UI updates
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        Navigator.pop(context);

        // Show success notification
        toastification.show(
          context: context,
          type: ToastificationType.success,
          style: ToastificationStyle.fillColored,
          autoCloseDuration: const Duration(seconds: 3),
          title: const Text('Berhasil'),
          description: Text(
              'Absensi berhasil dicatat untuk mata kuliah ${widget.courseName}'),
          showProgressBar: true,
          primaryColor: AppColors.success,
          closeOnClick: true,
          dragToClose: true,
        );
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _faceDetectionTimer?.cancel();
    _cameraController?.dispose();
    _faceRecognitionUtil?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Face Recognition',
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
          Expanded(
            child: Stack(
              children: [
                // Camera preview
                if (_isCameraInitialized)
                  SizedBox(
                    width: MediaQuery.of(context).size.width,
                    height: MediaQuery.of(context).size.height,
                    child: ClipRect(
                      child: OverflowBox(
                        alignment: Alignment.center,
                        child: FittedBox(
                          fit: BoxFit.cover,
                          child: SizedBox(
                            width: MediaQuery.of(context).size.width,
                            height: MediaQuery.of(context).size.width *
                                _cameraController!.value.aspectRatio,
                            child: Transform.scale(
                              scaleX: -1.0, // Mirror the camera horizontally
                              child: CameraPreview(_cameraController!),
                            ),
                          ),
                        ),
                      ),
                    ),
                  )
                else
                  const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white,
                    ),
                  ),

                // Face detection overlay
                if (_isFaceDetected)
                  Positioned.fill(
                    child: CustomPaint(
                      painter: FaceOverlayPainter(),
                    ),
                  ),

                // Processing indicator
                if (_isProcessing)
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 40, vertical: 20),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'Wajah Terdeteksi',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 15),
                          const CircularProgressIndicator(
                            color: Colors.white,
                          ),
                          const SizedBox(height: 15),
                          Text(
                            'Memproses absensi untuk\n${widget.courseName}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                // Instructions overlay
                Positioned(
                  bottom: 30,
                  left: 20,
                  right: 20,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black.withAlpha(178),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isFaceDetected
                              ? 'Wajah terdeteksi! Memproses...'
                              : 'Posisikan wajah Anda di dalam bingkai',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _isProcessing
                              ? 'Absensi sedang diproses'
                              : 'Pastikan pencahayaan cukup dan wajah terlihat jelas',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class FaceOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width * 0.4;

    // Draw face oval guide
    final ovalPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    // Draw oval for face positioning
    canvas.drawOval(
      Rect.fromCenter(
        center: center,
        width: radius * 1.3,
        height: radius * 1.8,
      ),
      ovalPaint,
    );

    // Add a subtle glow effect
    final glowPaint = Paint()
      ..color = AppColors.primary.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8.0
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8.0);

    canvas.drawOval(
      Rect.fromCenter(
        center: center,
        width: radius * 1.3,
        height: radius * 1.8,
      ),
      glowPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }
}
