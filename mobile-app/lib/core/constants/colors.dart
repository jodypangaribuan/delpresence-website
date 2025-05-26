import 'package:flutter/material.dart';

class AppColors {
  // Primary Color - keeping the main blue but refining the palette
  static const Color primary = Color(0xFF0687C9); // Keeping original blue
  static const Color primaryLight =
      Color(0xFF64B5FF); // Brighter, more vibrant light blue
  static const Color primaryDark =
      Color(0xFF045E8F); // Deeper, more professional dark blue

  // Secondary colors - more professional green palette
  static const Color secondary = Color(0xFF4CAF50);
  static const Color secondaryLight = Color(0xFF7BC67E);
  static const Color secondaryDark = Color(0xFF087F23);

  // Text colors - improved contrast
  static const Color textPrimary =
      Color(0xFF212121); // Darker for better readability
  static const Color textSecondary =
      Color(0xFF616161); // More professional gray
  static const Color textLight = Color(0xFFAEAEAE); // Softer light gray

  // Basic colors - refined
  static const Color black = Color(0xFF000000);
  static const Color white = Colors.white;
  static const Color grey = Color(0xFFE0E0E0); // Lighter, more subtle grey
  static const Color darkGrey =
      Color(0xFF616161); // Consistent with textSecondary

  // Background colors - more professional
  static const Color background =
      Color(0xFFF5F7FA); // Subtle blue-grey tint for background
  static const Color surface = Color(0xFFFFFFFF);
  static const Color error = Color(0xFFD32F2F); // Standard Material red

  // Status colors - more professional
  static const Color success =
      Color(0xFF43A047); // Slightly darker, more professional green
  static const Color warning = Color(0xFFFFA000); // More professional amber
  static const Color error2 = Color(0xFFE53935); // Consistent red
  static const Color info = Color(0xFF1976D2); // Standard Material blue

  // Gradient colors for primary - more professional gradient
  static List<Color> primaryGradient = [
    primary,
    Color(0xFF045E8F), // Same as primaryDark for consistency
  ];
}
