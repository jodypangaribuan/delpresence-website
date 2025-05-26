import '../../data/models/auth_response_model.dart';

abstract class AuthRepository {
  Future<AuthResponseModel> login({
    required String username,
    required String password,
  });

  Future<void> saveToken(String token);

  Future<String?> getToken();

  Future<void> clearToken();

  Future<bool> isLoggedIn();

  // Remember me functionality
  Future<void> saveCredentials(String username, String password, bool remember);

  Future<Map<String, String>?> getSavedCredentials();

  Future<bool> getRememberMe();

  Future<void> clearCredentials();
}
