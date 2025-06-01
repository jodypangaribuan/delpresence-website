/// Represents authentication data stored in the app
class AuthData {
  final int userId;
  final String token;
  final String username;
  final String userType;

  AuthData({
    required this.userId,
    required this.token,
    required this.username,
    required this.userType,
  });
} 