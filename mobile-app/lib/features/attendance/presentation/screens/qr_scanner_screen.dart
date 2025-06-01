import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../core/constants/colors.dart';
import '../../../schedule/data/models/schedule_model.dart';
import '../../../../core/utils/toast_utils.dart';
// You will need to create/define an attendance service for API calls
// import '../../data/services/attendance_service.dart'; 

class QrScannerScreen extends StatefulWidget {
  final ScheduleModel schedule;

  const QrScannerScreen({super.key, required this.schedule});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  MobileScannerController cameraController = MobileScannerController();
  bool _isProcessing = false;
  // late AttendanceService _attendanceService; // Initialize in initState

  @override
  void initState() {
    super.initState();
    // Initialize AttendanceService here if you have one
    // final networkService = NetworkService(...);
    // _attendanceService = AttendanceService(networkService: networkService);
  }

  Future<void> _handleQrCode(BarcodeCapture capture) async {
    if (_isProcessing) return;
    setState(() {
      _isProcessing = true;
    });

    final List<Barcode> barcodes = capture.barcodes;
    // final Uint8List? image = capture.image; // If you need the image frame

    if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
      final String qrData = barcodes.first.rawValue!;
      debugPrint('QR Code Detected: $qrData');
      debugPrint('Attempting attendance for schedule ID: ${widget.schedule.id}, Course: ${widget.schedule.courseName}');

      // TODO: Implement API call to backend to validate QR and record attendance
      // For example:
      // try {
      //   final response = await _attendanceService.recordQrAttendance(
      //     scheduleId: widget.schedule.id,
      //     qrToken: qrData, // Assuming qrData is the token from the lecturer's QR
      //   );
      //   if (response.success) { // Assuming your service returns a success flag
      //     ToastUtils.showSuccessToast(context, 'Absensi berhasil untuk ${widget.schedule.courseName}');
      //     Navigator.pop(context); // Go back to CourseSelectionScreen
      //     Navigator.pop(context); // Go back to HomeScreen (or wherever appropriate)
      //   } else {
      //     ToastUtils.showErrorToast(context, response.message ?? 'Gagal melakukan absensi via QR');
      //   }
      // } catch (e) {
      //   ToastUtils.showErrorToast(context, 'Error: ${e.toString()}');
      // }

      // ---- DEMO: Remove this section when backend is integrated ----
      await Future.delayed(const Duration(seconds: 1)); // Simulate network delay
      if (qrData == "VALID_QR_FOR_${widget.schedule.id}") { // Replace with actual validation
          ToastUtils.showSuccessToast(context, 'Absensi (DEMO) berhasil untuk ${widget.schedule.courseName}');
          if (mounted) {
            Navigator.pop(context); // Pop scanner screen
            Navigator.pop(context); // Pop CourseSelectionScreen's bottom sheet
          }
      } else {
          ToastUtils.showErrorToast(context, 'QR Code tidak valid untuk jadwal ini (DEMO).');
      }
      // ---- END DEMO ----

    } else {
      ToastUtils.showErrorToast(context, 'Gagal membaca data QR Code.');
    }

    // Add a small delay before allowing another scan to prevent rapid multiple submissions
    await Future.delayed(const Duration(seconds: 2));
    if(mounted){
        setState(() {
            _isProcessing = false;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Scan QR Code - ${widget.schedule.courseName}'),
        backgroundColor: AppColors.primary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            color: Colors.white,
            icon: ValueListenableBuilder<MobileScannerState>(
              valueListenable: cameraController,
              builder: (context, scannerState, child) {
                switch (scannerState.torchState) {
                  case TorchState.off:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: Colors.yellow);
                  case TorchState.auto:
                    return const Icon(Icons.flash_auto, color: Colors.yellow);
                  case TorchState.unavailable:
                     return const Icon(Icons.no_flash, color: Colors.grey);
                }
              },
            ),
            iconSize: 32.0,
            onPressed: () => cameraController.toggleTorch(),
          ),
          IconButton(
            color: Colors.white,
            icon: ValueListenableBuilder<MobileScannerState>(
              valueListenable: cameraController,
              builder: (context, scannerState, child) {
                switch (scannerState.cameraFacingState) {
                  case CameraFacing.front:
                    return const Icon(Icons.camera_front, color: Colors.grey);
                  case CameraFacing.back:
                    return const Icon(Icons.camera_rear, color: Colors.yellow);
                }
              },
            ),
            iconSize: 32.0,
            onPressed: () => cameraController.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: cameraController,
            onDetect: _handleQrCode,
            // You can use the scanWindow property to define a specific area for scanning
            // scanWindow: Rect.fromCenter(
            //   center: MediaQuery.of(context).size.center(Offset.zero),
            //   width: 250,
            //   height: 250,
            // ),
          ),
          // Overlay UI (e.g., a square viewfinder)
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppColors.primary.withOpacity(0.7),
                  width: 4,
                ),
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
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text('Memproses QR Code...', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ],
                )
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }
} 