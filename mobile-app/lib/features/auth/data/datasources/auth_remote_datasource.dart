import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/utils/api_logger.dart';
import '../models/auth_response_model.dart';

abstract class AuthRemoteDataSource {
  Future<AuthResponseModel> login({
    required String username,
    required String password,
  });
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final http.Client client;

  AuthRemoteDataSourceImpl({required this.client});

  @override
  Future<AuthResponseModel> login({
    required String username,
    required String password,
  }) async {
    try {
      final uri = Uri.parse(ApiConstants.campusAuthEndpoint);

      // Create form data for the request
      var request = http.MultipartRequest('POST', uri);
      request.fields['username'] = username;
      request.fields['password'] = password;

      // Log the request with ApiLogger
      ApiLogger.logRequest(
        method: 'POST',
        url: uri.toString(),
        headers: {'Content-Type': 'multipart/form-data'},
        body: {'username': username, 'password': '********'}, // Mask password
      );

      // Send the request
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      // Log the response
      ApiLogger.logResponse(
        statusCode: response.statusCode,
        url: uri.toString(),
        headers: response.headers,
        body: _safeParseJson(response.body),
        responseTime: null, // Could add timing in the future
      );

      if (response.statusCode == 200) {
        // Parse the response
        Map<String, dynamic> jsonResponse = json.decode(response.body);

        // Check if authentication was successful by examining the structure of the response
        if (jsonResponse.containsKey('user') &&
            jsonResponse.containsKey('token')) {
          // Campus auth API returns user object and token
          final user = jsonResponse['user'];
          final token = jsonResponse['token'];
          final refreshToken = jsonResponse['refresh_token'];

          if (user == null || token == null) {
            ApiLogger.logError(
              uri.toString(),
              'Authentication succeeded but user or token is missing',
              null,
            );
            return AuthResponseModel.error('Incomplete response from server');
          }

          // Verify if the user is a student by checking role
          final userRole = user['role'];
          if (userRole != 'Mahasiswa') {
            ApiLogger.logError(
              uri.toString(),
              'Authentication succeeded but user is not a student',
              null,
            );
            return AuthResponseModel.error(
                'ACCESS_DENIED: Hanya akun mahasiswa yang diizinkan');
          }

          // Save tokens and user data
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('auth_token', token);
          await prefs.setString('refresh_token', refreshToken ?? '');
          await prefs.setString('user_role', userRole);

          // Save username for display purposes
          await prefs.setString('username', username);

          // Extract user ID and external_user_id
          final userId = user['id'] ?? '';
          final externalUserId = user['external_user_id'] ?? 0;

          // Save external_user_id for fetching student data
          await prefs.setInt('external_user_id', externalUserId);

          // Create a proper response structure
          final userData = {
            'success': true,
            'message': 'Login successful',
            'data': {
              'token': token,
              'user': {
                'id': userId.toString(),
                'username': username,
                'name': user['username'] ?? 'User',
                'external_user_id': externalUserId,
              }
            }
          };

          return AuthResponseModel.fromJson(userData);
        } else {
          // Authentication failed
          final errorMessage =
              jsonResponse['error'] ?? 'Username atau password salah';
          ApiLogger.logError(
            uri.toString(),
            'Authentication failed: $errorMessage',
            null,
          );
          return AuthResponseModel.error(errorMessage);
        }
      } else if (response.statusCode == 401) {
        ApiLogger.logError(
          uri.toString(),
          'Authentication failed: Invalid credentials',
          null,
        );
        return AuthResponseModel.error('Username atau password salah');
      } else {
        ApiLogger.logError(
          uri.toString(),
          'Server error: ${response.statusCode}',
          null,
        );
        return AuthResponseModel.error('Server error: ${response.statusCode}');
      }
    } catch (e, stackTrace) {
      ApiLogger.logError(
        ApiConstants.campusAuthEndpoint,
        'Login error: ${e.toString()}',
        stackTrace,
      );
      return AuthResponseModel.error('Connection error: ${e.toString()}');
    }
  }

  // Helper method to safely parse JSON for logging
  dynamic _safeParseJson(String text) {
    try {
      return json.decode(text);
    } catch (e) {
      return text;
    }
  }
}
