class ApiConstants {
  // Base API URL for main backend services
  static const String baseUrl = 'http://10.0.2.2:5000';
  
  // Face recognition service URL - use your computer's actual local IP address
  // ⚠️ IMPORTANT: Replace 192.168.X.X with your development machine's actual IP address
  static const String faceRecognitionUrl = 'http://192.168.241.230:5000';
  
  // Alternatively, use ngrok for testing over the internet
  // static const String faceRecognitionUrl = 'https://your-ngrok-url.ngrok-free.app';
  
  // For development
  // static const String baseUrl = 'http://10.0.2.2:5000'; // For Android emulator
  // static const String baseUrl = 'http://localhost:5000'; // For iOS simulator
} 