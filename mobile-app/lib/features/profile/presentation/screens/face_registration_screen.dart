import 'dart:io';
import 'dart:math' as math;
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:toastification/toastification.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/services/face_recognition_service.dart';
import '../../../../core/services/user_service.dart';

class FaceRegistrationScreen extends StatefulWidget {
  const FaceRegistrationScreen({Key? key}) : super(key: key);

  @override
  State<FaceRegistrationScreen> createState() => _FaceRegistrationScreenState();
}

class _FaceRegistrationScreenState extends State<FaceRegistrationScreen> with TickerProviderStateMixin {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isProcessing = false;
  bool _isFaceRegistered = false;
  bool _isFaceDetected = false;
  bool _isTakingPicture = false;
  final FaceRecognitionService _faceService = FaceRecognitionService();
  final UserService _userService = UserService();
  int? _studentId;
  XFile? _capturedImage;
  
  // Animation controllers
  late AnimationController _pulseAnimationController;
  late Animation<double> _pulseAnimation;
  
  // Face quality checks
  bool _hasGoodLighting = false;
  bool _faceAligned = false;
  int _countdownSeconds = 3;
  bool _isCountingDown = false;

  @override
  void initState() {
    super.initState();
    _getCurrentUser();
    _requestCameraPermission();
    
    // Setup animations
    _pulseAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseAnimationController, curve: Curves.easeInOut),
    );
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
          description: const Text('Izin kamera diperlukan untuk mendaftarkan wajah'),
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
            'Izin kamera diperlukan untuk mendaftarkan wajah. '
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

      // Use front camera
      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      print('Using camera: ${frontCamera.name}, ${frontCamera.lensDirection}');

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.high, // Use higher resolution for better face detection
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();
      
      // Set auto focus mode for better face detection
      if (_cameraController!.value.isInitialized) {
        try {
          await _cameraController!.setFocusMode(FocusMode.auto);
          await _cameraController!.setExposureMode(ExposureMode.auto);
        } catch (e) {
          // Some devices may not support these features
          print('Could not set focus/exposure mode: $e');
        }
      }

      if (!mounted) return;

      setState(() {
        _isCameraInitialized = true;
      });
      
      // Start face quality check simulation
      _startFaceQualityChecks();
      
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

  void _startFaceQualityChecks() {
    // In a real implementation, you would use ML models to check face quality
    // Here we're simulating the checks with a timer
    
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _hasGoodLighting = true;
        });
        
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            setState(() {
              _faceAligned = true;
              _isFaceDetected = true;
            });
            
            // Start countdown for auto-capture
            _startCountdown();
          }
        });
      }
    });
  }
  
  void _startCountdown() {
    setState(() {
      _isCountingDown = true;
      _countdownSeconds = 3;
    });
    
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && _isCountingDown) {
        setState(() {
          _countdownSeconds--;
        });
        
        if (_countdownSeconds > 0) {
          _startCountdown();
        } else {
          // Auto capture
          _captureImage();
        }
      }
    });
  }

  Future<void> _captureImage() async {
    if (!_isCameraInitialized || _cameraController == null || !mounted || _isTakingPicture) return;
    
    try {
      setState(() {
        _isTakingPicture = true;
        _isCountingDown = false;
      });
      
      // Capture the image
      final XFile imageFile = await _cameraController!.takePicture();
      
      setState(() {
        _capturedImage = imageFile;
        _isTakingPicture = false;
      });
    } catch (e) {
      setState(() {
        _isTakingPicture = false;
      });
      
      print('Error capturing image: $e');
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

  Future<void> _registerFace() async {
    if (_capturedImage == null || _studentId == null) return;
    
    setState(() {
      _isProcessing = true;
    });
    
    try {
      // Convert the image to bytes
      final File file = File(_capturedImage!.path);
      final imageBytes = await file.readAsBytes();
      
      // Send the image for face registration
      final result = await _faceService.registerFace(_studentId!, imageBytes);
      
      if (result['success']) {
        // Face registration succeeded
        setState(() {
          _isFaceRegistered = true;
          _isProcessing = false;
        });
        
        if (mounted) {
          toastification.show(
            context: context,
            type: ToastificationType.success,
            style: ToastificationStyle.fillColored,
            title: const Text('Berhasil'),
            description: const Text('Wajah berhasil didaftarkan'),
            autoCloseDuration: const Duration(seconds: 3),
          );
        }
      } else {
        // Face registration failed
        setState(() {
          _isProcessing = false;
        });
        
        if (mounted) {
          toastification.show(
            context: context,
            type: ToastificationType.error,
            style: ToastificationStyle.fillColored,
            title: const Text('Gagal'),
            description: Text('Pendaftaran wajah gagal: ${result['message']}'),
            autoCloseDuration: const Duration(seconds: 3),
          );
        }
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });
      
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          title: const Text('Error'),
          description: Text('Terjadi kesalahan: $e'),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    }
  }

  void _retakePhoto() {
    setState(() {
      _capturedImage = null;
      _isFaceDetected = false;
      _hasGoodLighting = false;
      _faceAligned = false;
      _isCountingDown = false;
    });
    
    // Restart face quality checks
    _startFaceQualityChecks();
  }

  @override
  void dispose() {
    _pulseAnimationController.dispose();
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
          'Daftarkan Wajah',
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
      body: _isFaceRegistered
          ? _buildSuccessView()
          : _capturedImage != null
              ? _buildReviewScreen()
              : _buildCameraScreen(),
    );
  }

  Widget _buildCameraScreen() {
    return Column(
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
                            scaleX: -1.0, // Mirror the camera horizontally for selfie view
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
              
              // Face overlay with animated guidance
              if (_isCameraInitialized)
                Center(
                  child: AnimatedBuilder(
                    animation: _pulseAnimationController,
                    builder: (context, child) {
                      return Container(
                        width: 220,
                        height: 220,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _isFaceDetected
                                ? Colors.green
                                : Colors.white.withOpacity(0.7),
                            width: 2.0,
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Pulsing circle
                            if (!_isFaceDetected)
                              Transform.scale(
                                scale: _pulseAnimation.value,
                                child: Container(
                                  width: 210,
                                  height: 210,
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: Colors.white.withOpacity(0.2),
                                      width: 1.5,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                              
                            // Face outline when detected
                            if (_isFaceDetected)
                              CustomPaint(
                                size: const Size(180, 220),
                                painter: FaceOutlinePainter(
                                  color: Colors.green.withOpacity(0.7),
                                ),
                              ),
                              
                            // Countdown text
                            if (_isCountingDown)
                              Container(
                                width: 60,
                                height: 60,
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.5),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '$_countdownSeconds',
                                    style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              
              // Face quality indicators
              if (_isCameraInitialized)
                Positioned(
                  top: 20,
                  left: 0,
                  right: 0,
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 40),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        _buildQualityIndicator(
                          'Pencahayaan',
                          _hasGoodLighting,
                        ),
                        const SizedBox(height: 8),
                        _buildQualityIndicator(
                          'Posisi Wajah',
                          _faceAligned,
                        ),
                      ],
                    ),
                  ),
                ),
              
              // Processing indicator
              if (_isProcessing || _isTakingPicture)
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
                          'Memproses...',
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
              Text(
                _isFaceDetected
                    ? 'Wajah terdeteksi, jangan bergerak'
                    : 'Posisikan wajah Anda di dalam lingkaran',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: _isFaceDetected ? Colors.green : Colors.white,
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
              
              // Capture button
              if (_isCameraInitialized && !_isProcessing && !_isTakingPicture && !_isCountingDown)
                ElevatedButton(
                  onPressed: _captureImage,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isFaceDetected ? Colors.green : Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    'Ambil Foto',
                    style: TextStyle(
                      color: _isFaceDetected ? Colors.white : Colors.black,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              
              // Countdown indicator  
              if (_isCountingDown)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  width: double.infinity,
                  child: Text(
                    'Mengambil foto dalam $_countdownSeconds detik...',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQualityIndicator(String label, bool isChecked) {
    return Row(
      children: [
        Icon(
          isChecked ? Icons.check_circle : Icons.radio_button_unchecked,
          color: isChecked ? Colors.green : Colors.white70,
          size: 18,
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: isChecked ? Colors.green : Colors.white70,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildReviewScreen() {
    return Column(
      children: [
        Expanded(
          child: Stack(
            children: [
              // Display captured image (mirrored to match what user saw during capture)
              SizedBox(
                width: MediaQuery.of(context).size.width,
                height: MediaQuery.of(context).size.height,
                child: Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.rotationY(math.pi), // Mirror horizontally
                  child: Image.file(
                    File(_capturedImage!.path),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              
              // Overlay with face indicator
              Center(
                child: CustomPaint(
                  size: const Size(180, 220),
                  painter: FaceOutlinePainter(
                    color: Colors.green.withOpacity(0.6),
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
                          'Mendaftarkan wajah...',
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
        
        // Action buttons
        if (!_isProcessing)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            color: Colors.black,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Verifikasi Foto',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Pastikan foto wajah Anda terlihat jelas dan tidak blur',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    // Retake button
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _retakePhoto,
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.white),
                          minimumSize: const Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text(
                          'Ambil Ulang',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    
                    // Register button
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _registerFace,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          minimumSize: const Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text(
                          'Daftarkan',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildSuccessView() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.black,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle,
              color: Colors.green,
              size: 80,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Wajah Berhasil Didaftarkan',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Anda sekarang dapat menggunakan fitur\nFace Recognition untuk absensi',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 48),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                'Kembali ke Profil',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Custom painter for face outline
class FaceOutlinePainter extends CustomPainter {
  final Color color;
  
  FaceOutlinePainter({required this.color});
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    
    // Draw face oval
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width / 2, size.height / 2),
        width: size.width * 0.9,
        height: size.height * 0.9,
      ),
      paint,
    );
    
    // Draw eyes
    final eyeRadius = size.width * 0.12;
    final eyeY = size.height * 0.38;
    final leftEyeX = size.width * 0.3;
    final rightEyeX = size.width * 0.7;
    
    canvas.drawCircle(Offset(leftEyeX, eyeY), eyeRadius, paint);
    canvas.drawCircle(Offset(rightEyeX, eyeY), eyeRadius, paint);
    
    // Draw mouth
    final mouthWidth = size.width * 0.45;
    final mouthHeight = size.height * 0.08;
    final mouthY = size.height * 0.7;
    
    canvas.drawArc(
      Rect.fromCenter(
        center: Offset(size.width / 2, mouthY),
        width: mouthWidth,
        height: mouthHeight,
      ),
      0.2, // Start angle
      2.7, // Sweep angle
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }
} 