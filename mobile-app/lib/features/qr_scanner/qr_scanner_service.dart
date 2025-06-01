import 'package:flutter/material.dart';
import 'presentation/pages/qr_scanner_page.dart';

/// Service to handle QR code scanning
class QRScannerService {
  /// Launch the QR scanner and return the scanned result
  /// Returns null if scanning was cancelled or failed
  static Future<String?> scanQRCode(BuildContext context) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const QRScannerPage()),
    );
    
    return result as String?;
  }
} 