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
  static Future<bool> scanAndSubmitAttendance(
    BuildContext context, 
    {int? scheduleId, Function(int)? onSuccessCallback}
  ) async {
    try {
      // Scan QR code without showing toast
      final qrResult = await scanQRCode(context);
      
      if (qrResult == null) {
        return false;
      }
      
      // Show processing toast
      ToastUtils.showInfoToast(context, 'Memproses QR Code...');
      
      // Process QR data and submit attendance
      final success = await processQRCodeAttendance(context, qrResult, scheduleId: scheduleId);
      
      if (success) {
        ToastUtils.showSuccessToast(context, 'Presensi berhasil tercatat');
        
        // Call the success callback if provided and scheduleId exists
        if (onSuccessCallback != null && scheduleId != null) {
          onSuccessCallback(scheduleId);
        }
      }
      
      return success;
    } catch (e) {
      debugPrint('Error in scanAndSubmitAttendance: $e');
      ToastUtils.showErrorToast(context, 'Gagal memproses QR Code');
      return false;
    }
  }
  
  /// Process QR code data and submit attendance to backend
  static Future<bool> processQRCodeAttendance(BuildContext context, String qrData, {int? scheduleId}) async {
    try {
      debugPrint('Processing QR data: $qrData for schedule ID: $scheduleId');
      
      // Decode the data
      final scannedSessionId = extractSessionIdFromQR(qrData);
      debugPrint('Extracted session ID from QR: $scannedSessionId');
      
      if (scannedSessionId == null) {
        ToastUtils.showErrorToast(context, 'QR Code tidak valid untuk presensi');
        return false;
      }
      
      // Verify that the scanned QR belongs to the selected schedule/session
      if (scheduleId != null) {
        // Check if there is an active session for this schedule and if it matches the scanned QR
        final expectedSessionId = await verifySessionForSchedule(scheduleId);
        
        if (expectedSessionId != null && scannedSessionId != expectedSessionId) {
          // QR code doesn't match the selected schedule
          ToastUtils.showErrorToast(context, 'QR Code tidak sesuai dengan jadwal yang dipilih');
          return false;
        }
      }
      
      // Submit attendance to API
      return await submitAttendance(context, scannedSessionId, scheduleId: scheduleId);
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
  static Future<bool> submitAttendance(BuildContext context, int sessionId, {int? scheduleId}) async {
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
      
      // Get user ID from shared prefs if available
      final userId = prefs.getInt('user_id');
      debugPrint('User ID: $userId');
      
      // New endpoint for QR code attendance submission
      final url = Uri.parse('$baseUrl/api/student/attendance/qr-submit');
      
      // Get default headers from ApiConfig and add auth token
      final headers = Map<String, String>.from(apiConfig.defaultHeaders);
      headers['Authorization'] = 'Bearer $token';
      
      // Add debug output to see headers
      debugPrint('Request headers: $headers');
      
      // Request body with complete information
      final reqBody = {
        'verification_method': 'QR_CODE',
        'session_id': sessionId,
        'qr_data': 'delpresence:attendance:$sessionId',
        'timestamp': DateTime.now().toIso8601String(),
      };
      
      // Add schedule ID if available (for additional validation)
      if (scheduleId != null) {
        reqBody['schedule_id'] = scheduleId;
      }
      
      final body = jsonEncode(reqBody);
      debugPrint('Request body: $body');
      
      // Create HTTP client with proper timeout
      final client = http.Client();
      try {
        // Make API request
        debugPrint('Submitting attendance to: ${url.toString()}');
        final response = await client.post(
          url,
          headers: headers,
          body: body,
        ).timeout(apiConfig.timeout);
        
        // Log response
        debugPrint('🌐 QR Attendance Response [${response.statusCode}]: ${response.body}');
        
        // Consider 2xx responses as success
        if (response.statusCode >= 200 && response.statusCode < 300) {
          // Save attendance status in SharedPreferences to prevent duplicate submissions
          if (scheduleId != null) {
            await prefs.setBool('attendance_completed_$scheduleId', true);
            debugPrint('✅ Marked attendance as completed for schedule $scheduleId');
          }
          
          ToastUtils.showSuccessToast(context, 'Presensi berhasil tercatat');
          return true;
        }
        
        // Handle error response
        String message;
        try {
          final errorData = jsonDecode(response.body);
          message = errorData['message'] ?? errorData['error'] ?? 'Gagal melakukan presensi';
        } catch (_) {
          message = 'Gagal melakukan presensi (${response.statusCode})';
        }
        ToastUtils.showErrorToast(context, message);
        return false;
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
  
  /// Verify the active session ID for a specific schedule
  static Future<int?> verifySessionForSchedule(int scheduleId) async {
    try {
      // Get auth token
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      if (token == null) {
        return null;
      }
      
      // Use ApiConfig for proper API endpoint construction
      final apiConfig = ApiConfig.instance;
      final baseUrl = apiConfig.baseUrl;
      
      // Endpoint to get active sessions for student
      final url = Uri.parse('$baseUrl/api/student/attendance/active-sessions');
      
      // Set up headers
      final headers = Map<String, String>.from(apiConfig.defaultHeaders);
      headers['Authorization'] = 'Bearer $token';
      
      // Create HTTP client with proper timeout
      final client = http.Client();
      try {
        // Make API request
        final response = await client.get(url, headers: headers).timeout(apiConfig.timeout);
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            final responseData = jsonDecode(response.body);
            debugPrint('Active sessions response: ${response.body}');
            
            if (responseData['status'] == 'success' && responseData['data'] is List) {
              final sessions = responseData['data'] as List;
              
              // Find session that matches the given schedule ID
              for (var session in sessions) {
                if (session['course_schedule_id'] == scheduleId) {
                  return session['id'] as int;  // Return the session ID for this schedule
                }
              }
            }
          } catch (e) {
            debugPrint('Error parsing active sessions: $e');
          }
        }
      } finally {
        client.close();
      }
      
      return null;  // No matching session found
    } catch (e) {
      debugPrint('Error verifying schedule session: $e');
      return null;
    }
  }
  
  static int min(int a, int b) => a < b ? a : b;
} 