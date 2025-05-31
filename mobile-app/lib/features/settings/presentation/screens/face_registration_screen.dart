import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:toastification/toastification.dart';
import '../../../../core/constants/colors.dart';
import '../../../../features/face/data/services/face_service.dart';
import '../../../../core/services/network_service.dart';
import '../../../../core/config/api_config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FaceRegistrationScreen extends StatefulWidget {
  const FaceRegistrationScreen({super.key});

  @override
  State<FaceRegistrationScreen> createState() => _FaceRegistrationScreenState();
}

class _FaceRegistrationScreenState extends State<FaceRegistrationScreen> {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isFaceDetected = false;
  bool _isRegistering = false;
  bool _isProcessing = false;
  Timer? _registrationTimer;
  int _countdownSeconds = 5;
  Timer? _faceDetectionTimer;
  FaceService? _faceService;
  int? _studentId;
  XFile? _capturedImage;

  @override
  void initState() {
    super.initState();
    _initializeDependencies();
    _requestCameraPermission();
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
          description:
              const Text('Izin kamera diperlukan untuk pendaftaran wajah'),
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
            'Izin kamera diperlukan untuk pendaftaran wajah. '
            'Silakan buka pengaturan aplikasi untuk mengaktifkan izin kamera.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to settings screen
              },
              child: const Text('Batal'),
            ),
            TextButton(
              onPressed: () {
                openAppSettings();
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to settings screen
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
      final cameras = await availableCameras();

      if (!mounted) return;

      if (cameras.isEmpty) {
        print('No cameras available');
        return;
      }

      // Use front camera for face registration
      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      print('Using camera: ${frontCamera.name}, ${frontCamera.lensDirection}');

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.yuv420,
      );

      await _cameraController!.initialize();

      if (!mounted) return;

      setState(() {
        _isCameraInitialized = true;
      });

      // Start real face detection (simulated in demo)
      _startDemoFaceDetection();
    } catch (e) {
      print('Error initializing camera: $e');
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          title: const Text('Error'),
          description: Text('Camera initialization failed: $e'),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    }
  }

  void _startDemoFaceDetection() {
    // For demo purposes, simulate face detection after a short delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted && _isCameraInitialized) {
        setState(() {
          _isFaceDetected = true;
        });

        // Start registration countdown
        _startRegistrationCountdown();
      }
    });
  }

  void _startRegistrationCountdown() {
    setState(() {
      _isRegistering = true;
      _countdownSeconds = 5;
    });

    _registrationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdownSeconds > 0) {
        setState(() {
          _countdownSeconds--;
        });
      } else {
        _captureAndRegisterFace();
      }
    });
  }

  void _cancelRegistration() {
    _registrationTimer?.cancel();
    if (mounted && _isRegistering) {
      setState(() {
        _isRegistering = false;
      });
    }
  }

  Future<void> _captureAndRegisterFace() async {
    _registrationTimer?.cancel();
    
    try {
      setState(() {
        _isProcessing = true;
      });
      
      // Take picture
      if (_cameraController == null || !_cameraController!.value.isInitialized) {
        throw Exception('Camera controller not initialized');
      }
      
      // Capture the image
      final image = await _cameraController!.takePicture();
      setState(() {
        _capturedImage = image;
      });
      
      if (_studentId == null) {
        throw Exception('Student ID not available');
      }
      
      // Convert image to base64
      final imageBytes = await File(image.path).readAsBytes();
      final base64Image = base64Encode(imageBytes);
      
      // Send to backend
      if (_faceService == null) {
        throw Exception('Face service not initialized');
      }
      
      final result = await _faceService!.registerFace(_studentId!, base64Image);
      
      if (result['success'] == true) {
        // Registration successful
        if (mounted) {
          Navigator.pop(context);
          toastification.show(
            context: context,
            type: ToastificationType.success,
            style: ToastificationStyle.fillColored,
            autoCloseDuration: const Duration(seconds: 3),
            title: const Text('Berhasil'),
            description: const Text('Wajah berhasil didaftarkan'),
            showProgressBar: true,
            primaryColor: AppColors.success,
            closeOnClick: true,
            dragToClose: true,
          );
        }
      } else {
        // Registration failed
        throw Exception(result['message'] ?? 'Gagal mendaftarkan wajah');
      }
    } catch (e) {
      debugPrint('Error during face registration: $e');
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          autoCloseDuration: const Duration(seconds: 3),
          title: const Text('Gagal'),
          description: Text('Pendaftaran wajah gagal: $e'),
          showProgressBar: true,
          primaryColor: AppColors.error,
          closeOnClick: true,
          dragToClose: true,
        );
      }
    } finally {
      // Clean up
      if (_capturedImage != null) {
        try {
          await File(_capturedImage!.path).delete();
        } catch (e) {
          debugPrint('Error deleting temporary image: $e');
        }
      }
      
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _isRegistering = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _registrationTimer?.cancel();
    _faceDetectionTimer?.cancel();
    _cameraController?.dispose();
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
          'Pendaftaran Wajah',
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
                      painter: FaceOverlayPainter(
                        isRegistering: _isRegistering,
                        countdownSeconds: _countdownSeconds,
                      ),
                    ),
                  ),

                // Processing overlay
                if (_isProcessing)
                  Positioned.fill(
                    child: Container(
                      color: Colors.black.withOpacity(0.7),
                      child: const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(
                              color: AppColors.primary,
                            ),
                            SizedBox(height: 20),
                            Text(
                              'Mendaftarkan wajah...',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                // Countdown text overlay
                if (_isFaceDetected && _isRegistering && !_isProcessing)
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
                          Stack(
                            alignment: Alignment.center,
                            children: [
                              SizedBox(
                                width: 100,
                                height: 100,
                                child: CircularProgressIndicator(
                                  value: (5 - _countdownSeconds) / 5,
                                  strokeWidth: 8,
                                  backgroundColor:
                                      Colors.white.withOpacity(0.2),
                                  color: AppColors.primary,
                                ),
                              ),
                              Text(
                                '$_countdownSeconds',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 60,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 15),
                          const Text(
                            'Tetap diam...',
                            style: TextStyle(
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
                              ? 'Wajah terdeteksi! Tetap diam...'
                              : 'Posisikan wajah Anda di dalam bingkai',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _isRegistering
                              ? 'Pendaftaran akan selesai dalam $_countdownSeconds detik'
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
  final bool isRegistering;
  final int countdownSeconds;

  FaceOverlayPainter({
    required this.isRegistering,
    required this.countdownSeconds,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width * 0.4;

    // Draw face oval guide
    final ovalPaint = Paint()
      ..color = isRegistering ? AppColors.primary : Colors.white
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

    // Add a subtle glow effect when registering
    if (isRegistering) {
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
  }

  @override
  bool shouldRepaint(covariant FaceOverlayPainter oldDelegate) {
    return oldDelegate.isRegistering != isRegistering ||
        oldDelegate.countdownSeconds != countdownSeconds;
  }
}
