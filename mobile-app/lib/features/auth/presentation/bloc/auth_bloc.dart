import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import '../../domain/repositories/auth_repository.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;

  AuthBloc(this._authRepository) : super(AuthInitial()) {
    on<LoginEvent>(_onLogin);
    on<LogoutEvent>(_onLogout);
    on<CheckAuthStatusEvent>(_onCheckAuthStatus);
  }

  AuthRepository get repository => _authRepository;

  Future<void> _onLogin(
    LoginEvent event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());

      final response = await _authRepository.login(
        username: event.username,
        password: event.password,
      );

      if (response.success && response.data != null) {
        emit(AuthSuccess(
          user: response.data!.user,
          message: response.message,
        ));
      } else {
        if (response.message.toLowerCase().contains('authentication failed') ||
            response.message.toLowerCase().contains('invalid credentials') ||
            response.message.toLowerCase().contains('login failed') ||
            response.message.toLowerCase().contains('incorrect') ||
            response.message.toLowerCase().contains('wrong') ||
            response.message.toLowerCase().contains('401')) {
          emit(AuthError('Username atau password salah'));
        } else {
          emit(AuthError(response.message));
        }
      }
    } catch (e) {
      final errorMsg = e.toString().toLowerCase();
      if (errorMsg.contains('authentication failed') ||
          errorMsg.contains('invalid credentials') ||
          errorMsg.contains('login failed') ||
          errorMsg.contains('unauthorized') ||
          errorMsg.contains('401')) {
        emit(AuthError('Username atau password salah'));
      } else {
        emit(AuthError(e.toString()));
      }
    }
  }

  Future<void> _onLogout(
    LogoutEvent event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());

      // Get remember me state before clearing tokens
      final rememberMe = await _authRepository.getRememberMe();

      // If remember me is false, clear credentials
      if (!rememberMe) {
        await _authRepository.clearCredentials();
      }

      // Always clear tokens
      await _authRepository.clearToken();

      emit(AuthInitial());
    } catch (e) {
      debugPrint('Error during logout: $e');
      // Even if there's an error, we want to log the user out
      emit(AuthInitial());
    }
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatusEvent event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());

      // Check if user is logged in (has valid token)
      final isLoggedIn = await _authRepository.isLoggedIn();

      if (isLoggedIn) {
        // Get token to verify it's actually there
        final token = await _authRepository.getToken();

        if (token != null && token.isNotEmpty) {
          // User has a valid token in storage
          debugPrint('User is already logged in with valid token');
          emit(const AuthAuthenticated());
        } else {
          // Token is missing or empty
          debugPrint('Token missing, user is not authenticated');
          emit(AuthInitial());
        }
      } else {
        // No token or expired
        debugPrint('User is not logged in');
        emit(AuthInitial());
      }
    } catch (e) {
      debugPrint('Error checking auth status: $e');
      // If there's an error, we assume user is not authenticated
      emit(AuthInitial());
    }
  }
}
