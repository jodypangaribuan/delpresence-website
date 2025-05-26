import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/colors.dart';
import '../../../../core/utils/toast_utils.dart';
import '../../data/models/student_model.dart';
import '../bloc/student_bloc.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0, // Prevents color change when scrolled
        centerTitle: true,
        title: const Text(
          'Profil Mahasiswa',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Divider(
            height: 1,
            thickness: 1,
            color: Colors.grey[200],
          ),
        ),
      ),
      body: BlocBuilder<StudentBloc, StudentState>(
        builder: (context, state) {
          if (state is StudentLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is StudentError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 80,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Terjadi kesalahan',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () {
                      context
                          .read<StudentBloc>()
                          .add(const LoadStudentDataEvent());
                    },
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            );
          } else if (state is StudentLoaded) {
            // Show toast if using cached data
            if (state.isUsingCachedData) {
              // Use a post-frame callback to ensure the context is valid
              WidgetsBinding.instance.addPostFrameCallback((_) {
                ToastUtils.showInfoToast(context,
                    'Menampilkan data yang tersimpan. Beberapa informasi mungkin tidak terbaru.');
              });
            }
            return _buildProfileContent(context, state.student);
          }

          // Default state
          return const Center(child: CircularProgressIndicator());
        },
      ),
    );
  }

  Widget _buildProfileContent(BuildContext context, StudentComplete student) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile header with avatar
          _buildProfileHeader(context, student),

          // Personal Information Section
          _buildSectionTitle('Informasi Pribadi'),
          _buildInfoItem('NIM', student.basicInfo.nim),
          _buildInfoItem('Nama Lengkap', student.basicInfo.nama),
          _buildInfoItem('Email', student.basicInfo.email),
          _buildInfoItem('Angkatan', student.basicInfo.angkatan.toString()),

          // Academic Information Section
          _buildSectionTitle('Informasi Akademik'),
          _buildInfoItem('Program Studi', student.basicInfo.prodiName),
          _buildInfoItem('Fakultas', student.basicInfo.fakultas),
          _buildInfoItem('Status', student.basicInfo.status),
          _buildInfoItem('Asrama', student.basicInfo.asrama),

          // Account Actions Section
          _buildSectionTitle('Akun'),
          _buildActionButton(
            'Keluar',
            Icons.logout_outlined,
            () {
              _showLogoutConfirmationDialog(context);
            },
            isDestructive: true,
          ),

          // Add extra padding at the bottom to prevent the logout button from being covered by bottom navigation bar
          SizedBox(height: MediaQuery.of(context).padding.bottom + 80),
        ],
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, StudentComplete student) {
    final screenWidth = MediaQuery.of(context).size.width;
    final avatarSize =
        screenWidth * 0.22; // Reduced from 25% to 22% of screen width

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20), // Reduced padding
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Avatar with initials
          Container(
            width: avatarSize,
            height: avatarSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.primary.withOpacity(0.1),
                width: 2,
              ),
              color: AppColors.primary.withOpacity(0.05),
            ),
            child: Center(
              child: Text(
                _getInitials(student.basicInfo.nama),
                style: TextStyle(
                  fontSize: avatarSize * 0.4,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          const SizedBox(height: 14), // Reduced spacing

          // Name and NIM
          Text(
            student.basicInfo.nama,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 16, // Reduced from 18
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 3), // Reduced spacing
          Text(
            student.basicInfo.nim,
            style: TextStyle(
              fontSize: 13, // Reduced from 14
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 7), // Reduced spacing

          // Program Study Pill - showing only the program without faculty
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 5), // Reduced padding
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16), // Smaller border radius
            ),
            child: Text(
              student.basicInfo.prodiName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11, // Reduced from 12
                fontWeight: FontWeight.w500,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 6), // Adjusted padding
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14, // Reduced from 16
          fontWeight: FontWeight.w600,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: 16, vertical: 10), // Reduced padding
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey[100]!,
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13, // Reduced from 14
              color: Colors.grey[600],
            ),
          ),
          Expanded(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.end,
              style: const TextStyle(
                fontSize: 13, // Reduced from 14
                fontWeight: FontWeight.w500,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String title, IconData icon, VoidCallback onTap,
      {bool isDestructive = false}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: 16, vertical: 10), // Reduced padding
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: Colors.grey[100]!,
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20, // Reduced from 22
              color: isDestructive ? Colors.red[400] : Colors.black87,
            ),
            const SizedBox(width: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 13, // Reduced from 14
                fontWeight: FontWeight.w500,
                color: isDestructive ? Colors.red[400] : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getInitials(String fullName) {
    final nameParts = fullName.split(' ');
    if (nameParts.isEmpty) return '';
    if (nameParts.length == 1) return nameParts[0][0];
    return nameParts[0][0] + nameParts[1][0];
  }

  void _showLogoutConfirmationDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 12,
                spreadRadius: 0,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon and header
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    Icons.logout_rounded,
                    color: AppColors.error,
                    size: 28,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Title
              const Text(
                'Konfirmasi Logout',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              // Content
              const Text(
                'Apakah Anda yakin ingin keluar dari aplikasi?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.normal,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              // Actions
              Row(
                children: [
                  // Cancel button
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: BorderSide(
                            color: Colors.grey.withOpacity(0.2),
                          ),
                        ),
                        backgroundColor: Colors.white,
                      ),
                      child: const Text(
                        'Batal',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Confirm button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        context.read<AuthBloc>().add(LogoutEvent());
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: AppColors.error,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Logout',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
