import 'student_model.dart';
import 'lecture_model.dart';
import 'user_model.dart';

class AuthResponseModel {
  final bool success;
  final String message;
  final AuthDataModel? data;

  AuthResponseModel({
    required this.success,
    required this.message,
    this.data,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      success: json['success'] ?? false,
      message: json['message'] ?? 'Unknown response',
      data: json['data'] != null ? AuthDataModel.fromJson(json['data']) : null,
    );
  }

  factory AuthResponseModel.error(String message) {
    return AuthResponseModel(
      success: false,
      message: message,
    );
  }
}

class AuthDataModel {
  final String token;
  final UserModel user;

  AuthDataModel({
    required this.token,
    required this.user,
  });

  factory AuthDataModel.fromJson(Map<String, dynamic> json) {
    return AuthDataModel(
      token: json['token'] ?? '',
      user: UserModel.fromJson(json['user'] ?? {}),
    );
  }
}

class UserModel {
  final String id;
  final String username;
  final String name;

  UserModel({
    required this.id,
    required this.username,
    required this.name,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      username: json['username'] ?? '',
      name: json['name'] ?? '',
    );
  }
}

class TokensModel {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
  final String tokenType;

  TokensModel({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    required this.tokenType,
  });

  factory TokensModel.fromJson(Map<String, dynamic> json) {
    return TokensModel(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
      expiresIn: json['expires_in'] as int,
      tokenType: json['token_type'] as String? ?? 'Bearer',
    );
  }
}
