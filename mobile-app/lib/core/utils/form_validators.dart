class FormValidators {
  // Validasi nama
  static String? validateName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Nama tidak boleh kosong';
    }
    if (value.length < 2) {
      return 'Nama terlalu pendek';
    }
    return null;
  }

  // Validasi email
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email tidak boleh kosong';
    }

    final emailRegExp = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegExp.hasMatch(value)) {
      return 'Format email tidak valid';
    }
    return null;
  }

  // Validasi username
  static String? validateUsername(String? value) {
    if (value == null || value.isEmpty) {
      return 'Nama pengguna tidak boleh kosong';
    }

    if (value.length < 3) {
      return 'Nama pengguna terlalu pendek';
    }
    return null;
  }

  // Validasi password
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password tidak boleh kosong';
    }

    if (value.length < 8) {
      return 'Password minimal 8 karakter';
    }

    if (!value.contains(RegExp(r'[A-Z]'))) {
      return 'Password harus mengandung huruf kapital';
    }

    if (!value.contains(RegExp(r'[0-9]'))) {
      return 'Password harus mengandung angka';
    }

    return null;
  }

  // Validasi konfirmasi password
  static String? validateConfirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Konfirmasi password tidak boleh kosong';
    }

    if (value != password) {
      return 'Password tidak cocok';
    }

    return null;
  }

  // Validasi dropdown
  static String? validateDropdown<T>(T? value) {
    if (value == null) {
      return 'Pilihan tidak boleh kosong';
    }
    return null;
  }

  // Validasi nomor telepon
  static String? validatePhoneNumber(String? value) {
    if (value == null || value.isEmpty) {
      return 'Nomor telepon tidak boleh kosong';
    }

    final phoneRegExp = RegExp(r'^[0-9]{10,13}$');
    if (!phoneRegExp.hasMatch(value)) {
      return 'Format nomor telepon tidak valid';
    }

    return null;
  }
}
