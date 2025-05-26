import 'user_model.dart';

class StudentModel {
  final int id;
  final int userId;
  final UserModel user;
  final String nim;
  final String major;
  final String faculty;
  final String batch;

  StudentModel({
    required this.id,
    required this.userId,
    required this.user,
    required this.nim,
    required this.major,
    required this.faculty,
    required this.batch,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    try {
      return StudentModel(
        id: json['id'] as int,
        userId: json['user_id'] as int,
        user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
        nim: json['nim'] as String,
        major: json['major'] as String,
        faculty: json['faculty'] as String,
        batch: json['batch'] as String,
      );
    } catch (e) {
      print('Error parsing StudentModel: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'user': user.toJson(),
      'nim': nim,
      'major': major,
      'faculty': faculty,
      'batch': batch,
    };
  }
}
