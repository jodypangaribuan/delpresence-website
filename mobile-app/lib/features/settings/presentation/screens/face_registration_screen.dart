import 'dart:convert';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import 'package:toastification/toastification.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/user_service.dart';

class FaceRegistrationScreen extends StatefulWidget {
  final String returnButtonText;
  
  const FaceRegistrationScreen({
    Key? key, 
    this.returnButtonText = 'Kembali ke Pengaturan',
  }) : super(key: key);

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
  final UserService _userService = UserService();
  int? _studentId;
  XFile? _capturedImage;
  List<Map<String, dynamic>> _registeredFaces = [];
  bool _isLoadingFaces = false;
  
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
    final userData = await _userService.getCurrentUser();
    if (userData != null && userData.containsKey('studentId')) {
      setState(() {
        _studentId = userData['studentId'];
      });
      _loadRegisteredFaces();
    }
  }

  Future<void> _loadRegisteredFaces() async {
    if (_studentId == null) return;
    
    setState(() {
      _isLoadingFaces = true;
    });
    
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/api/faces/student/$_studentId'),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] && data.containsKey('faces')) {
          setState(() {
            _registeredFaces = List<Map<String, dynamic>>.from(data['faces']);
          });
        }
      }
    } catch (e) {
      print('Error loading faces: $e');
    } finally {
      setState(() {
        _isLoadingFaces = false;
      });
    }
  }

  Future<void> _requestCameraPermission() async {
    final status = await Permission.camera.request();
    if (status.isGranted) {
      _initializeCamera();
    } else {
      if (mounted) {
        toastification.show(
          context: context,
          type: ToastificationType.error,
          style: ToastificationStyle.fillColored,
          title: const Text('Izin Kamera Ditolak'),
          description: const Text('Aplikasi memerlukan akses kamera untuk pendaftaran wajah'),
          autoCloseDuration: const Duration(seconds: 3),
        );
      }
    }
  }

  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;
    
    // Use front camera if available
    final frontCamera = cameras.firstWhere(
      (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );
    
    _cameraController = CameraController(
      frontCamera,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );
    
    try {
      await _cameraController!.initialize();
      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
        });
      }
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }

  Future<void> _takePicture() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized || _isTakingPicture) {
      return;
    }
    
    setState(() {
      _isTakingPicture = true;
    });
    
    try {
      final image = await _cameraController!.takePicture();
      setState(() {
        _capturedImage = image;
        _isTakingPicture = false;
      });
    } catch (e) {
      setState(() {
        _isTakingPicture = false;
      });
      print('Error taking picture: $e');
    }
  }

  Future<void> _registerFace() async {
    if (_capturedImage == null || _studentId == null) return;
    
    setState(() {
      _isProcessing = true;
    });
    
    try {
      // Convert the image to base64
      final File file = File(_capturedImage!.path);
      final List<int> imageBytes = await file.readAsBytes();
      final String base64Image = base64Encode(imageBytes);
      
      // Send the image for face registration
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/api/faces/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'student_id': _studentId,
          'image': base64Image,
        }),
      );
      
      final result = jsonDecode(response.body);
      
      if (response.statusCode == 201 && result['success']) {
        // Face registration succeeded
        setState(() {
          _isFaceRegistered = true;
          _isProcessing = false;
        });
        
        // Reload registered faces
        _loadRegisteredFaces();
        
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
            description: Text('Pendaftaran wajah gagal: ${result['error'] ?? 'Terjadi kesalahan'}'),
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

  Future<void> _deleteFace(int faceId) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiConstants.baseUrl}/api/faces/$faceId'),
      );
      
      if (response.statusCode == 200) {
        _loadRegisteredFaces();
        if (mounted) {
          toastification.show(
            context: context,
            type: ToastificationType.success,
            style: ToastificationStyle.fillColored,
            title: const Text('Berhasil'),
            description: const Text('Data wajah berhasil dihapus'),
            autoCloseDuration: const Duration(seconds: 3),
          );
        }
      } else {
        if (mounted) {
          toastification.show(
            context: context,
            type: ToastificationType.error,
            style: ToastificationStyle.fillColored,
            title: const Text('Gagal'),
            description: const Text('Gagal menghapus data wajah'),
            autoCloseDuration: const Duration(seconds: 3),
          );
        }
      }
    } catch (e) {
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
      _hasGoodLighting = true;
      _faceAligned = false;
      _isCountingDown = false;
    });
  }

  void _toggleFaceDetection() {
    setState(() {
      _isFaceDetected = !_isFaceDetected;
    });
  }

  void _startCountdown() {
    setState(() {
      _isCountingDown = true;
      _countdownSeconds = 3;
    });
    
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _countdownSeconds--;
      });
      if (_countdownSeconds <= 0) {
        _takePicture();
        return false;
      }
      return _isCountingDown;
    });
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
                            scaleX: -1.0, // Simple horizontal mirroring
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
                            // Pulse animation for the face outline
                            if (!_isFaceDetected)
                              Transform.scale(
                                scale: _pulseAnimation.value,
                                child: Container(
                                  width: 210,
                                  height: 210,
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: Colors.white.withOpacity(0.3),
                                      width: 1.0,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                            
                            // Success icon when face is detected
                            if (_isFaceDetected)
                              Icon(
                                Icons.check_circle,
                                color: Colors.green,
                                size: 40,
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              
              // Status indicators
              if (_isCameraInitialized)
                Positioned(
                  top: 20,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _isFaceDetected ? Icons.check_circle : Icons.face,
                              color: _isFaceDetected ? Colors.green : Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _isFaceDetected ? 'Wajah Terdeteksi' : 'Posisikan Wajah',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              
              // Countdown overlay
              if (_isCountingDown)
                Container(
                  color: Colors.black.withOpacity(0.6),
                  width: double.infinity,
                  height: double.infinity,
                  child: Center(
                    child: Text(
                      '$_countdownSeconds',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 80,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              
              // Processing indicator
              if (_isTakingPicture)
                Container(
                  color: Colors.black.withOpacity(0.5),
                  width: double.infinity,
                  height: double.infinity,
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
        ),
        
        // Bottom controls
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          color: Colors.black,
          child: Column(
            children: [
              // Instructions
              Text(
                _isFaceDetected
                    ? 'Wajah terdeteksi! Siap untuk mengambil foto'
                    : 'Posisikan wajah Anda di dalam lingkaran',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 20),
              
              // Control buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Face detection toggle button (for demo/testing purposes)
                  IconButton(
                    onPressed: _toggleFaceDetection,
                    icon: Icon(
                      _isFaceDetected ? Icons.face : Icons.face_retouching_off,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  
                  // Capture button
                  GestureDetector(
                    onTap: _isFaceDetected ? _startCountdown : null,
                    child: Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _isFaceDetected ? Colors.white : Colors.white.withOpacity(0.5),
                          width: 3,
                        ),
                        color: _isFaceDetected ? Colors.white.withOpacity(0.3) : Colors.transparent,
                      ),
                      child: Center(
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _isFaceDetected ? Colors.white : Colors.white.withOpacity(0.5),
                          ),
                        ),
                      ),
                    ),
                  ),
                  
                  // Spacer to balance layout
                  const SizedBox(width: 28),
                ],
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
              // Display captured image (without mirroring - show the actual image)
              SizedBox(
                width: MediaQuery.of(context).size.width,
                height: MediaQuery.of(context).size.height,
                child: Image.file(
                  File(_capturedImage!.path),
                  fit: BoxFit.cover,
                ),
              ),
              
              // Overlay with face indicator
              Center(
                child: Container(
                  width: 180,
                  height: 220,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: Colors.green.withOpacity(0.6),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(100),
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
        Container(
          padding: const EdgeInsets.all(24),
          color: Colors.black,
          child: Column(
            children: [
              const Text(
                'Apakah foto wajah Anda sudah jelas?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 16),
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
      color: Colors.white,
      width: double.infinity,
      height: double.infinity,
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  
                  // Success icon
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: const BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 50,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Success message
                  const Text(
                    'Pendaftaran Wajah Berhasil!',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      'Wajah Anda telah terdaftar dan dapat digunakan untuk absensi',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  // Registered faces section
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Wajah Terdaftar',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Registered faces list
                        if (_isLoadingFaces)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(20.0),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else if (_registeredFaces.isEmpty)
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Text(
                                'Tidak ada wajah terdaftar',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ),
                          )
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _registeredFaces.length,
                            itemBuilder: (context, index) {
                              final face = _registeredFaces[index];
                              final faceId = face['id'];
                              final createdAt = face['created_at'] != null
                                  ? DateTime.parse(face['created_at'])
                                  : null;
                              
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey[200]!),
                                ),
                                child: ListTile(
                                  leading: Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withOpacity(0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Center(
                                      child: Icon(
                                        Icons.face,
                                        color: AppColors.primary,
                                        size: 24,
                                      ),
                                    ),
                                  ),
                                  title: Text(
                                    'Wajah ${index + 1}',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  subtitle: createdAt != null
                                      ? Text(
                                          'Terdaftar pada ${createdAt.day}/${createdAt.month}/${createdAt.year}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey,
                                          ),
                                        )
                                      : null,
                                  trailing: IconButton(
                                    icon: Icon(
                                      Icons.delete_outline,
                                      color: Colors.red[400],
                                      size: 20,
                                    ),
                                    onPressed: () => _showDeleteConfirmationDialog(context, faceId),
                                  ),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Return button
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            color: Colors.white,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                widget.returnButtonText,
                style: const TextStyle(
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
  
  void _showDeleteConfirmationDialog(BuildContext context, int faceId) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              Icon(
                Icons.warning_amber_rounded,
                color: Colors.orange,
                size: 24,
              ),
              const SizedBox(width: 8),
              const Text('Konfirmasi Hapus'),
            ],
          ),
          content: const Text(
            'Apakah Anda yakin ingin menghapus data wajah ini?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'Batal',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteFace(faceId);
              },
              child: Text(
                'Hapus',
                style: TextStyle(
                  color: Colors.red[600],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        );
      },
    );
  }
} 