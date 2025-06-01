import 'package:flutter/material.dart';
import 'presentation/pages/qr_scanner_page.dart';

class QRScannerRoutes {
  static const String qrScannerPage = '/qr-scanner';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case qrScannerPage:
        return MaterialPageRoute(builder: (_) => const QRScannerPage());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text('No route defined for ${settings.name}'),
            ),
          ),
        );
    }
  }
} 