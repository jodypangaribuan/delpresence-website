import 'user_model.dart';

class LectureModel {
  final int id;
  final int userId;
  final UserModel user;
  final String nip;
  final String position;

  LectureModel({
    required this.id,
    required this.userId,
    required this.user,
    required this.nip,
    required this.position,
  });

  factory LectureModel.fromJson(Map<String, dynamic> json) {
    try {
      return LectureModel(
        id: json['id'] as int,
        userId: json['user_id'] as int,
        user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
        nip: json['nip'] as String,
        position: json['position'] as String,
      );
    } catch (e) {
      print('Error parsing LectureModel: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'user': user.toJson(),
      'nip': nip,
      'position': position,
    };
  }
}
