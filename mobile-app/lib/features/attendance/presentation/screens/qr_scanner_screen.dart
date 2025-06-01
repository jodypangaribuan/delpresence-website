import 'dart:io'; // Needed for Platform.isAndroid || Platform.isIOS
import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import '../../../../core/constants/colors.dart';
import '../../../schedule/data/models/schedule_model.dart';
import '../../../../core/utils/toast_utils.dart';
// import '../../data/services/attendance_service.dart'; // Keep for future API calls

class QrScannerScreen extends StatefulWidget {
  final ScheduleModel schedule;

  const QrScannerScreen({super.key, required this.schedule});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool _isProcessing = false;
  Barcode? result;
  // late AttendanceService _attendanceService; // Initialize in initState

  @override
  void initState() {
    super.initState();
    // Initialize AttendanceService here if you have one
    // final networkService = NetworkService(...);
    // _attendanceService = AttendanceService(networkService: networkService);
  }

  // In order to get hot reload to work we need to pause the camera if the platform
  // is android, or resume the camera if the platform is iOS.
  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      controller?.pauseCamera();
    }
    controller?.resumeCamera();
  }

  void _onQRViewCreated(QRViewController controller) {
    setState(() {
      this.controller = controller;
    });
    controller.scannedDataStream.listen((scanData) async {
      if (_isProcessing) return;
      setState(() {
        _isProcessing = true;
        result = scanData; // Store the Barcode object
      });

      if (result != null && result!.code != null) {
        final String qrData = result!.code!;
        debugPrint('QR Code Detected: $qrData');
        debugPrint('Attempting attendance for schedule ID: ${widget.schedule.id}, Course: ${widget.schedule.courseName}');

        // TODO: Implement API call to backend to validate QR and record attendance
        // try {
        //   final response = await _attendanceService.recordQrAttendance(
        //     scheduleId: widget.schedule.id,
        //     qrToken: qrData,
        //   );
        //   if (response.success) {
        //     ToastUtils.showSuccessToast(context, 'Absensi berhasil untuk ${widget.schedule.courseName}');
        //     if(mounted) Navigator.of(context).popUntil((route) => route.isFirst); // Go back to home
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
              // Pop scanner screen and then the bottom sheet from CourseSelectionScreen
              Navigator.pop(context); 
              Navigator.pop(context); 
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
    });
  }

  Widget _buildQrView(BuildContext context) {
    // For this example we check how width or tall the device is and change the scanArea and overlay accordingly.
    var scanArea = (MediaQuery.of(context).size.width < 400 ||
            MediaQuery.of(context).size.height < 400)
        ? 200.0
        : 300.0;
    // To ensure the Scanner view is properly sizes after rotation
    // we need to listen for Flutter SizeChanged notification and update controller
    return QRView(
      key: qrKey,
      onQRViewCreated: _onQRViewCreated,
      overlay: QrScannerOverlayShape(
        borderColor: AppColors.primary,
        borderRadius: 10,
        borderLength: 30,
        borderWidth: 10,
        cutOutSize: scanArea,
      ),
      onPermissionSet: (ctrl, p) => _onPermissionSet(context, ctrl, p),
    );
  }

  void _onPermissionSet(BuildContext context, QRViewController ctrl, bool p) {
    debugPrint('${DateTime.now().toIso8601String()}_onPermissionSet $p');
    if (!p) {
      ToastUtils.showErrorToast(context, 'Tidak ada izin kamera!');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Scan QR - ${widget.schedule.courseName}'),
        backgroundColor: AppColors.primary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: FutureBuilder(
              future: controller?.getFlashStatus(),
              builder: (context, snapshot) {
                bool isFlashOn = snapshot.data ?? false;
                return Icon(isFlashOn ? Icons.flash_on : Icons.flash_off, 
                                color: isFlashOn ? Colors.yellow : Colors.white);
              },
            ),
            onPressed: () async {
              await controller?.toggleFlash();
              setState(() {}); // Rebuild to update flash icon
            },
          ),
          IconButton(
            icon: FutureBuilder(
              future: controller?.getCameraInfo(),
              builder: (context, snapshot) {
                var cameraFacing = snapshot.data;
                return Icon(cameraFacing == CameraFacing.front ? Icons.camera_front : Icons.camera_rear, 
                                color: Colors.white);
              },
            ),
            onPressed: () async {
              await controller?.flipCamera();
              setState(() {}); // Rebuild to update camera icon
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          _buildQrView(context),
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
    controller?.dispose();
    super.dispose();
  }
} 