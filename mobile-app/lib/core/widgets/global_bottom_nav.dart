import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:animated_bottom_navigation_bar/animated_bottom_navigation_bar.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../constants/colors.dart';

class GlobalBottomNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const GlobalBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Theme colors from app colors
    final backgroundColor = Colors.white;
    final accentColor = AppColors.primary;
    final inactiveColor = AppColors.textSecondary;

    // Calculate active index for the AnimatedBottomNavigationBar
    // Since our original navigation has 5 items with the center button in the middle,
    // we need to adjust the index for the AnimatedBottomNavigationBar which will have 4 items
    final activeIndex = currentIndex < 2 ? currentIndex : currentIndex - 1;

    // Use the animated_bottom_navigation_bar to achieve a clean implementation with FloatingActionButton
    return AnimatedBottomNavigationBar.builder(
      itemCount: 4, // 4 items excluding the center button
      tabBuilder: (int index, bool isActive) {
        // Get the appropriate SVG icon based on the index
        // and adjust indices for the gap in the middle
        final iconPath = _getIconPath(index < 2 ? index : index + 1);

        return Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SvgPicture.asset(
              iconPath,
              width: 24,
              height: 24,
              colorFilter: ColorFilter.mode(
                isActive ? accentColor : inactiveColor,
                BlendMode.srcIn,
              ),
            ),
            const SizedBox(height: 4),
            // Added text labels for better UX
            Text(
              _getLabel(index < 2 ? index : index + 1),
              style: TextStyle(
                color: isActive ? accentColor : inactiveColor,
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        );
      },
      activeIndex: activeIndex,
      gapLocation: GapLocation.center,
      notchSmoothness: NotchSmoothness.verySmoothEdge,
      leftCornerRadius: 24,
      rightCornerRadius: 24,
      backgroundColor: backgroundColor,
      elevation: 12,
      height: 75, // Increased height slightly for better touch targets
      splashColor: accentColor.withOpacity(0.1),
      shadow: BoxShadow(
        color: Colors.black.withOpacity(0.08),
        blurRadius: 10,
        spreadRadius: 0,
        offset: const Offset(0, -1),
      ),
      onTap: (index) {
        // Convert the AnimatedBottomNavigationBar index back to your app's navigation index
        // to account for the center button at index 2
        int actualIndex = index < 2 ? index : index + 1;

        // Add haptic feedback for better user experience
        HapticFeedback.lightImpact();

        onTap(actualIndex);
      },
    );
  }

  // Helper method to get SVG icon path based on index
  String _getIconPath(int index) {
    switch (index) {
      case 0:
        return 'assets/icons/home-navbar.svg';
      case 1:
        return 'assets/icons/schedule-navbar.svg';
      case 2: // Center button (handled by FloatingActionButton)
        return 'assets/icons/search-navbar.svg';
      case 3:
        return 'assets/icons/history-navbar.svg';
      case 4:
        return 'assets/icons/profile-navbar.svg';
      default:
        return 'assets/icons/home-navbar.svg';
    }
  }

  // Helper method to get label text based on index
  String _getLabel(int index) {
    switch (index) {
      case 0:
        return 'Beranda';
      case 1:
        return 'Jadwal';
      case 2:
        return 'Pindai';
      case 3:
        return 'Riwayat';
      case 4:
        return 'Profil';
      default:
        return '';
    }
  }
}
