import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// Kelas untuk memonitor koneksi API dengan debug print yang rapi
class ApiConnectionMonitor {
  // Singleton instance
  static final ApiConnectionMonitor _instance = ApiConnectionMonitor._();
  static ApiConnectionMonitor get instance => _instance;

  ApiConnectionMonitor._();

  // Status koneksi
  bool _isConnected = false;
  DateTime? _lastChecked;
  String _statusMessage = 'Belum diperiksa';
  int _responseTime = 0;

  // Status monitoring dan timer
  Timer? _monitoringTimer;
  bool _isMonitoring = false;

  // Getters
  bool get isConnected => _isConnected;
  String get statusMessage => _statusMessage;
  DateTime? get lastChecked => _lastChecked;
  int get responseTime => _responseTime;
  bool get isMonitoring => _isMonitoring;

  /// Periksa apakah API dapat diakses
  Future<bool> checkConnection({bool showDebug = true}) async {
    // Menggunakan endpoint /health untuk pemeriksaan koneksi API
    return checkEndpoint('/health', showDebug: showDebug);
  }

  /// Periksa apakah endpoint tertentu dapat diakses
  Future<bool> checkEndpoint(String endpoint, {bool showDebug = true}) async {
    final stopwatch = Stopwatch()..start();
    final String baseUrl = ApiConfig.instance.baseUrl;
    final String checkUrl =
        endpoint.startsWith('http') ? endpoint : '$baseUrl$endpoint';

    if (showDebug) {
      debugPrint('');
      debugPrint('┌───────────── API CONNECTION CHECK ─────────────');
      debugPrint('│ 🔍 Memeriksa koneksi ke API endpoint: $checkUrl');
      debugPrint('│ ⏱️  Waktu: ${DateTime.now().toString()}');
    }

    try {
      final response = await http
          .get(Uri.parse(checkUrl))
          .timeout(const Duration(seconds: 10));

      stopwatch.stop();
      _responseTime = stopwatch.elapsedMilliseconds;
      _lastChecked = DateTime.now();

      if (response.statusCode >= 200 && response.statusCode < 300) {
        _isConnected = true;
        _statusMessage = 'Terhubung';

        if (showDebug) {
          _printSuccess(response.statusCode, _responseTime, checkUrl);
          _tryPrintResponseBody(response.body);
        }
      } else {
        _isConnected = false;
        _statusMessage = 'Gagal terhubung: Status ${response.statusCode}';

        if (showDebug) {
          _printError(response.statusCode, _responseTime, checkUrl);
          _tryPrintResponseBody(response.body);
        }
      }
    } catch (e) {
      stopwatch.stop();
      _responseTime = stopwatch.elapsedMilliseconds;
      _lastChecked = DateTime.now();
      _isConnected = false;

      if (e is TimeoutException) {
        _statusMessage = 'Timeout: Koneksi terlalu lambat';
      } else {
        _statusMessage = 'Error: ${e.toString()}';
      }

      if (showDebug) {
        _printException(e, _responseTime, checkUrl);
      }
    }

    if (showDebug) {
      debugPrint('└───────────────────────────────────────────────');
      debugPrint('');
    }

    return _isConnected;
  }

  // Mencetak respons sukses dengan format yang rapi
  void _printSuccess(int statusCode, int responseTime, String url) {
    debugPrint('│ ✅ TERHUBUNG KE API');
    debugPrint('│ 📊 Status: $statusCode');
    debugPrint('│ ⏱️  Respons: ${responseTime}ms');
    debugPrint('│ 🔗 URL: $url');
  }

  // Mencetak respons error dengan format yang rapi
  void _printError(int statusCode, int responseTime, String url) {
    debugPrint('│ ❌ GAGAL TERHUBUNG KE API');
    debugPrint('│ 📊 Status: $statusCode');
    debugPrint('│ ⏱️  Respons: ${responseTime}ms');
    debugPrint('│ 🔗 URL: $url');
  }

  // Mencetak exception dengan format yang rapi
  void _printException(dynamic error, int responseTime, String url) {
    debugPrint('│ ❌ GAGAL TERHUBUNG KE API');
    debugPrint('│ 🛑 Error: ${error.runtimeType}');
    debugPrint('│ 📝 Detail: ${error.toString()}');
    debugPrint('│ ⏱️  Respons: ${responseTime}ms');
    debugPrint('│ 🔗 URL: $url');

    if (error is SocketException) {
      debugPrint('│ 💡 Saran: Periksa koneksi internet atau alamat server');
    } else if (error is TimeoutException) {
      debugPrint(
          '│ 💡 Saran: Server terlalu lambat merespons atau tidak tersedia');
    } else if (error is FormatException) {
      debugPrint('│ 💡 Saran: Format respons tidak valid');
    }
  }

  // Mencoba untuk mencetak isi respons body jika valid
  void _tryPrintResponseBody(String body) {
    try {
      if (body.isNotEmpty) {
        final jsonBody = json.decode(body);
        final prettyJson = const JsonEncoder.withIndent('  ').convert(jsonBody);
        debugPrint('│ 📦 Response Body:');
        for (final line in prettyJson.split('\n')) {
          debugPrint('│   $line');
        }
      }
    } catch (e) {
      // Jika bukan JSON, cetak sebagai text biasa
      if (body.length > 100) {
        debugPrint('│ 📦 Response Body: ${body.substring(0, 100)}...');
      } else if (body.isNotEmpty) {
        debugPrint('│ 📦 Response Body: $body');
      }
    }
  }

  /// Menampilkan status koneksi dengan format yang rapi
  void printConnectionStatus() {
    final String connectionStatus = _isConnected ? 'TERHUBUNG' : 'TERPUTUS';
    final String emoji = _isConnected ? '✅' : '❌';

    debugPrint('');
    debugPrint('┌───────────── API CONNECTION STATUS ────────────');
    debugPrint('│ $emoji Status: $connectionStatus');

    if (_lastChecked != null) {
      debugPrint('│ 🕒 Terakhir Diperiksa: $_lastChecked');
    }

    debugPrint('│ 📝 Pesan: $_statusMessage');

    if (_isConnected) {
      debugPrint('│ ⏱️  Waktu Respons: $_responseTime ms');
      debugPrint('│ 🔗 API URL: ${ApiConfig.instance.baseUrl}');
    }

    debugPrint('└───────────────────────────────────────────────');
    debugPrint('');
  }

  /// Mulai monitoring koneksi API secara periodik
  void startMonitoring({
    Duration interval = const Duration(seconds: 30),
    bool showDebug = false,
    Function(bool isConnected)? onStatusChanged,
  }) {
    if (_isMonitoring) return;

    _isMonitoring = true;
    debugPrint('');
    debugPrint('┌───────────── API MONITORING ──────────────────');
    debugPrint('│ 🔄 Memulai monitoring koneksi API');
    debugPrint('│ ⏱️  Interval: ${interval.inSeconds} detik');
    debugPrint('└───────────────────────────────────────────────');
    debugPrint('');

    // Periksa koneksi API pertama kali
    checkConnection(showDebug: showDebug).then((isConnected) {
      bool prevStatus = isConnected;

      // Setup timer untuk pengecekan berkala
      _monitoringTimer = Timer.periodic(interval, (timer) async {
        final currentStatus = await checkConnection(showDebug: showDebug);

        // Jika status berubah, panggil callback
        if (currentStatus != prevStatus && onStatusChanged != null) {
          onStatusChanged(currentStatus);
          _logStatusChange(prevStatus, currentStatus);
        }

        prevStatus = currentStatus;
      });
    });
  }

  /// Hentikan monitoring koneksi API
  void stopMonitoring() {
    if (!_isMonitoring) return;

    _monitoringTimer?.cancel();
    _isMonitoring = false;

    debugPrint('');
    debugPrint('┌───────────── API MONITORING ──────────────────');
    debugPrint('│ 🛑 Menghentikan monitoring koneksi API');
    debugPrint('└───────────────────────────────────────────────');
    debugPrint('');
  }

  // Log perubahan status koneksi API
  void _logStatusChange(bool oldStatus, bool newStatus) {
    debugPrint('');
    debugPrint('┌───────────── API STATUS CHANGED ───────────────');
    if (newStatus) {
      debugPrint('│ ✅ Koneksi API PULIH');
      debugPrint('│ 📊 Status: Terhubung');
    } else {
      debugPrint('│ ❌ Koneksi API TERPUTUS');
      debugPrint('│ 📊 Status: Tidak terhubung');
    }
    debugPrint('│ 📝 Pesan: $_statusMessage');
    debugPrint('│ ⏱️  Waktu: ${DateTime.now()}');
    debugPrint('└───────────────────────────────────────────────');
    debugPrint('');
  }
}
