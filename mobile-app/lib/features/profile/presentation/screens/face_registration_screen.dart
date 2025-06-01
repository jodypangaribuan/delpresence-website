import 'dart:io';
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

class _FaceRegistrationScreenState extends State<FaceRegistrationScreen> {
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isProcessing = false;
  bool _isFaceRegistered = false;
  final FaceRecognitionService _faceService = FaceRecognitionService();
  final UserService _userService = UserService();
  int? _studentId;
  XFile? _capturedImage;

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
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();

      if (!mounted) return;

      setState(() {
        _isCameraInitialized = true;
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
    if (!_isCameraInitialized || _cameraController == null || !mounted) return;
    
    try {
      // Capture the image
      final XFile imageFile = await _cameraController!.takePicture();
      
      setState(() {
        _capturedImage = imageFile;
      });
    } catch (e) {
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
    });
  }

  @override
  void dispose() {
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
                        color: Colors.white.withOpacity(0.5),
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
              
              // Capture button
              if (_isCameraInitialized && !_isProcessing)
                ElevatedButton(
                  onPressed: _captureImage,
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
    );
  }

  Widget _buildReviewScreen() {
    return Column(
      children: [
        Expanded(
          child: Stack(
            children: [
              // Display captured image
              SizedBox(
                width: MediaQuery.of(context).size.width,
                height: MediaQuery.of(context).size.height,
                child: Image.file(
                  File(_capturedImage!.path),
                  fit: BoxFit.cover,
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
            child: Row(
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
                      backgroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text(
                      'Daftarkan',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
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
          const Icon(
            Icons.check_circle,
            color: Colors.green,
            size: 80,
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
                backgroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                'Kembali ke Profil',
                style: TextStyle(
                  color: Colors.black,
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