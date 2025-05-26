class StudentInfo {
  final int dimId;
  final int userId;
  final String userName;
  final String nim;
  final String nama;
  final String email;
  final int prodiId;
  final String prodiName;
  final String fakultas;
  final int angkatan;
  final String status;
  final String asrama;

  StudentInfo({
    required this.dimId,
    required this.userId,
    required this.userName,
    required this.nim,
    required this.nama,
    required this.email,
    required this.prodiId,
    required this.prodiName,
    required this.fakultas,
    required this.angkatan,
    required this.status,
    required this.asrama,
  });

  factory StudentInfo.fromJson(Map<String, dynamic> json) {
    return StudentInfo(
      dimId: json['dim_id'] ?? 0,
      userId: json['user_id'] ?? 0,
      userName: json['user_name'] ?? '',
      nim: json['nim'] ?? '',
      nama: json['nama'] ?? '',
      email: json['email'] ?? '',
      prodiId: json['prodi_id'] ?? 0,
      prodiName: json['prodi_name'] ?? '',
      fakultas: json['fakultas'] ?? '',
      angkatan: json['angkatan'] ?? 0,
      status: json['status'] ?? '',
      asrama: json['asrama'] ?? '',
    );
  }
}

class StudentDetail {
  final String nim;
  final String nama;
  final String email;
  final String tempatLahir;
  final String tglLahir;
  final String jenisKelamin;
  final String alamat;
  final String hp;
  final String prodi;
  final String fakultas;
  final int sem;
  final int semTa;
  final String ta;
  final int tahunMasuk;
  final String kelas;
  final String dosenWali;
  final String asrama;
  final String namaAyah;
  final String namaIbu;
  final String noHpAyah;
  final String noHpIbu;

  StudentDetail({
    required this.nim,
    required this.nama,
    required this.email,
    required this.tempatLahir,
    required this.tglLahir,
    required this.jenisKelamin,
    required this.alamat,
    required this.hp,
    required this.prodi,
    required this.fakultas,
    required this.sem,
    required this.semTa,
    required this.ta,
    required this.tahunMasuk,
    required this.kelas,
    required this.dosenWali,
    required this.asrama,
    required this.namaAyah,
    required this.namaIbu,
    required this.noHpAyah,
    required this.noHpIbu,
  });

  factory StudentDetail.fromJson(Map<String, dynamic> json) {
    return StudentDetail(
      nim: json['nim'] ?? '',
      nama: json['nama'] ?? '',
      email: json['email'] ?? '',
      tempatLahir: json['tempat_lahir'] ?? '',
      tglLahir: json['tgl_lahir'] ?? '',
      jenisKelamin: json['jenis_kelamin'] ?? '',
      alamat: json['alamat'] ?? '',
      hp: json['hp'] ?? '',
      prodi: json['prodi'] ?? '',
      fakultas: json['fakultas'] ?? '',
      sem: json['sem'] ?? 0,
      semTa: json['sem_ta'] ?? 0,
      ta: json['ta'] ?? '',
      tahunMasuk: json['tahun_masuk'] ?? 0,
      kelas: json['kelas'] ?? '',
      dosenWali: json['dosen_wali'] ?? '',
      asrama: json['asrama'] ?? '',
      namaAyah: json['nama_ayah'] ?? '',
      namaIbu: json['nama_ibu'] ?? '',
      noHpAyah: json['no_hp_ayah'] ?? '',
      noHpIbu: json['no_hp_ibu'] ?? '',
    );
  }
}

class StudentComplete {
  final StudentInfo basicInfo;
  final StudentDetail details;

  StudentComplete({
    required this.basicInfo,
    required this.details,
  });

  factory StudentComplete.fromJson(Map<String, dynamic> json) {
    // Check if we have the nested structure or the flat structure
    if (json.containsKey('basic_info') && json.containsKey('details')) {
      // Old format with nested objects
      return StudentComplete(
        basicInfo: StudentInfo.fromJson(json['basic_info']),
        details: StudentDetail.fromJson(json['details']),
      );
    } else {
      // New format with flat object - convert to StudentInfo and create a default StudentDetail
      return StudentComplete(
        basicInfo: StudentInfo(
          dimId: json['dim_id'] ?? 0,
          userId: json['user_id'] ?? 0,
          userName: json['user_name'] ?? '',
          nim: json['nim'] ?? '',
          nama: json['full_name'] ?? '', // Map full_name to nama
          email: json['email'] ?? '',
          prodiId:
              json['study_program_id'] ?? 0, // Map study_program_id to prodiId
          prodiName:
              json['study_program'] ?? '', // Map study_program to prodiName
          fakultas: json['faculty'] ?? '', // Map faculty to fakultas
          angkatan: json['year_enrolled'] ?? 0, // Map year_enrolled to angkatan
          status: json['status'] ?? '',
          asrama: json['dormitory'] ?? '', // Map dormitory to asrama
        ),
        details: StudentDetail(
          nim: json['nim'] ?? '',
          nama: json['full_name'] ?? '',
          email: json['email'] ?? '',
          tempatLahir:
              '', // Default value - this data isn't available in the new API response
          tglLahir: '',
          jenisKelamin: '',
          alamat: '',
          hp: '',
          prodi: json['study_program'] ?? '',
          fakultas: json['faculty'] ?? '',
          sem: 0, // Default value
          semTa: 0,
          ta: '',
          tahunMasuk: json['year_enrolled'] ?? 0,
          kelas: '',
          dosenWali: '',
          asrama: json['dormitory'] ?? '',
          namaAyah: '',
          namaIbu: '',
          noHpAyah: '',
          noHpIbu: '',
        ),
      );
    }
  }
}
