import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;
import 'package:tflite_flutter/tflite_flutter.dart';

class FaceRecognitionUtil {
  static final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableContours: false,
      enableClassification: false,
      performanceMode: FaceDetectorMode.accurate,
    ),
  );
  
  static Interpreter? _interpreter;
  static const int inputSize = 112;
  
  // Singleton pattern
  static final FaceRecognitionUtil _instance = FaceRecognitionUtil._internal();
  
  factory FaceRecognitionUtil() => _instance;
  
  FaceRecognitionUtil._internal();
  
  /// Initialize the MobileFaceNet model
  Future<void> initModel() async {
    try {
      if (_interpreter == null) {
        debugPrint('🧠 Loading MobileFaceNet model...');
        final interpreterOptions = InterpreterOptions()..threads = 2;
        _interpreter = await Interpreter.fromAsset(
          'assets/models/mobilefacenet.tflite',
          options: interpreterOptions,
        );
        debugPrint('🧠 Model loaded successfully!');
      }
    } catch (e) {
      debugPrint('🧠 Error loading model: $e');
      rethrow;
    }
  }
  
  /// Detect faces in an image and return the bounding box of the first face
  Future<Rect?> detectFace(String imagePath) async {
    try {
      // Create input image from file
      final inputImage = InputImage.fromFilePath(imagePath);
      final faces = await _faceDetector.processImage(inputImage);
      
      if (faces.isEmpty) {
        debugPrint('👤 No faces detected');
        return null;
      }
      
      // Return the bounding box of the first detected face
      return faces.first.boundingBox;
    } catch (e) {
      debugPrint('👤 Error detecting face: $e');
      rethrow;
    }
  }
  
  /// Crop face from image based on bounding box
  Future<img.Image?> cropFace(String imagePath, Rect boundingBox) async {
    try {
      final imageBytes = await File(imagePath).readAsBytes();
      final image = img.decodeImage(imageBytes);
      
      if (image == null) {
        debugPrint('🖼️ Error decoding image');
        return null;
      }
      
      // Ensure bounding box is within image bounds
      final x = max(0, boundingBox.left.toInt());
      final y = max(0, boundingBox.top.toInt());
      final width = min(image.width - x, boundingBox.width.toInt());
      final height = min(image.height - y, boundingBox.height.toInt());
      
      // Crop the face region
      final croppedFace = img.copyCrop(
        image,
        x: x,
        y: y,
        width: width,
        height: height,
      );
      
      debugPrint('🖼️ Face cropped successfully!');
      return croppedFace;
    } catch (e) {
      debugPrint('🖼️ Error cropping face: $e');
      return null;
    }
  }
  
  /// Preprocess the face image for the model
  Float32List preprocessImage(img.Image faceImage) {
    // Resize to model input size (112x112)
    final resized = img.copyResize(
      faceImage,
      width: inputSize,
      height: inputSize,
      interpolation: img.Interpolation.linear,
    );
    
    // Normalize pixel values to [-1, 1]
    final inputBuffer = Float32List(inputSize * inputSize * 3);
    var index = 0;
    
    for (var y = 0; y < inputSize; y++) {
      for (var x = 0; x < inputSize; x++) {
        final pixel = resized.getPixel(x, y);
        
        // Extract RGB values - using image package v4.x API
        final r = pixel.r;
        final g = pixel.g;
        final b = pixel.b;
        
        // Normalize to [-1, 1]
        inputBuffer[index++] = (r / 127.5) - 1;
        inputBuffer[index++] = (g / 127.5) - 1;
        inputBuffer[index++] = (b / 127.5) - 1;
      }
    }
    
    return inputBuffer;
  }
  
  /// Extract face embedding using MobileFaceNet
  Future<List<double>> extractEmbedding(Float32List preprocessedImage) async {
    try {
      if (_interpreter == null) {
        await initModel();
      }
      
      // Reshape input to match model requirements [1, 112, 112, 3]
      final input = preprocessedImage.reshape([1, inputSize, inputSize, 3]);
      
      // Output buffer for the 128-dimension embedding
      final output = List<double>.filled(128, 0).reshape([1, 128]);
      
      // Run model inference
      _interpreter!.run(input, output);
      
      // Get the embedding as a 1D List
      final embedding = List<double>.from(output[0]);
      
      // Normalize the embedding (L2 normalization)
      return _l2Normalize(embedding);
    } catch (e) {
      debugPrint('🧠 Error extracting embedding: $e');
      rethrow;
    }
  }
  
  /// L2 normalization of the embedding vector
  List<double> _l2Normalize(List<double> embedding) {
    // Calculate the squared sum
    double squaredSum = 0.0;
    for (final value in embedding) {
      squaredSum += value * value;
    }
    
    // Calculate L2 norm
    final norm = sqrt(squaredSum);
    
    // Normalize
    if (norm > 0) {
      for (var i = 0; i < embedding.length; i++) {
        embedding[i] = embedding[i] / norm;
      }
    }
    
    return embedding;
  }
  
  /// Process an image file to get face embedding
  Future<List<double>?> processImageForEmbedding(String imagePath) async {
    try {
      debugPrint('🔍 Processing image for embedding...');
      
      // Step 1: Detect face
      final boundingBox = await detectFace(imagePath);
      if (boundingBox == null) {
        debugPrint('👤 No face detected for embedding extraction');
        return null;
      }
      
      // Step 2: Crop face
      final croppedFace = await cropFace(imagePath, boundingBox);
      if (croppedFace == null) {
        debugPrint('🖼️ Failed to crop face for embedding extraction');
        return null;
      }
      
      // Step 3: Preprocess image
      final preprocessed = preprocessImage(croppedFace);
      
      // Step 4: Extract embedding
      final embedding = await extractEmbedding(preprocessed);
      
      debugPrint('🧠 Embedding extraction successful!');
      return embedding;
    } catch (e) {
      debugPrint('🧠 Error in embedding extraction pipeline: $e');
      return null;
    }
  }
  
  /// Dispose resources when done
  void dispose() {
    _faceDetector.close();
    _interpreter?.close();
    debugPrint('🧠 Face recognition resources released');
  }
} 