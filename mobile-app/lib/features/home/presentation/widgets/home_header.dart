import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/utils/toast_utils.dart';
import '../bloc/student_bloc.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({
    super.key,
  });

  String _getInitials(String fullName) {
    final nameParts = fullName.split(' ');
    if (nameParts.isEmpty) return '';
    if (nameParts.length == 1) return nameParts[0][0];
    return nameParts[0][0] + nameParts[1][0];
  }

  @override
  Widget build(BuildContext context) {
    // Get the screen width to make responsive calculations
    final screenWidth = MediaQuery.of(context).size.width;
    final avatarSize = screenWidth * 0.15; // 15% of screen width
    final horizontalPadding = screenWidth * 0.05; // 5% of screen width

    // Get the status bar height to ensure proper covering
    final statusBarHeight = MediaQuery.of(context).padding.top;

    return BlocBuilder<StudentBloc, StudentState>(
      builder: (context, state) {
        String studentName = 'Loading...';
        String programName = 'Loading...';
        String studentNim = 'Loading...';

        if (state is StudentLoaded) {
          studentName = state.student.basicInfo.nama;
          programName = state.student.basicInfo.prodiName;
          studentNim = state.student.basicInfo.nim;
        } else if (state is StudentError) {
          studentName = 'Error loading data';
          programName = 'Please try again';
          studentNim = '';
        }

        return Container(
          height: 170, // Keep original height
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
                  decoration: BoxDecoration(
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
                    image: const DecorationImage(
                      image: AssetImage(
                          'assets/images/background/background-header.png'),
                      fit: BoxFit.cover,
                      opacity:
                          0.85, // Slightly reduced opacity for better text contrast
                    ),
                  ),
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

              // Content container positioned relative to header
              Positioned(
                top: 40 +
                    statusBarHeight *
                        0.3, // Adjusted for different status bar heights
                left: horizontalPadding,
                right: horizontalPadding,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Avatar
                    Container(
                      width: avatarSize,
                      height: avatarSize,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        border: Border.all(
                          color: Colors.white,
                          width: 2.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 8,
                            spreadRadius: 0,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.network(
                          state is StudentLoaded
                              ? 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=${Uri.encodeComponent(state.student.basicInfo.nama)}'
                              : 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=User',
                          fit: BoxFit.cover,
                          width: avatarSize,
                          height: avatarSize,
                          errorBuilder: (context, error, stackTrace) {
                            // If image fails to load, show initials
                            final initials = state is StudentLoaded
                                ? _getInitials(state.student.basicInfo.nama)
                                : 'S';
                            return CircleAvatar(
                              radius: avatarSize / 2,
                              backgroundColor: Colors.grey[300],
                              child: Text(
                                initials,
                                style: TextStyle(
                                  fontSize: avatarSize * 0.4,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),

                    const SizedBox(width: 15),

                    // User information with notification icon in the same row
                    Expanded(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // User info in column
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Selamat Datang,',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.95),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w400,
                                    letterSpacing: 0.2,
                                    shadows: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.25),
                                        blurRadius: 2,
                                        offset: const Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  studentName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.1,
                                    shadows: [
                                      BoxShadow(
                                        color: Color(0xFF000000),
                                        blurRadius: 2,
                                        offset: Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  programName,
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.95),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    letterSpacing: 0.1,
                                    shadows: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.3),
                                        blurRadius: 2,
                                        offset: const Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  studentNim,
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.9),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w400,
                                    letterSpacing: 0.1,
                                    shadows: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.25),
                                        blurRadius: 2,
                                        offset: const Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Notification bell icon moved to align with "Selamat Datang"
                          Padding(
                            padding: const EdgeInsets.only(right: 6, top: 0),
                            child: GestureDetector(
                              onTap: () {
                                // Handle notification tap
                                ToastUtils.showInfoToast(context, 'Notifikasi');
                              },
                              child: SvgPicture.asset(
                                'assets/icons/bell.svg',
                                width: 26,
                                height: 26,
                                colorFilter: const ColorFilter.mode(
                                  Colors.white,
                                  BlendMode.srcIn,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
