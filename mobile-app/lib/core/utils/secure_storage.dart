import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  // Keys for stored values
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userIdKey = 'user_id';
  static const String _userRoleKey = 'user_role';
  static const String _userNameKey = 'user_name';
  
  // Store authentication token
  Future<void> storeToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }
  
  // Get authentication token
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }
  
  // Store refresh token
  Future<void> storeRefreshToken(String refreshToken) async {
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }
  
  // Get refresh token
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }
  
  // Store user ID
  Future<void> storeUserId(String userId) async {
    await _storage.write(key: _userIdKey, value: userId);
  }
  
  // Get user ID
  Future<String?> getUserId() async {
    return await _storage.read(key: _userIdKey);
  }
  
  // Store user role
  Future<void> storeUserRole(String role) async {
    await _storage.write(key: _userRoleKey, value: role);
  }
  
  // Get user role
  Future<String?> getUserRole() async {
    return await _storage.read(key: _userRoleKey);
  }
  
  // Store user name
  Future<void> storeUserName(String name) async {
    await _storage.write(key: _userNameKey, value: name);
  }
  
  // Get user name
  Future<String?> getUserName() async {
    return await _storage.read(key: _userNameKey);
  }
  
  // Clear all stored values (for logout)
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
} 