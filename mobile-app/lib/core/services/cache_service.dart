import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// A service that handles caching of data to improve app performance
class CacheService {
  static final CacheService _instance = CacheService._internal();
  
  factory CacheService() => _instance;
  
  CacheService._internal();
  
  late SharedPreferences _prefs;
  
  // Cache keys
  static const String _todaySchedulesKey = 'today_schedules';
  static const String _activeSessionsKey = 'active_sessions';
  static const String _academicYearsKey = 'academic_years';
  static const String _lastFetchTimeKey = 'last_fetch_time';
  
  // Cache expiration times (in minutes)
  static const int _schedulesCacheExpiration = 60; // 1 hour
  static const int _activeSessionsCacheExpiration = 1; // 1 minute
  static const int _academicYearsCacheExpiration = 1440; // 24 hours
  
  /// Initialize the cache service
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }
  
  /// Save today's schedules to cache
  Future<void> saveTodaySchedules(List<dynamic> schedules) async {
    try {
      final jsonData = jsonEncode(schedules);
      await _prefs.setString(_todaySchedulesKey, jsonData);
      await _updateLastFetchTime(_todaySchedulesKey);
      
      debugPrint('🔍 Cache: Saved ${schedules.length} schedules to cache');
    } catch (e) {
      debugPrint('🔍 Cache error: Failed to save schedules: $e');
    }
  }
  
  /// Get today's schedules from cache
  Future<List<dynamic>?> getTodaySchedules() async {
    try {
      if (!_isCacheValid(_todaySchedulesKey, _schedulesCacheExpiration)) {
        debugPrint('🔍 Cache: Schedules cache expired or not found');
        return null;
      }
      
      final jsonData = _prefs.getString(_todaySchedulesKey);
      if (jsonData == null) return null;
      
      final List<dynamic> schedules = jsonDecode(jsonData);
      debugPrint('🔍 Cache: Retrieved ${schedules.length} schedules from cache');
      return schedules;
    } catch (e) {
      debugPrint('🔍 Cache error: Failed to get schedules: $e');
      return null;
    }
  }
  
  /// Save active sessions map to cache
  Future<void> saveActiveSessions(Map<int, bool> activeSessions) async {
    try {
      final Map<String, dynamic> stringKeyMap = {};
      activeSessions.forEach((key, value) {
        stringKeyMap[key.toString()] = value;
      });
      
      final jsonData = jsonEncode(stringKeyMap);
      await _prefs.setString(_activeSessionsKey, jsonData);
      await _updateLastFetchTime(_activeSessionsKey);
      
      debugPrint('🔍 Cache: Saved ${activeSessions.length} active sessions to cache');
    } catch (e) {
      debugPrint('🔍 Cache error: Failed to save active sessions: $e');
    }
  }
  
  /// Get active sessions map from cache
  Future<Map<int, bool>?> getActiveSessions() async {
    try {
      if (!_isCacheValid(_activeSessionsKey, _activeSessionsCacheExpiration)) {
        debugPrint('🔍 Cache: Active sessions cache expired or not found');
        return null;
      }
      
      final jsonData = _prefs.getString(_activeSessionsKey);
      if (jsonData == null) return null;
      
      final Map<String, dynamic> stringKeyMap = jsonDecode(jsonData);
      final Map<int, bool> activeSessions = {};
      
      stringKeyMap.forEach((key, value) {
        activeSessions[int.parse(key)] = value;
      });
      
      debugPrint('🔍 Cache: Retrieved ${activeSessions.length} active sessions from cache');
      return activeSessions;
    } catch (e) {
      debugPrint('🔍 Cache error: Failed to get active sessions: $e');
      return null;
    }
  }
  
  /// Save academic years to cache
  Future<void> saveAcademicYears(List<dynamic> academicYears) async {
    try {
      final jsonData = jsonEncode(academicYears);
      await _prefs.setString(_academicYearsKey, jsonData);
      await _updateLastFetchTime(_academicYearsKey);
      
      debugPrint('🔍 Cache: Saved ${academicYears.length} academic years to cache');
    } catch (e) {
      debugPrint('🔍 Cache error: Failed to save academic years: $e');
    }
  }
  
  /// Get academic years from cache
  Future<List<dynamic>?> getAcademicYears() async {
    try {
      if (!_isCacheValid(_academicYearsKey, _academicYearsCacheExpiration)) {
        debugPrint('🔍 Cache: Academic years cache expired or not found');
        return null;
      }
      
      final jsonData = _prefs.getString(_academicYearsKey);
      if (jsonData == null) return null;
      
      final List<dynamic> academicYears = jsonDecode(jsonData);
      debugPrint('🔍 Cache: Retrieved ${academicYears.length} academic years from cache');
      return academicYears;
    } catch (e) {
      debugPrint('🔍 Cache error: Failed to get academic years: $e');
      return null;
    }
  }
  
  /// Clear all cached data
  Future<void> clearCache() async {
    await _prefs.remove(_todaySchedulesKey);
    await _prefs.remove(_activeSessionsKey);
    await _prefs.remove(_academicYearsKey);
    await _prefs.remove(_lastFetchTimeKey);
    debugPrint('🔍 Cache: All cache cleared');
  }
  
  /// Update last fetch time for a specific cache key
  Future<void> _updateLastFetchTime(String key) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    await _prefs.setInt('${_lastFetchTimeKey}_$key', now);
  }
  
  /// Check if cache is still valid based on expiration time
  bool _isCacheValid(String key, int expirationMinutes) {
    final lastFetchTime = _prefs.getInt('${_lastFetchTimeKey}_$key');
    if (lastFetchTime == null) return false;
    
    final now = DateTime.now().millisecondsSinceEpoch;
    final expirationTime = lastFetchTime + (expirationMinutes * 60 * 1000);
    
    return now < expirationTime;
  }
} 