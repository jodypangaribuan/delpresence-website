import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/student_model.dart';

abstract class StudentLocalDataSource {
  /// Gets the cached [StudentComplete] which was gotten the last time
  /// the user had an internet connection.
  Future<StudentComplete?> getCachedStudentData();

  /// Caches the [StudentComplete] data
  Future<void> cacheStudentData(StudentComplete studentData);

  /// Checks if cached data exists
  Future<bool> hasCachedData();
}

class StudentLocalDataSourceImpl implements StudentLocalDataSource {
  final SharedPreferences sharedPreferences;

  StudentLocalDataSourceImpl({required this.sharedPreferences});

  static const cachedStudentKey = 'CACHED_STUDENT_DATA';
  static const lastCachedTimeKey = 'LAST_CACHED_STUDENT_TIME';

  @override
  Future<StudentComplete?> getCachedStudentData() async {
    final jsonString = sharedPreferences.getString(cachedStudentKey);
    if (jsonString != null) {
      try {
        final Map<String, dynamic> jsonMap = json.decode(jsonString);
        return StudentComplete.fromJson(jsonMap);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  @override
  Future<void> cacheStudentData(StudentComplete studentData) async {
    // Convert StudentComplete to a JSON-compatible Map
    final jsonMap = {
      'basic_info': {
        'dim_id': studentData.basicInfo.dimId,
        'user_id': studentData.basicInfo.userId,
        'user_name': studentData.basicInfo.userName,
        'nim': studentData.basicInfo.nim,
        'nama': studentData.basicInfo.nama,
        'email': studentData.basicInfo.email,
        'prodi_id': studentData.basicInfo.prodiId,
        'prodi_name': studentData.basicInfo.prodiName,
        'fakultas': studentData.basicInfo.fakultas,
        'angkatan': studentData.basicInfo.angkatan,
        'status': studentData.basicInfo.status,
        'asrama': studentData.basicInfo.asrama,
      },
      'details': {
        'nim': studentData.details.nim,
        'nama': studentData.details.nama,
        'email': studentData.details.email,
        'tempat_lahir': studentData.details.tempatLahir,
        'tgl_lahir': studentData.details.tglLahir,
        'jenis_kelamin': studentData.details.jenisKelamin,
        'alamat': studentData.details.alamat,
        'hp': studentData.details.hp,
        'prodi': studentData.details.prodi,
        'fakultas': studentData.details.fakultas,
        'sem': studentData.details.sem,
        'sem_ta': studentData.details.semTa,
        'ta': studentData.details.ta,
        'tahun_masuk': studentData.details.tahunMasuk,
        'kelas': studentData.details.kelas,
        'dosen_wali': studentData.details.dosenWali,
        'asrama': studentData.details.asrama,
        'nama_ayah': studentData.details.namaAyah,
        'nama_ibu': studentData.details.namaIbu,
        'no_hp_ayah': studentData.details.noHpAyah,
        'no_hp_ibu': studentData.details.noHpIbu,
      }
    };

    await sharedPreferences.setString(cachedStudentKey, json.encode(jsonMap));
    await sharedPreferences.setInt(
        lastCachedTimeKey, DateTime.now().millisecondsSinceEpoch);
  }

  @override
  Future<bool> hasCachedData() async {
    return sharedPreferences.containsKey(cachedStudentKey);
  }
}
