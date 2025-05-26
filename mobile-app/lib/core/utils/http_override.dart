import 'dart:io';

/// Kelas ini memungkinkan aplikasi untuk mengabaikan validasi sertifikat SSL
/// Hanya gunakan di development, tidak untuk produksi!
class DevHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback =
          (X509Certificate cert, String host, int port) => true;
  }
}
