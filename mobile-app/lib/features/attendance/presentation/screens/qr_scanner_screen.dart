import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../repositories/attendance_repository.dart'; // Import the repository
// TODO: Import a BLoC/Provider if you use state management for this

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  static const String routeName = '/qr-scanner'; // Or define appropriately

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  bool _isProcessing = false;
  final AttendanceRepository _attendanceRepository = AttendanceRepositoryImpl(); // Instantiate the repository

  @override
  void initState() {
    super.initState();
    // You might want to request camera permission here if not handled globally
  }

  void _handleQrCode(BarcodeCapture capture) async { // Make async
    if (_isProcessing) return;
    setState(() {
      _isProcessing = true;
    });

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? rawValue = barcodes.first.rawValue;
      if (rawValue != null) {
        print('Scanned QR Code: \$rawValue');
        if (rawValue.startsWith('delpresence:attendance:')) {
          final sessionId = rawValue.split(':').last;
          if (sessionId.isNotEmpty) {
            // TODO: Get student token securely
            const String DUMMY_STUDENT_TOKEN = "dummy_student_auth_token"; 
            
            bool success = await _attendanceRepository.submitQrAttendance(sessionId, DUMMY_STUDENT_TOKEN);
            
            if (mounted) {
              Navigator.of(context).pop(); // Pop scanner screen
              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Attendance submitted successfully!'), backgroundColor: Colors.green),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Failed to submit attendance. Please try again.'), backgroundColor: Colors.red),
                );
              }
            }
          } else {
            _showErrorSnackBar('Invalid QR code format (empty session ID).');
          }
        } else {
          _showErrorSnackBar('Not a DelPresence attendance QR code.');
        }
      } else {
        _showErrorSnackBar('QR code data is empty.');
      }
    } else {
      _showErrorSnackBar('No QR code found in capture.');
    }
    
    // Only reset if not successful, to avoid dismissing success message too quickly
    // If successful, screen is popped anyway.
    if (mounted && _isProcessing) { // Check _isProcessing as it might have been set to false by _showErrorSnackBar
       Future.delayed(const Duration(seconds: 1), () { // Shorter delay as processing is done
        if (mounted) {
          setState(() {
            _isProcessing = false;
          });
        }
      });
    }
  }

  void _showErrorSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
      // Reset processing flag on error to allow retrying
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Attendance QR')),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: _handleQrCode,
          ),
          // Simple overlay example
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.green, width: 4),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          if (_isProcessing)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Processing...', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
} 