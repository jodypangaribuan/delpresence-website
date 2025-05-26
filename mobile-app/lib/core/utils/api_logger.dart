import 'dart:convert';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

/// A utility class for logging API requests and responses in a clean, structured, and colorful way.
class ApiLogger {
  // Configuration
  static bool _enabled = true;
  static bool _detailedMode = true;
  static bool _colorfulLogs = true;

  // ANSI color codes
  static const String _reset = '\x1B[0m';
  static const String _red = '\x1B[31m';
  static const String _green = '\x1B[32m';
  static const String _yellow = '\x1B[33m';
  static const String _blue = '\x1B[34m';
  static const String _magenta = '\x1B[35m';
  static const String _cyan = '\x1B[36m';
  static const String _bold = '\x1B[1m';

  /// Enable or disable API logging
  static void setEnabled(bool enabled) {
    _enabled = enabled;
  }

  /// Enable or disable detailed logging
  static void setDetailedMode(bool detailed) {
    _detailedMode = detailed;
  }

  /// Enable or disable colorful logging
  static void setColorfulLogs(bool colorful) {
    _colorfulLogs = colorful;
  }

  /// Log a HTTP request
  static void logRequest({
    required String method,
    required String url,
    Map<String, String>? headers,
    dynamic body,
  }) {
    if (!_enabled) return;

    final StringBuffer logMessage = StringBuffer();

    // Apply colors conditionally
    final String methodColor = _applyColor(_bold + _blue, '');
    final String headerColor = _applyColor(_cyan, '');
    final String resetColor = _applyColor(_reset, '');
    final String dividerColor = _applyColor(_yellow, '');

    logMessage.writeln(
        '${dividerColor}┌───────────────────── HTTP REQUEST ─────────────────────${resetColor}');
    logMessage.writeln(
        '${dividerColor}│${resetColor} ${methodColor}${method}${resetColor} ${url}');

    if (_detailedMode && headers != null && headers.isNotEmpty) {
      logMessage.writeln('${dividerColor}├─── Headers ───${resetColor}');
      _logMap(headers, logMessage, keyColor: headerColor);
    }

    if (_detailedMode && body != null) {
      logMessage.writeln('${dividerColor}├─── Body ───${resetColor}');
      final String bodyStr = _prettyPrintJson(body);
      _logMultiLine(bodyStr, logMessage);
    }

    logMessage.writeln(
        '${dividerColor}└───────────────────────────────────────────────────────${resetColor}');

    _log(logMessage.toString());
  }

  /// Log a HTTP response
  static void logResponse({
    required int statusCode,
    required String url,
    Map<String, String>? headers,
    dynamic body,
    int? responseTime,
  }) {
    if (!_enabled) return;

    final StringBuffer logMessage = StringBuffer();

    // Status indicators with colors
    final bool isSuccess = statusCode >= 200 && statusCode < 300;
    final String statusColor =
        isSuccess ? _applyColor(_green, '') : _applyColor(_red, '');
    final String statusIcon = isSuccess ? '✅' : '❌';
    final String headerColor = _applyColor(_cyan, '');
    final String timeColor = _applyColor(_magenta, '');
    final String resetColor = _applyColor(_reset, '');
    final String dividerColor = _applyColor(_yellow, '');

    logMessage.writeln(
        '${dividerColor}┌───────────────────── HTTP RESPONSE ────────────────────${resetColor}');
    logMessage.writeln(
        '${dividerColor}│${resetColor} ${statusColor}${statusIcon} ${statusCode}${resetColor} ${url}');

    if (responseTime != null) {
      logMessage.writeln(
          '${dividerColor}│${resetColor} ${timeColor}⏱ ${responseTime}ms${resetColor}');
    }

    if (_detailedMode && headers != null && headers.isNotEmpty) {
      logMessage.writeln('${dividerColor}├─── Headers ───${resetColor}');
      _logMap(headers, logMessage, keyColor: headerColor);
    }

    if (body != null) {
      logMessage.writeln('${dividerColor}├─── Body ───${resetColor}');
      final String bodyStr = _prettyPrintJson(body);
      _logMultiLine(bodyStr, logMessage);
    }

    logMessage.writeln(
        '${dividerColor}└───────────────────────────────────────────────────────${resetColor}');

    _log(logMessage.toString());
  }

  /// Log an error
  static void logError(String url, dynamic error, StackTrace? stackTrace) {
    if (!_enabled) return;

    final StringBuffer logMessage = StringBuffer();

    final String errorColor = _applyColor(_red, '');
    final String urlColor = _applyColor(_blue, '');
    final String resetColor = _applyColor(_reset, '');
    final String dividerColor = _applyColor(_red, '');

    logMessage.writeln(
        '${dividerColor}┌───────────────────── API ERROR ───────────────────────${resetColor}');
    logMessage.writeln(
        '${dividerColor}│${resetColor} ${errorColor}❌${resetColor} ${urlColor}${url}${resetColor}');
    logMessage.writeln('${dividerColor}├─── Error ───${resetColor}');
    logMessage.writeln(
        '${dividerColor}│${resetColor} ${errorColor}${error.toString()}${resetColor}');

    if (_detailedMode && stackTrace != null) {
      logMessage.writeln('${dividerColor}├─── Stack Trace ───${resetColor}');
      _logMultiLine(stackTrace.toString(), logMessage,
          prefixColor: dividerColor);
    }

    logMessage.writeln(
        '${dividerColor}└───────────────────────────────────────────────────────${resetColor}');

    _log(logMessage.toString(), isError: true);
  }

  // Apply color only if colorful logs are enabled
  static String _applyColor(String colorCode, String fallback) {
    return _colorfulLogs ? colorCode : fallback;
  }

  // Helper method to log a map
  static void _logMap(Map<String, dynamic> map, StringBuffer logMessage,
      {String keyColor = ''}) {
    final String resetColor = _applyColor(_reset, '');
    final String dividerColor = _applyColor(_yellow, '');

    map.forEach((key, value) {
      final String displayValue;

      // Skip logging authorization token details
      if (key.toLowerCase() == 'authorization' && !kDebugMode) {
        displayValue = 'Token hidden for security';
      } else {
        displayValue = value.toString();
      }

      logMessage.writeln(
          '${dividerColor}│${resetColor} ${keyColor}${key}:${resetColor} ${displayValue}');
    });
  }

  // Helper method to log multi-line text
  static void _logMultiLine(String text, StringBuffer logMessage,
      {String prefixColor = ''}) {
    final String resetColor = _applyColor(_reset, '');
    final String dividerColor =
        prefixColor.isEmpty ? _applyColor(_yellow, '') : prefixColor;

    for (final line in text.split('\n')) {
      logMessage.writeln('${dividerColor}│${resetColor} ${line}');
    }
  }

  // Helper method to pretty print JSON
  static String _prettyPrintJson(dynamic json) {
    try {
      if (json is String) {
        // Try to parse the string as JSON
        final dynamic parsedJson = jsonDecode(json);
        return const JsonEncoder.withIndent('  ').convert(parsedJson);
      } else if (json is Map || json is List) {
        return const JsonEncoder.withIndent('  ').convert(json);
      }
    } catch (e) {
      // If it's not valid JSON, return as is
    }
    return json.toString();
  }

  // Log to console with appropriate styling
  static void _log(String message, {bool isError = false}) {
    if (isError) {
      developer.log(message, name: 'API_ERROR');
    } else {
      developer.log(message, name: 'API_DEBUG');
    }
  }
}
