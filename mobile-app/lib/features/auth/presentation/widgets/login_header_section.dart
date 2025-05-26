import 'package:flutter/material.dart';
import '../../../../core/constants/sizes.dart';

class LoginHeaderSection extends StatelessWidget {
  const LoginHeaderSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Logo di tengah
        Container(
          margin: const EdgeInsets.only(bottom: AppSizes.spaceBtwItems),
          width: double.infinity,
          alignment: Alignment.center,
          child: Image.asset(
            'assets/images/logo.png',
            height: 150,
          ),
        ),

        const SizedBox(height: 32),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Selamat Datang!",
              textAlign: TextAlign.left,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF002655),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "Silahkan masuk untuk memulai presensi hari ini!",
              textAlign: TextAlign.left,
              style: TextStyle(
                fontSize: 14,
                color: Colors.black87,
                height: 1.4,
              ),
            ),
          ],
        ),

        const SizedBox(height: AppSizes.defaultSpace),
      ],
    );
  }
}
