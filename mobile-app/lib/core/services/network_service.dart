import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import '../utils/api_logger.dart';

/// API Response model
class ApiResponse<T> {
  final T? data;
  final String? errorMessage;
  final int statusCode;
  final bool success;

  ApiResponse({
    this.data,
    this.errorMessage,
    required this.statusCode,
    required this.success,
  });

  /// Factory method to create a successful response
  factory ApiResponse.success({
    required T? data,
    required int statusCode,
    String? message,
  }) {
    return ApiResponse<T>(
      data: data,
      statusCode: statusCode,
      success: true,
    );
  }

  /// Factory method to create an error response
  factory ApiResponse.error({
    required String errorMessage,
    required int statusCode,
  }) {
    return ApiResponse<T>(
      errorMessage: errorMessage,
      statusCode: statusCode,
      success: false,
    );
  }
}

/// A service class to handle all network requests with built-in logging and error handling
class NetworkService {
  final String baseUrl;
  final Map<String, String> defaultHeaders;
  final Duration timeout;

  /// Constructor with optional parameters
  NetworkService({
    required this.baseUrl,
    this.defaultHeaders = const {'Content-Type': 'application/json'},
    this.timeout = const Duration(seconds: 30),
  });

  /// Builds the complete URL from endpoint
  String _buildUrl(String endpoint) {
    return endpoint.startsWith('http') ? endpoint : '$baseUrl$endpoint';
  }

  /// Combines default headers with request-specific headers
  Map<String, String> _buildHeaders(Map<String, String>? headers) {
    final Map<String, String> combinedHeaders = Map.from(defaultHeaders);
    if (headers != null) {
      combinedHeaders.addAll(headers);
    }
    return combinedHeaders;
  }

  /// Handle HTTP response and convert to ApiResponse
  Future<ApiResponse<T>> _handleResponse<T>(
    http.Response response,
    String url,
    int startTime,
  ) async {
    final int endTime = DateTime.now().millisecondsSinceEpoch;
    final int responseTime = endTime - startTime;

    final Map<String, String> responseHeaders = response.headers;
    final String responseBody = response.body;

    // Log the response
    ApiLogger.logResponse(
      statusCode: response.statusCode,
      url: url,
      headers: responseHeaders,
      body: responseBody,
      responseTime: responseTime,
    );

    // Parse the response body
    dynamic decodedBody;
    try {
      decodedBody = responseBody.isNotEmpty ? json.decode(responseBody) : null;
    } catch (e) {
      decodedBody = responseBody;
    }

    // Check if the request was successful
    final bool isSuccess =
        response.statusCode >= 200 && response.statusCode < 300;

    if (isSuccess) {
      return ApiResponse<T>.success(
        data: decodedBody as T?,
        statusCode: response.statusCode,
      );
    } else {
      final String errorMessage = _extractErrorMessage(decodedBody);
      return ApiResponse<T>.error(
        errorMessage: errorMessage,
        statusCode: response.statusCode,
      );
    }
  }

  /// Extract error message from response body
  String _extractErrorMessage(dynamic body) {
    if (body is Map && body.containsKey('message')) {
      return body['message'];
    } else if (body is Map && body.containsKey('error')) {
      return body['error'];
    } else if (body is String) {
      return body;
    }
    return 'An unexpected error occurred';
  }

  /// Handle errors from HTTP requests
  Future<ApiResponse<T>> _handleError<T>(
    Object error,
    StackTrace stackTrace,
    String url,
  ) async {
    ApiLogger.logError(url, error, stackTrace);

    String errorMessage = 'Network error occurred';
    if (error is SocketException) {
      errorMessage =
          'Could not connect to the server. Please check your internet connection.';
    } else if (error is TimeoutException) {
      errorMessage = 'The connection timed out. Please try again.';
    } else if (error is FormatException) {
      errorMessage = 'Invalid response format.';
    }

    return ApiResponse<T>.error(
      errorMessage: errorMessage,
      statusCode: 0, // Use 0 to indicate a client-side error
    );
  }

  /// GET request
  Future<ApiResponse<T>> get<T>(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParams,
  }) async {
    final String url = _buildUrl(endpoint);
    final Uri uri = Uri.parse(url).replace(queryParameters: queryParams);
    final Map<String, String> requestHeaders = _buildHeaders(headers);

    ApiLogger.logRequest(
      method: 'GET',
      url: uri.toString(),
      headers: requestHeaders,
    );

    final int startTime = DateTime.now().millisecondsSinceEpoch;

    try {
      final response = await http
          .get(
            uri,
            headers: requestHeaders,
          )
          .timeout(timeout);

      return _handleResponse<T>(response, uri.toString(), startTime);
    } catch (e, stackTrace) {
      return _handleError<T>(e, stackTrace, uri.toString());
    }
  }

  /// POST request
  Future<ApiResponse<T>> post<T>(
    String endpoint, {
    Map<String, String>? headers,
    dynamic body,
    Map<String, dynamic>? queryParams,
  }) async {
    final String url = _buildUrl(endpoint);
    final Uri uri = Uri.parse(url).replace(queryParameters: queryParams);
    final Map<String, String> requestHeaders = _buildHeaders(headers);

    final String encodedBody = body != null ? json.encode(body) : '';

    ApiLogger.logRequest(
      method: 'POST',
      url: uri.toString(),
      headers: requestHeaders,
      body: body,
    );

    final int startTime = DateTime.now().millisecondsSinceEpoch;

    try {
      final response = await http
          .post(
            uri,
            headers: requestHeaders,
            body: encodedBody,
          )
          .timeout(timeout);

      return _handleResponse<T>(response, uri.toString(), startTime);
    } catch (e, stackTrace) {
      return _handleError<T>(e, stackTrace, uri.toString());
    }
  }

  /// PUT request
  Future<ApiResponse<T>> put<T>(
    String endpoint, {
    Map<String, String>? headers,
    dynamic body,
    Map<String, dynamic>? queryParams,
  }) async {
    final String url = _buildUrl(endpoint);
    final Uri uri = Uri.parse(url).replace(queryParameters: queryParams);
    final Map<String, String> requestHeaders = _buildHeaders(headers);

    final String encodedBody = body != null ? json.encode(body) : '';

    ApiLogger.logRequest(
      method: 'PUT',
      url: uri.toString(),
      headers: requestHeaders,
      body: body,
    );

    final int startTime = DateTime.now().millisecondsSinceEpoch;

    try {
      final response = await http
          .put(
            uri,
            headers: requestHeaders,
            body: encodedBody,
          )
          .timeout(timeout);

      return _handleResponse<T>(response, uri.toString(), startTime);
    } catch (e, stackTrace) {
      return _handleError<T>(e, stackTrace, uri.toString());
    }
  }

  /// DELETE request
  Future<ApiResponse<T>> delete<T>(
    String endpoint, {
    Map<String, String>? headers,
    dynamic body,
    Map<String, dynamic>? queryParams,
  }) async {
    final String url = _buildUrl(endpoint);
    final Uri uri = Uri.parse(url).replace(queryParameters: queryParams);
    final Map<String, String> requestHeaders = _buildHeaders(headers);

    final String encodedBody = body != null ? json.encode(body) : '';

    ApiLogger.logRequest(
      method: 'DELETE',
      url: uri.toString(),
      headers: requestHeaders,
      body: body,
    );

    final int startTime = DateTime.now().millisecondsSinceEpoch;

    try {
      final response = await http
          .delete(
            uri,
            headers: requestHeaders,
            body: encodedBody,
          )
          .timeout(timeout);

      return _handleResponse<T>(response, uri.toString(), startTime);
    } catch (e, stackTrace) {
      return _handleError<T>(e, stackTrace, uri.toString());
    }
  }
}
