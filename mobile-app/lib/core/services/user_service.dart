import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserService {
  // Singleton pattern
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();
  
  static const String _userKey = 'current_user';
  
  /// Get the current logged in user
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? userJson = prefs.getString(_userKey);
      
      if (userJson == null) {
        return null;
      }
      
      return jsonDecode(userJson) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Error getting current user: $e');
      return null;
    }
  }
  
  /// Save user data to local storage
  Future<bool> saveUser(Map<String, dynamic> userData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setString(_userKey, jsonEncode(userData));
    } catch (e) {
      debugPrint('Error saving user: $e');
      return false;
    }
  }
  
  /// Clear user data from local storage
  Future<bool> clearUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.remove(_userKey);
    } catch (e) {
      debugPrint('Error clearing user: $e');
      return false;
    }
  }
  
  /// Get user ID
  Future<int?> getUserId() async {
    final user = await getCurrentUser();
    return user != null ? user['id'] as int? : null;
  }
  
  /// Get student ID
  Future<int?> getStudentId() async {
    final user = await getCurrentUser();
    return user != null ? user['student_id'] as int? : null;
  }
} 