import 'dart:io';
import 'package:flutter/material.dart';
import 'package:qr_code_scanner_plus/qr_code_scanner_plus.dart';
import '../../../../core/constants/colors.dart';

class QRScannerPage extends StatefulWidget {
  const QRScannerPage({Key? key}) : super(key: key);

  @override
  State<QRScannerPage> createState() => _QRScannerPageState();
}

class _QRScannerPageState extends State<QRScannerPage> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  Barcode? result;
  QRViewController? controller;
  bool _isFlashOn = false;

  // In order to get hot reload to work we need to pause the camera if the platform
  // is android, or resume the camera if the platform is iOS.
  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      controller?.pauseCamera();
    } else if (Platform.isIOS) {
      controller?.resumeCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Scan QR Code',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.4),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Stack(
        children: <Widget>[
          // QR Scanner View
          QRView(
            key: qrKey,
            onQRViewCreated: _onQRViewCreated,
            overlay: QrScannerOverlayShape(
              borderColor: AppColors.primary,
              borderRadius: 12,
              borderLength: 30,
              borderWidth: 8,
              cutOutSize: MediaQuery.of(context).size.width * 0.7,
              overlayColor: Colors.black.withOpacity(0.8),
            ),
          ),
          
          // Scan instructions
          Positioned(
            top: MediaQuery.of(context).size.height * 0.15,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: const Text(
                    'Arahkan kamera ke kode QR',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Camera controls
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Flash Button
                _buildControlButton(
                  icon: _isFlashOn ? Icons.flash_on : Icons.flash_off,
                  onPressed: () async {
                    await controller?.toggleFlash();
                    setState(() {
                      _isFlashOn = !_isFlashOn;
                    });
                  },
                ),
                
                const SizedBox(width: 60),
                
                // Flip Camera Button
                _buildControlButton(
                  icon: Icons.flip_camera_ios,
                  onPressed: () async {
                    await controller?.flipCamera();
                    setState(() {});
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon, 
    required VoidCallback onPressed
  }) {
    return Container(
      height: 60,
      width: 60,
      decoration: BoxDecoration(
        color: AppColors.primary,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(30),
          child: Center(
            child: Icon(
              icon,
              color: Colors.white,
              size: 28,
            ),
          ),
        ),
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      // Process the scanned data and automatically return it
      if (scanData.code != null && scanData.code!.isNotEmpty) {
        // Prevent multiple camera pauses/pops if we're already processing
        if (result != null) return;
        
        // Save the result and pause camera
        setState(() {
          result = scanData;
        });
        controller.pauseCamera();
        
        // Validate the QR format - contains either a number or the expected prefix
        final code = scanData.code!;
        final isValidQR = code.contains(RegExp(r'\d+')) || 
                          code.contains('delpresence:attendance:') ||
                          code.contains('session_id') ||
                          code.contains('sessionId');
        
        if (isValidQR) {
          debugPrint('Valid QR code detected: $code');
          // Return with short delay to allow camera to pause properly
          Future.delayed(const Duration(milliseconds: 300), () {
            if (mounted) {
              Navigator.of(context).pop(code);
            }
          });
        } else {
          debugPrint('Invalid QR format detected: $code');
          // Show error and resume scanning
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('QR Code tidak valid untuk presensi'),
              duration: Duration(seconds: 2),
            ),
          );
          
          // Resume camera after showing error
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              setState(() {
                result = null;
              });
              controller.resumeCamera();
            }
          });
        }
      }
    });
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
} 