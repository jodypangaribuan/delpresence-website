import 'package:flutter/material.dart';
import '../../../../core/constants/colors.dart';
import 'face_recognition_attendance_screen.dart';

class CourseSelectionScreen extends StatelessWidget {
  const CourseSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Demo courses - Pemrograman Mobile can be selected multiple times
    final courses = [
      {
        'title': 'Pemrograman Mobile',
        'time': '08:00 - 10:30',
        'room': 'Ruang 516',
        'lecturer': 'Tegar Arifin Prasetyo, S.Si., M.Si.',
        'status': 'Dapat Diabsen Berkali-kali (Demo)',
        'isActive': true,
      },
      {
        'title': 'Basis Data',
        'time': '13:00 - 15:30',
        'room': 'Ruang 527',
        'lecturer': 'Dr. Andi Wahju, S.Kom., M.Eng.',
        'status': 'Hanya Dapat Diabsen Sekali',
        'isActive': false,
      },
      {
        'title': 'Algoritma dan Struktur Data',
        'time': '10:30 - 13:00',
        'room': 'Ruang 512',
        'lecturer': 'Dr. Budi Santoso, S.Kom., M.Cs.',
        'status': 'Hanya Dapat Diabsen Sekali',
        'isActive': false,
      },
      {
        'title': 'Pemrograman Web',
        'time': '15:30 - 18:00',
        'room': 'Lab Komputer 2',
        'lecturer': 'Dr. Citra Dewi, S.Kom., M.T.',
        'status': 'Hanya Dapat Diabsen Sekali',
        'isActive': false,
      },
      {
        'title': 'Interaksi Manusia dan Komputer',
        'time': '07:30 - 10:00',
        'room': 'Ruang 520',
        'lecturer': 'Dr. Dian Pratiwi, S.Kom., M.M.',
        'status': 'Hanya Dapat Diabsen Sekali',
        'isActive': false,
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Pilih Mata Kuliah',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Absensi Face Recognition',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Pilih mata kuliah untuk melakukan absensi',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),

          // Course list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: courses.length,
              itemBuilder: (context, index) {
                final course = courses[index];
                final bool isPemrogramanMobile =
                    course['title'] == 'Pemrograman Mobile';

                return GestureDetector(
                  onTap: isPemrogramanMobile
                      ? () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  FaceRecognitionAttendanceScreen(
                                courseName: course['title'] as String,
                              ),
                            ),
                          );
                        }
                      : null, // Disable tap for non-Pemrograman Mobile courses
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: isPemrogramanMobile
                          ? Colors.white
                          : Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          offset: const Offset(0, 1),
                          blurRadius: 3,
                          spreadRadius: 0,
                        ),
                      ],
                      border: Border.all(
                        color: isPemrogramanMobile
                            ? AppColors.primary.withOpacity(0.3)
                            : Colors.grey.withOpacity(0.1),
                        width: isPemrogramanMobile ? 1.5 : 1,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  course['title'] as String,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: isPemrogramanMobile
                                        ? AppColors.textPrimary
                                        : AppColors.textSecondary,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isPemrogramanMobile
                                      ? AppColors.success.withOpacity(0.08)
                                      : Colors.grey.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  isPemrogramanMobile
                                      ? 'Demo'
                                      : 'Tidak Tersedia',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w500,
                                    color: isPemrogramanMobile
                                        ? AppColors.success
                                        : AppColors.textSecondary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(
                                Icons.access_time_rounded,
                                size: 12,
                                color: AppColors.textSecondary,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                course['time'] as String,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Icon(
                                Icons.location_on_outlined,
                                size: 12,
                                color: AppColors.textSecondary,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                course['room'] as String,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              Icon(
                                Icons.person_outline,
                                size: 12,
                                color: AppColors.textSecondary,
                              ),
                              const SizedBox(width: 3),
                              Expanded(
                                child: Text(
                                  course['lecturer'] as String,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textSecondary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          const Divider(
                              height: 1,
                              thickness: 1,
                              color: Color(0xFFEEEEEE)),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: isPemrogramanMobile
                                  ? () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              FaceRecognitionAttendanceScreen(
                                            courseName:
                                                course['title'] as String,
                                          ),
                                        ),
                                      );
                                    }
                                  : null, // Disable button for non-Pemrograman Mobile courses
                              style: ElevatedButton.styleFrom(
                                foregroundColor: Colors.white,
                                backgroundColor: isPemrogramanMobile
                                    ? AppColors.primary
                                    : Colors.grey.withOpacity(0.3),
                                disabledBackgroundColor:
                                    Colors.grey.withOpacity(0.3),
                                disabledForegroundColor:
                                    Colors.white.withOpacity(0.5),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 8),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              child: Text(
                                isPemrogramanMobile
                                    ? 'Absen Sekarang'
                                    : 'Tidak Tersedia',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
