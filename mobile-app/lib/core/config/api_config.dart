import 'package:flutter/foundation.dart';

/// A class to manage API configuration
class ApiConfig {
  // Private constructor to prevent direct instantiation
  ApiConfig._();

  // Singleton instance
  static final ApiConfig _instance = ApiConfig._();
  static ApiConfig get instance => _instance;

  // API configuration constants
  static const String DEFAULT_BASE_URL = 'http://13.229.201.62:8080/api/v1';
  static const int DEFAULT_TIMEOUT = 30;
  static const String API_VERSION = 'v1';
  static const bool DEFAULT_ENABLE_LOGGING = true;

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

    debugPrint('🌐 API Config initialized');
    debugPrint('🌐 Base URL: $_baseUrl');
    debugPrint('🌐 Timeout: $_timeout seconds');
    debugPrint('🌐 API logging: ${_enableApiLogging ? 'Enabled' : 'Disabled'}');
    debugPrint('🌐 Allow self-signed certs: $_allowSelfSignedCerts');
  }

  /// Get the base URL
  String get baseUrl => _baseUrl;

  /// Get the timeout duration
  Duration get timeout => Duration(seconds: _timeout);

  /// Get the API version
  String get apiVersion => API_VERSION;

  /// Check if API logging is enabled
  bool get isLoggingEnabled => _enableApiLogging && kDebugMode;

  /// Check if self-signed certificates are allowed
  bool get allowSelfSignedCerts => _allowSelfSignedCerts;

  /// Get headers that should be included in every request
  Map<String, String> get defaultHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': apiVersion,
        'X-Platform': 'flutter',
      };
}

// Berandai-andai atau Anggap saja fitur login dan register sudah ada dan halaman homepage sudah ada, dan saya ingin mengisi tabel Module "Attendance" dengan sub module "Doseen Generate QR", "mahasiswa scan QR untuk absen", "mahasiswa melakukan face recognition untuk absen", buatkan beberapa testcase untuk menguji ketiga fitur tersebut buat dalam tabel: No, Module, Sub Module, Test Case ID, Test Scenario, Type, Precondition, Steps, Expected Result, Actual Result
