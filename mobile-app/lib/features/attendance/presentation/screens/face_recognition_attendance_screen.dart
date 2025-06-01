import 'dart:async';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:toastification/toastification.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/services/face_recognition_service.dart';
import '../../../../core/services/user_service.dart';

class FaceRecognitionAttendanceScreen extends StatefulWidget {
  final String courseName;
  final int attendanceId;

  const FaceRecognitionAttendanceScreen({
    super.key,
    required this.courseName,
    required this.attendanceId,
  });

  @override
  State<FaceRecognitionAttendanceScreen> createState() =>
      _FaceRecognitionAttendanceScreenState();
}

class _FaceRecognitionAttendanceScreenState
    extends State<FaceRecognitionAttendanceScreen> {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isFaceDetected = false;
  bool _isProcessing = false;
  bool _isCapturing = false;
  Timer? _faceDetectionTimer;
  final FaceRecognitionService _faceService = FaceRecognitionService();
  final UserService _userService = UserService();
  int? _studentId;

  @override
  void initState() {
    super.initState();
    _getCurrentUser();
    _requestCameraPermission();
  }

  Future<void> _getCurrentUser() async {
    final user = await _userService.getCurrentUser();
    if (user != null && user['student_id'] != null) {
      setState(() {
        _studentId = user['student_id'];
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
      final cameras = await availableCameras();

      if (!mounted) return;

      if (cameras.isEmpty) {
        print('No cameras available');
        return;
      }

      // Use front camera for face recognition
      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      print('Using camera: ${frontCamera.name}, ${frontCamera.lensDirection}');

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();

      if (!mounted) return;

      setState(() {
        _isCameraInitialized = true;
      });

      // Start face detection with a 2-second delay to let the camera stabilize
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          _startRealFaceDetection();
        }
      });
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

  void _startRealFaceDetection() {
    if (_isCapturing || !mounted) return;
    
    setState(() {
      _isCapturing = true;
    });
    
    _captureImageAndVerify();
  }
  
  Future<void> _captureImageAndVerify() async {
    if (!_isCameraInitialized || _cameraController == null || !mounted) return;
    
    try {
      // Capture the image
      final XFile imageFile = await _cameraController!.takePicture();
      
      // Check if we have a student ID
      if (_studentId == null) {
        if (mounted) {
          toastification.show(
            context: context,
            type: ToastificationType.error,
            style: ToastificationStyle.fillColored,
            title: const Text('Error'),
            description: const Text('Profil mahasiswa tidak ditemukan'),
            autoCloseDuration: const Duration(seconds: 3),
          );
          Navigator.pop(context);
        }
        return;
      }
      
      setState(() {
        _isFaceDetected = true;
        _isProcessing = true;
      });
      
      // Convert the image to bytes
      final File file = File(imageFile.path);
      final imageBytes = await file.readAsBytes();
      
      // Send the image for face verification
      final result = await _faceService.verifyFace(imageBytes);
      
      if (result['success'] && result['match']) {
        // Face verification succeeded and matched
        _markAttendanceSuccess(result['student_id']);
      } else if (result['success'] && !result['match']) {
        // Face verification succeeded but no match found
        if (mounted) {
          setState(() {
            _isProcessing = false;
            _isFaceDetected = false;
            _isCapturing = false;
          });
          
          toastification.show(
            context: context,
            type: ToastificationType.warning,
            style: ToastificationStyle.fillColored,
            title: const Text('Tidak Dikenali'),
            description: const Text('Wajah tidak dikenali. Pastikan Anda telah mendaftarkan wajah atau coba lagi dengan pencahayaan yang lebih baik.'),
            autoCloseDuration: const Duration(seconds: 3),
          );
          
          // Try again after a short delay
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              _startRealFaceDetection();
            }
          });
        }
      } else {
        // Error in face verification
        if (mounted) {
          setState(() {
            _isProcessing = false;
            _isFaceDetected = false;
            _isCapturing = false;
          });
          
          toastification.show(
            context: context,
            type: ToastificationType.error,
            style: ToastificationStyle.fillColored,
            title: const Text('Gagal'),
            description: Text('Verifikasi wajah gagal: ${result['message']}'),
            autoCloseDuration: const Duration(seconds: 3),
          );
          
          // Try again after a short delay
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              _startRealFaceDetection();
            }
          });
        }
      }
    } catch (e) {
      print('Error capturing image: $e');
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _isFaceDetected = false;
          _isCapturing = false;
        });
        
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          title: const Text('Error'),
          description: Text('Gagal mengambil gambar: $e'),
          autoCloseDuration: const Duration(seconds: 3),
        );
        
        // Try again after a short delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            _startRealFaceDetection();
          }
        });
      }
    }
  }

  void _markAttendanceSuccess(int studentId) {
    // Here you would call your attendance API to mark attendance
    // For now, we're just simulating a successful attendance
    
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
                
                // Face overlay
                if (_isCameraInitialized)
                  Center(
                    child: Container(
                      width: 220,
                      height: 220,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _isFaceDetected
                              ? Colors.green
                              : Colors.white.withOpacity(0.5),
                          width: 2.0,
                        ),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                
                // Processing indicator
                if (_isProcessing)
                  Container(
                    color: Colors.black.withOpacity(0.5),
                    width: double.infinity,
                    height: double.infinity,
                    child: const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(
                            color: Colors.white,
                          ),
                          SizedBox(height: 20),
                          Text(
                            'Memverifikasi...',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // Instructions
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            color: Colors.black,
            child: Column(
              children: [
                const Text(
                  'Posisikan wajah Anda di dalam lingkaran',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Pastikan pencahayaan cukup dan wajah terlihat jelas',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 24),
                
                // Manual capture button
                if (_isCameraInitialized && !_isProcessing && !_isCapturing)
                  ElevatedButton(
                    onPressed: _startRealFaceDetection,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text(
                      'Ambil Foto',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
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
