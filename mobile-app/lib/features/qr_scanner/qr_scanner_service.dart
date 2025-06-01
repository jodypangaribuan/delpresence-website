import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'presentation/pages/qr_scanner_page.dart';
import '../../core/config/api_config.dart';
import '../../core/utils/toast_utils.dart';

/// Service to handle QR code scanning and attendance submission
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

  /// Scan QR code and process attendance submission
  static Future<bool> scanAndSubmitAttendance(BuildContext context) async {
    try {
      // Show loading indicator
      final loadingOverlay = _showLoadingOverlay(context);
      
      // Scan QR code
      final qrResult = await scanQRCode(context);
      
      // Remove loading indicator
      loadingOverlay.remove();
      
      if (qrResult == null) {
        return false;
      }
      
      // Show processing indicator
      final processingOverlay = _showProcessingOverlay(context);
      
      // Process QR data and submit attendance
      final success = await processQRCodeAttendance(context, qrResult);
      
      // Remove processing indicator
      processingOverlay.remove();
      
      if (success) {
        ToastUtils.showSuccessToast(context, 'Presensi berhasil tercatat');
      }
      
      return success;
    } catch (e) {
      debugPrint('Error in scanAndSubmitAttendance: $e');
      ToastUtils.showErrorToast(context, 'Gagal memproses QR Code');
      return false;
    }
  }
  
  /// Process QR code data and submit attendance to backend
  static Future<bool> processQRCodeAttendance(BuildContext context, String qrData) async {
    try {
      // Check if QR data is valid for attendance
      // Format: delpresence:attendance:sessionId or base64 encoded session data
      
      // Decode the data
      final sessionId = extractSessionIdFromQR(qrData);
      if (sessionId == null) {
        ToastUtils.showErrorToast(context, 'QR Code tidak valid untuk presensi');
        return false;
      }
      
      // Submit attendance to API
      return await submitAttendance(context, sessionId);
    } catch (e) {
      debugPrint('Error processing QR code: $e');
      ToastUtils.showErrorToast(context, 'Format QR Code tidak valid');
      return false;
    }
  }
  
  /// Extract session ID from QR code data
  static int? extractSessionIdFromQR(String qrData) {
    try {
      // Format 1: delpresence:attendance:sessionId
      if (qrData.startsWith('delpresence:attendance:')) {
        final parts = qrData.split(':');
        if (parts.length == 3) {
          return int.tryParse(parts[2]);
        }
      }
      
      // Format 2: Just the session ID
      final sessionId = int.tryParse(qrData);
      if (sessionId != null) {
        return sessionId;
      }
      
      // Format 3: Try to decode base64 for more complex formats
      try {
        final decoded = utf8.decode(base64Decode(qrData));
        final json = jsonDecode(decoded);
        return json['sessionId'] ?? json['session_id'];
      } catch (_) {}
      
      return null;
    } catch (e) {
      debugPrint('Error extracting session ID: $e');
      return null;
    }
  }
  
  /// Submit attendance to backend API
  static Future<bool> submitAttendance(BuildContext context, int sessionId) async {
    try {
      // Get auth token
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      if (token == null) {
        ToastUtils.showErrorToast(context, 'Anda perlu login ulang');
        return false;
      }
      
      // Use ApiConfig for proper API endpoint construction
      final baseUrl = ApiConfig.instance.baseUrl;
      final apiConfig = ApiConfig.instance;
      
      // API endpoint for student attendance submission
      final url = Uri.parse('$baseUrl/api/student/attendance/sessions/$sessionId/submit');
      
      // Get default headers from ApiConfig and add auth token
      final headers = Map<String, String>.from(apiConfig.defaultHeaders);
      headers['Authorization'] = 'Bearer $token';
      
      // Create HTTP client with proper timeout
      final client = http.Client();
      try {
        // Make API request with proper timeout and headers
        final response = await client.post(
          url,
          headers: headers,
          body: jsonEncode({
            'verification_method': 'QR_CODE',
          }),
        ).timeout(apiConfig.timeout);
        
        // Log response if logging is enabled
        if (apiConfig.isLoggingEnabled) {
          debugPrint('🌐 QR Attendance Response [${response.statusCode}]: ${response.body}');
        }
        
        if (response.statusCode == 200 || response.statusCode == 201) {
          return true;
        } else {
          // Parse error response
          final errorData = jsonDecode(response.body);
          final message = errorData['message'] ?? 'Gagal melakukan presensi';
          ToastUtils.showErrorToast(context, message);
          return false;
        }
      } on SocketException {
        ToastUtils.showErrorToast(context, 'Tidak dapat terhubung ke server');
        return false;
      } on TimeoutException {
        ToastUtils.showErrorToast(context, 'Koneksi timeout, coba lagi');
        return false;
      } finally {
        client.close();
      }
    } catch (e) {
      debugPrint('Error submitting attendance: $e');
      ToastUtils.showErrorToast(context, 'Gagal terhubung ke server');
      return false;
    }
  }
  
  /// Show loading overlay while scanning QR
  static OverlayEntry _showLoadingOverlay(BuildContext context) {
    final overlay = OverlayEntry(
      builder: (context) => Container(
        color: Colors.black.withOpacity(0.5),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      ),
    );
    
    Overlay.of(context).insert(overlay);
    return overlay;
  }
  
  /// Show processing overlay while submitting attendance
  static OverlayEntry _showProcessingOverlay(BuildContext context) {
    final overlay = OverlayEntry(
      builder: (context) => Container(
        color: Colors.black.withOpacity(0.5),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                const Text(
                  'Memproses Presensi',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sedang mengirim data ke server...',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    
    Overlay.of(context).insert(overlay);
    return overlay;
  }
} 