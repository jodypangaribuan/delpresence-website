import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'presentation/pages/qr_scanner_page.dart';
import '../../core/config/api_config.dart';
import '../../core/utils/toast_utils.dart';

/// Service to handle QR code scanning and attendance submission
class QRScannerService {
  /// Launch the QR scanner and return the scanned result
  /// Returns null if scanning was cancelled or failed
  static Future<String?> scanQRCode(BuildContext context) async {
    try {
      final result = await Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const QRScannerPage()),
      );
      
      return result as String?;
    } catch (e) {
      debugPrint('Error scanning QR code: $e');
      return null;
    }
  }

  /// Scan QR code and process attendance submission
  static Future<bool> scanAndSubmitAttendance(BuildContext context) async {
    OverlayEntry? loadingOverlay;
    OverlayEntry? processingOverlay;
    
    try {
      // Show loading indicator
      loadingOverlay = _showLoadingOverlay(context);
      
      // Scan QR code
      final qrResult = await scanQRCode(context);
      
      // Remove loading indicator
      if (loadingOverlay != null) {
        loadingOverlay.remove();
        loadingOverlay = null;
      }
      
      if (qrResult == null) {
        return false;
      }
      
      // Show processing indicator
      processingOverlay = _showProcessingOverlay(context);
      
      // Process QR data and submit attendance
      final success = await processQRCodeAttendance(context, qrResult);
      
      // Remove processing indicator
      if (processingOverlay != null) {
        processingOverlay.remove();
        processingOverlay = null;
      }
      
      if (success) {
        ToastUtils.showSuccessToast(context, 'Presensi berhasil tercatat');
      }
      
      return success;
    } catch (e) {
      debugPrint('Error in scanAndSubmitAttendance: $e');
      
      // Ensure overlays are removed in case of error
      if (loadingOverlay != null) {
        loadingOverlay.remove();
      }
      if (processingOverlay != null) {
        processingOverlay.remove();
      }
      
      ToastUtils.showErrorToast(context, 'Gagal memproses QR Code');
      return false;
    }
  }
  
  /// Process QR code data and submit attendance to backend
  static Future<bool> processQRCodeAttendance(BuildContext context, String qrData) async {
    try {
      debugPrint('Processing QR data: $qrData');
      
      // Check if QR data is valid for attendance
      // Format: delpresence:attendance:sessionId or base64 encoded session data
      
      // Decode the data
      final sessionId = extractSessionIdFromQR(qrData);
      debugPrint('Extracted session ID: $sessionId');
      
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
      } catch (_) {
        // Ignore base64 decoding errors
      }

      // Assume the QR code is just the session ID string
      return int.tryParse(qrData);
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
      
      // Debug token to check if it exists
      debugPrint('AUTH TOKEN (first 10 chars): ${token != null ? token.substring(0, min(10, token.length)) : "null"}...');
      
      if (token == null) {
        ToastUtils.showErrorToast(context, 'Anda perlu login ulang');
        return false;
      }
      
      // Use ApiConfig for proper API endpoint construction
      final baseUrl = ApiConfig.instance.baseUrl;
      final apiConfig = ApiConfig.instance;
      
      debugPrint('Using API base URL: $baseUrl');
      
      // API endpoint for student attendance submission - try both endpoint formats
      // Format 1: /api/student/attendance/sessions/:id/submit
      final url1 = Uri.parse('$baseUrl/api/student/attendance/sessions/$sessionId/submit');
      
      // Format 2: /api/student/attendance/submit/:id
      final url2 = Uri.parse('$baseUrl/api/student/attendance/submit/$sessionId');
      
      // Format 3: /api/attendance/sessions/:id/student
      final url3 = Uri.parse('$baseUrl/api/attendance/sessions/$sessionId/student');
      
      // Get default headers from ApiConfig and add auth token
      final headers = Map<String, String>.from(apiConfig.defaultHeaders);
      headers['Authorization'] = 'Bearer $token';
      
      // Add debug output to see headers
      debugPrint('Request headers: $headers');
      
      // Request body with verification method
      final body = jsonEncode({
        'verification_method': 'QR_CODE',
        'session_id': sessionId,
      });
      
      debugPrint('Request body: $body');
      
      // Create HTTP client with proper timeout
      final client = http.Client();
      try {
        // Try first endpoint format
        debugPrint('Attempting to submit attendance to: ${url1.toString()}');
        var response = await client.post(
          url1,
          headers: headers,
          body: body,
        ).timeout(apiConfig.timeout);
        
        // If first format fails, try the second format
        if (response.statusCode >= 400) {
          debugPrint('First endpoint failed (${response.statusCode}), trying second endpoint');
          response = await client.post(
            url2,
            headers: headers,
            body: body,
          ).timeout(apiConfig.timeout);
          
          // If second format fails, try the third format
          if (response.statusCode >= 400) {
            debugPrint('Second endpoint failed (${response.statusCode}), trying third endpoint');
            response = await client.post(
              url3,
              headers: headers,
              body: body,
            ).timeout(apiConfig.timeout);
          }
        }
        
        // Log response
        debugPrint('🌐 QR Attendance Response [${response.statusCode}]: ${response.body}');
        
        if (response.statusCode == 200 || response.statusCode == 201) {
          return true;
        } else {
          // Parse error response
          String message;
          try {
            final errorData = jsonDecode(response.body);
            message = errorData['message'] ?? errorData['error'] ?? 'Gagal melakukan presensi';
          } catch (_) {
            message = 'Gagal melakukan presensi (${response.statusCode})';
          }
          ToastUtils.showErrorToast(context, message);
          return false;
        }
      } on SocketException {
        debugPrint('Socket Exception when submitting attendance');
        ToastUtils.showErrorToast(context, 'Tidak dapat terhubung ke server');
        return false;
      } on TimeoutException {
        debugPrint('Timeout Exception when submitting attendance');
        ToastUtils.showErrorToast(context, 'Koneksi timeout, coba lagi');
        return false;
      } catch (e) {
        debugPrint('General Exception when submitting attendance: $e');
        ToastUtils.showErrorToast(context, 'Gagal memproses permintaan: $e');
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
  
  static int min(int a, int b) => a < b ? a : b;
  
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
    
    // Ensure the overlay is inserted safely
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (Overlay.of(context).mounted) {
        Overlay.of(context).insert(overlay);
      }
    });
    
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
    
    // Ensure the overlay is inserted safely
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (Overlay.of(context).mounted) {
        Overlay.of(context).insert(overlay);
      }
    });
    
    return overlay;
  }
} 