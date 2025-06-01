import 'package:flutter/foundation.dart';

/// AuthProvider manages authentication state for the app
class AuthProvider extends ChangeNotifier {
  int? _userId;
  String? _token;
  String? _username;
  String? _userType;

  // Constructor that accepts an optional auth repository
  AuthProvider({dynamic authRepository});

  int? get userId => _userId;
  String? get token => _token;
  String? get username => _username;
  String? get userType => _userType;
  bool get isAuthenticated => _token != null;

  void setAuthData({
    required int userId,
    required String token,
    required String username,
    required String userType,
  }) {
    _userId = userId;
    _token = token;
    _username = username;
    _userType = userType;
    notifyListeners();
  }

  void logout() {
    _userId = null;
    _token = null;
    _username = null;
    _userType = null;
    notifyListeners();
  }
} 