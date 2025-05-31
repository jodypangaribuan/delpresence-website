import 'package:flutter/material.dart';
import '../../../../core/constants/colors.dart';

class ScheduleHeader extends StatefulWidget {
  final String title;

  const ScheduleHeader({
    super.key,
    required this.title,
  });

  @override
  State<ScheduleHeader> createState() => _ScheduleHeaderState();
}

class _ScheduleHeaderState extends State<ScheduleHeader> {
  bool _headerImageLoadError = false;
  
  // Create box decoration with or without background image
  BoxDecoration _createHeaderDecoration() {
    // Base decoration without image
    final decoration = BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          AppColors.primaryDark,
          AppColors.primary,
        ],
        stops: const [0.0, 1.0],
      ),
      borderRadius: BorderRadius.zero,
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.2),
          blurRadius: 10,
          spreadRadius: 0,
          offset: const Offset(0, 3),
        ),
      ],
    );
    
    // Add image only if no error has occurred
    if (!_headerImageLoadError) {
      return decoration.copyWith(
        image: DecorationImage(
          image: const AssetImage(
              'assets/images/background/background-header.png'),
          fit: BoxFit.cover,
          opacity: 0.85,
          onError: (exception, stackTrace) {
            debugPrint('Error loading header background: $exception');
            setState(() {
              _headerImageLoadError = true;
            });
          },
        ),
      );
    }
    
    return decoration;
  }

  @override
  Widget build(BuildContext context) {
    // Get the status bar height to ensure proper covering
    final statusBarHeight = MediaQuery.of(context).padding.top;

    return Container(
      height: 120, // Smaller than the home header
      margin: const EdgeInsets.only(bottom: 0),
      child: Stack(
        clipBehavior: Clip.none, // Important for shadow to be visible
        children: [
          // Background container with decoration and direct color
          Positioned(
            top: -statusBarHeight, // Still extend up to cover status bar
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              decoration: _createHeaderDecoration(),
              child: Stack(
                children: [
                  // Bottom decoration - subtle light effect
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 15,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.white.withOpacity(0.0),
                            Colors.white.withOpacity(0.2),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Title and back button
          Positioned(
            top: 40 + statusBarHeight * 0.3,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  // Back button
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.arrow_back,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),

                  const SizedBox(width: 16),

                  // Title
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.2,
                        shadows: [
                          BoxShadow(
                            color: Colors.black45,
                            blurRadius: 2,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
