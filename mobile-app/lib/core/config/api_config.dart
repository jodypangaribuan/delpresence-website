import 'package:flutter/foundation.dart' as flutter;

/// A comprehensive class to manage API configuration and endpoints
class ApiConfig {
  // Private constructor to prevent direct instantiation
  ApiConfig._();

  // Singleton instance
  static final ApiConfig _instance = ApiConfig._();
  static ApiConfig get instance => _instance;

  // API configuration constants
  static const String DEFAULT_BASE_URL =
      'https://7c00-103-167-217-200.ngrok-free.app';
  static const String API_PATH = '/api/v1';
  static const int DEFAULT_TIMEOUT = 30;
  static const String API_VERSION = 'v1';
  static const bool DEFAULT_ENABLE_LOGGING = true;

  // Commonly used endpoints
  static const String CAMPUS_AUTH_ENDPOINT =
      '$DEFAULT_BASE_URL/api/auth/campus/login';

  // Pengaturan keamanan
  bool _allowSelfSignedCerts = true;

  // Base URL
  String _baseUrl = DEFAULT_BASE_URL;

  // API timeout in seconds
  int _timeout = DEFAULT_TIMEOUT;

  // Debug settings
  bool _enableApiLogging = DEFAULT_ENABLE_LOGGING;

  /// Initialize the API configuration
  void initialize({
    String? baseUrl,
    int? timeout,
    bool? enableApiLogging,
    bool? allowSelfSignedCerts,
  }) {
    if (baseUrl != null) _baseUrl = baseUrl;
    if (timeout != null) _timeout = timeout;
    if (enableApiLogging != null) _enableApiLogging = enableApiLogging;
    if (allowSelfSignedCerts != null)
      _allowSelfSignedCerts = allowSelfSignedCerts;

    flutter.debugPrint('🌐 API Config initialized');
    flutter.debugPrint('🌐 Base URL: $_baseUrl');
    flutter.debugPrint('🌐 Timeout: $_timeout seconds');
    flutter.debugPrint(
        '🌐 API logging: ${_enableApiLogging ? 'Enabled' : 'Disabled'}');
    flutter.debugPrint('🌐 Allow self-signed certs: $_allowSelfSignedCerts');
  }

  /// Get the base URL
  String get baseUrl => _baseUrl;

  /// Get the full API URL (baseUrl + API_PATH)
  String get apiUrl => '$_baseUrl$API_PATH';

  /// Get the timeout duration
  Duration get timeout => Duration(seconds: _timeout);

  /// Get the API version
  String get apiVersion => API_VERSION;

  /// Check if API logging is enabled
  bool get isLoggingEnabled => _enableApiLogging && flutter.kDebugMode;

  /// Check if self-signed certificates are allowed
  bool get allowSelfSignedCerts => _allowSelfSignedCerts;

  /// Get headers that should be included in every request
  Map<String, String> get defaultHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': apiVersion,
        'X-Platform': 'flutter',
      };

  /// Get student data by user ID endpoint
  String studentByUserIdEndpoint(int userId) =>
      '$_baseUrl/api/students/by-user-id/$userId';

  /// Get campus auth endpoint
  String get campusAuthEndpoint => CAMPUS_AUTH_ENDPOINT;
}

// Berandai-andai atau Anggap saja fitur login dan register sudah ada dan halaman homepage sudah ada, dan saya ingin mengisi tabel Module "Attendance" dengan sub module "Doseen Generate QR", "mahasiswa scan QR untuk absen", "mahasiswa melakukan face recognition untuk absen", buatkan beberapa testcase untuk menguji ketiga fitur tersebut buat dalam tabel: No, Module, Sub Module, Test Case ID, Test Scenario, Type, Precondition, Steps, Expected Result, Actual Result
