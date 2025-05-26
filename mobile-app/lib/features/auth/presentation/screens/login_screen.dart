import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/constants/sizes.dart';
import '../widgets/login_form_section.dart';
import '../widgets/login_header_section.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({Key? key}) : super(key: key);

  // Method untuk menutup keyboard
  void _unfocusKeyboard(BuildContext context) {
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    // Set status bar color to match app theme
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );

    // Get screen dimensions for responsive sizing
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return GestureDetector(
      // Menutup keyboard saat tap di area kosong
      onTap: () => _unfocusKeyboard(context),
      child: Scaffold(
        // Remove background color to allow SVG to be visible everywhere
        backgroundColor: Colors.transparent,
        // Remove AppBar to allow background to extend to the top
        extendBodyBehindAppBar: true,
        appBar: PreferredSize(
          preferredSize: Size.fromHeight(0),
          child: AppBar(
            elevation: 0,
            backgroundColor: Colors.transparent,
            systemOverlayStyle: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.dark,
            ),
          ),
        ),
        // Full screen Stack directly in the body, without SafeArea
        body: Stack(
          fit: StackFit.expand,
          children: [
            // Background SVG to cover the entire screen including status bar
            Positioned.fill(
              child: Image.asset(
                'assets/images/background/login-background.png',
                width: screenWidth,
                height: screenHeight,
                fit: BoxFit.cover,
              ),
            ),

            // Content - inside SafeArea for proper padding
            SafeArea(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: GestureDetector(
                  onTap: () => _unfocusKeyboard(context),
                  child: Container(
                    padding: const EdgeInsets.all(AppSizes.defaultSpace),
                    color: Colors.transparent,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Add some top spacing
                        const SizedBox(height: AppSizes.spaceBtwSections),

                        // Header Section
                        const LoginHeaderSection(),

                        // Form Section
                        const LoginFormSection(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
