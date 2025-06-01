import 'dart:convert';
import 'package:flutter/material.dart';
import '../../data/models/face_model.dart';
import '../../data/services/face_service.dart';
import 'package:camera/camera.dart';
import '../../../../core/services/network_service.dart';

enum FaceProcessingStatus {
  idle,
  processing,
  success,
  error,
}

class FaceProvider extends ChangeNotifier {
  final FaceService _faceService;
  
  List<FaceModel> _registeredFaces = [];
  bool _isLoading = false;
  String _errorMessage = '';
  FaceProcessingStatus _status = FaceProcessingStatus.idle;
  
  FaceProvider({NetworkService? networkService}) 
      : _faceService = FaceService(networkService: networkService ?? NetworkService());

  // Getters
  List<FaceModel> get registeredFaces => _registeredFaces;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  FaceProcessingStatus get status => _status;
  
  // Load registered faces for a student
  Future<void> loadRegisteredFaces(int studentId) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();
    
    try {
      final response = await _faceService.getRegisteredFaces(studentId);
      if (response['success'] == true && response['data'] != null) {
        final List<dynamic> facesData = response['data'];
        _registeredFaces = facesData
            .map((face) => FaceModel.fromJson(face))
            .toList();
      } else {
        _errorMessage = response['message'] ?? 'Failed to load registered faces';
        _registeredFaces = [];
      }
    } catch (e) {
      _errorMessage = 'Error loading faces: $e';
      _registeredFaces = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Register a face
  Future<bool> registerFace(int studentId, XFile imageFile) async {
    _isLoading = true;
    _status = FaceProcessingStatus.processing;
    _errorMessage = '';
    notifyListeners();
    
    try {
      // Convert image to base64
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);
      
      final response = await _faceService.registerFace(studentId, base64Image);
      
      if (response['success'] == true) {
        // Reload registered faces after successful registration
        await loadRegisteredFaces(studentId);
        _status = FaceProcessingStatus.success;
        return true;
      } else {
        _errorMessage = response['message'] ?? 'Failed to register face';
        _status = FaceProcessingStatus.error;
        return false;
      }
    } catch (e) {
      _errorMessage = 'Error registering face: $e';
      _status = FaceProcessingStatus.error;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Verify a face for attendance
  Future<bool> verifyFace(int studentId, XFile imageFile) async {
    _isLoading = true;
    _status = FaceProcessingStatus.processing;
    _errorMessage = '';
    notifyListeners();
    
    try {
      // Convert image to base64
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);
      
      final response = await _faceService.verifyFace(studentId, base64Image);
      
      if (response['success'] == true) {
        _status = FaceProcessingStatus.success;
        return true;
      } else {
        _errorMessage = response['message'] ?? 'Face verification failed';
        _status = FaceProcessingStatus.error;
        return false;
      }
    } catch (e) {
      _errorMessage = 'Error during face verification: $e';
      _status = FaceProcessingStatus.error;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Delete a registered face
  Future<bool> deleteFace(int studentId, String embeddingId) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();
    
    try {
      final response = await _faceService.deleteFace(studentId, embeddingId);
      
      if (response['success'] == true) {
        // Reload registered faces after successful deletion
        await loadRegisteredFaces(studentId);
        return true;
      } else {
        _errorMessage = response['message'] ?? 'Failed to delete face';
        return false;
      }
    } catch (e) {
      _errorMessage = 'Error deleting face: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Reset status
  void resetStatus() {
    _status = FaceProcessingStatus.idle;
    _errorMessage = '';
    notifyListeners();
  }
} 