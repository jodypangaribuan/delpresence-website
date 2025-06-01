import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Service for handling persistent storage of app data
class StorageService {
  static final StorageService _instance = StorageService._internal();
  
  factory StorageService() => _instance;
  
  StorageService._internal();
  
  // Storage keys
  static const String _tokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';
  static const String _themeModeKey = 'theme_mode';
  static const String _appLanguageKey = 'app_language';
  
  /// Get the auth token
  Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_tokenKey);
    } catch (e) {
      debugPrint('🔑 Error retrieving token: $e');
      return null;
    }
  }
  
  /// Save the auth token
  Future<bool> saveToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setString(_tokenKey, token);
    } catch (e) {
      debugPrint('🔑 Error saving token: $e');
      return false;
    }
  }
  
  /// Remove the auth token (for logout)
  Future<bool> removeToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.remove(_tokenKey);
    } catch (e) {
      debugPrint('🔑 Error removing token: $e');
      return false;
    }
  }
  
  /// Get user data
  Future<Map<String, dynamic>?> getUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userDataString = prefs.getString(_userDataKey);
      if (userDataString == null) return null;
      
      return Map<String, dynamic>.from(
        await compute(jsonDecode, userDataString)
      );
    } catch (e) {
      debugPrint('🔑 Error retrieving user data: $e');
      return null;
    }
  }
  
  /// Save user data
  Future<bool> saveUserData(Map<String, dynamic> userData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userDataString = await compute(jsonEncode, userData);
      return await prefs.setString(_userDataKey, userDataString);
    } catch (e) {
      debugPrint('🔑 Error saving user data: $e');
      return false;
    }
  }
  
  /// Get theme mode
  Future<String?> getThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_themeModeKey);
    } catch (e) {
      debugPrint('🔑 Error retrieving theme mode: $e');
      return null;
    }
  }
  
  /// Save theme mode
  Future<bool> saveThemeMode(String themeMode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setString(_themeModeKey, themeMode);
    } catch (e) {
      debugPrint('🔑 Error saving theme mode: $e');
      return false;
    }
  }
  
  /// Get app language
  Future<String?> getAppLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_appLanguageKey);
    } catch (e) {
      debugPrint('🔑 Error retrieving app language: $e');
      return null;
    }
  }
  
  /// Save app language
  Future<bool> saveAppLanguage(String language) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setString(_appLanguageKey, language);
    } catch (e) {
      debugPrint('🔑 Error saving app language: $e');
      return false;
    }
  }
  
  /// Clear all stored data (for logout)
  Future<bool> clearAllData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // Keep theme and language settings
      final themeMode = await getThemeMode();
      final language = await getAppLanguage();
      
      // Clear all data
      await prefs.clear();
      
      // Restore theme and language settings
      if (themeMode != null) {
        await saveThemeMode(themeMode);
      }
      if (language != null) {
        await saveAppLanguage(language);
      }
      
      return true;
    } catch (e) {
      debugPrint('🔑 Error clearing all data: $e');
      return false;
    }
  }
} 