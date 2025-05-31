import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import '../../data/services/face_service.dart';

enum FaceRegistrationState {
  initial, // Status awal, belum ada tindakan
  loading, // Sedang memproses
  success, // Berhasil
  error, // Gagal
}

class FaceRegistrationProvider extends ChangeNotifier {
  final FaceService _faceService;
  
  FaceRegistrationState _state = FaceRegistrationState.initial;
  String? _errorMessage;
  String? _successMessage;
  bool _hasRegisteredFace = false;
  List<Map<String, dynamic>> _registeredFaces = [];
  
  // Getters
  FaceRegistrationState get state => _state;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  bool get hasRegisteredFace => _hasRegisteredFace;
  List<Map<String, dynamic>> get registeredFaces => _registeredFaces;
  bool get isLoading => _state == FaceRegistrationState.loading;
  
  FaceRegistrationProvider({required FaceService faceService})
      : _faceService = faceService;
  
  // Reset ke status awal
  void reset() {
    _state = FaceRegistrationState.initial;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }
  
  // Mendaftarkan wajah baru
  Future<bool> registerFace(int studentId, File imageFile) async {
    try {
      _state = FaceRegistrationState.loading;
      _errorMessage = null;
      _successMessage = null;
      notifyListeners();
      
      // Konversi gambar ke base64
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);
      
      // Panggil service untuk mendaftarkan wajah
      final result = await _faceService.registerFace(studentId, base64Image);
      
      if (result['success'] == true) {
        _state = FaceRegistrationState.success;
        _successMessage = result['message'] ?? 'Wajah berhasil didaftarkan';
        _hasRegisteredFace = true;
        
        // Refresh daftar wajah yang terdaftar
        await getRegisteredFaces(studentId);
        
        notifyListeners();
        return true;
      } else {
        _state = FaceRegistrationState.error;
        _errorMessage = result['message'] ?? 'Gagal mendaftarkan wajah';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _state = FaceRegistrationState.error;
      _errorMessage = 'Error: $e';
      notifyListeners();
      return false;
    }
  }
  
  // Mendapatkan daftar wajah yang terdaftar
  Future<void> getRegisteredFaces(int studentId) async {
    try {
      _state = FaceRegistrationState.loading;
      notifyListeners();
      
      final result = await _faceService.getRegisteredFaces(studentId);
      
      if (result['success'] == true && result['data'] != null) {
        _state = FaceRegistrationState.success;
        
        final data = result['data'];
        _hasRegisteredFace = data['face_count'] > 0;
        _registeredFaces = List<Map<String, dynamic>>.from(data['faces'] ?? []);
        
        notifyListeners();
      } else {
        _state = FaceRegistrationState.error;
        _errorMessage = result['message'] ?? 'Gagal mendapatkan data wajah';
        _hasRegisteredFace = false;
        _registeredFaces = [];
        notifyListeners();
      }
    } catch (e) {
      _state = FaceRegistrationState.error;
      _errorMessage = 'Error: $e';
      _hasRegisteredFace = false;
      _registeredFaces = [];
      notifyListeners();
    }
  }
  
  // Menghapus data wajah yang terdaftar
  Future<bool> deleteFace(int studentId, String embeddingId) async {
    try {
      _state = FaceRegistrationState.loading;
      notifyListeners();
      
      final result = await _faceService.deleteFace(studentId, embeddingId);
      
      if (result['success'] == true) {
        _state = FaceRegistrationState.success;
        _successMessage = result['message'] ?? 'Wajah berhasil dihapus';
        
        // Refresh daftar wajah
        await getRegisteredFaces(studentId);
        
        notifyListeners();
        return true;
      } else {
        _state = FaceRegistrationState.error;
        _errorMessage = result['message'] ?? 'Gagal menghapus wajah';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _state = FaceRegistrationState.error;
      _errorMessage = 'Error: $e';
      notifyListeners();
      return false;
    }
  }
} 