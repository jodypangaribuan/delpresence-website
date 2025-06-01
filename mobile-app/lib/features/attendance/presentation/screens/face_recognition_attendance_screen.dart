import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'package:toastification/toastification.dart';
import '../../../../core/constants/colors.dart';
import '../../../face/presentation/providers/face_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class FaceRecognitionAttendanceScreen extends StatefulWidget {
  final String courseName;
  final int scheduleId;
  final int? studentId;

  const FaceRecognitionAttendanceScreen({
    super.key,
    required this.courseName,
    required this.scheduleId,
    this.studentId,
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
  Timer? _faceDetectionTimer;
  XFile? _capturedImage;
  late int _studentId;

  @override
  void initState() {
    super.initState();
    _studentId = widget.studentId ?? 
      Provider.of<AuthProvider>(context, listen: false).userId ?? 0;
    _requestCameraPermission();
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

      // Auto-capture after a short delay to give user time to position face
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted && _isCameraInitialized) {
          _captureImage();
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

  Future<void> _captureImage() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized || _isProcessing) {
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    try {
      // Capture the image
      final XFile image = await _cameraController!.takePicture();
      
      setState(() {
        _capturedImage = image;
        _isFaceDetected = true;
      });
      
      // Process the image for face verification
      _verifyFace(image);
    } catch (e) {
      print('Error capturing image: $e');
      setState(() {
        _isProcessing = false;
      });
      
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          title: const Text('Error'),
          description: Text('Gagal mengambil gambar: $e'),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    }
  }

  Future<void> _verifyFace(XFile imageFile) async {
    try {
      final faceProvider = Provider.of<FaceProvider>(context, listen: false);
      final bool success = await faceProvider.verifyFace(_studentId, imageFile);
      
      if (!mounted) return;
      
      if (success) {
        _markAttendance();
      } else {
        setState(() {
          _isProcessing = false;
          _isFaceDetected = false;
          _capturedImage = null;
        });
        
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          title: const Text('Verifikasi Gagal'),
          description: Text(faceProvider.errorMessage),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _isFaceDetected = false;
        _capturedImage = null;
      });
      
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          title: const Text('Error'),
          description: Text('Terjadi kesalahan saat verifikasi: $e'),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    }
  }

  void _markAttendance() {
    // Navigate back to previous screen with a slight delay to ensure UI updates
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        Navigator.pop(context, true); // Return true to indicate successful attendance

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

  void _retryCapture() {
    setState(() {
      _isProcessing = false;
      _isFaceDetected = false;
      _capturedImage = null;
    });
    
    // Auto-capture after a short delay
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && _isCameraInitialized) {
        _captureImage();
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
                if (_isCameraInitialized && _capturedImage == null)
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
                else if (_capturedImage != null)
                  // Show captured image
                  Container(
                    width: double.infinity,
                    height: double.infinity,
                    color: Colors.black,
                    child: Image.network(
                      _capturedImage!.path,
                      fit: BoxFit.contain,
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
                if (!_isProcessing)
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
                            _capturedImage != null
                                ? 'Memverifikasi wajah Anda...'
                                : 'Pastikan pencahayaan cukup dan wajah terlihat jelas',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          if (_capturedImage == null)
                            Padding(
                              padding: const EdgeInsets.only(top: 16.0),
                              child: Center(
                                child: ElevatedButton.icon(
                                  onPressed: _isProcessing ? null : _captureImage,
                                  icon: const Icon(Icons.camera_alt),
                                  label: const Text('Ambil Foto'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                  ),
                                ),
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
