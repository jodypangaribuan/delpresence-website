class FaceModel {
  final int id;
  final int studentId;
  final String embeddingId;
  final String? createdAt;

  FaceModel({
    required this.id,
    required this.studentId,
    required this.embeddingId,
    this.createdAt,
  });

  factory FaceModel.fromJson(Map<String, dynamic> json) {
    return FaceModel(
      id: json['id'] as int,
      studentId: json['student_id'] as int,
      embeddingId: json['embedding_id'] as String,
      createdAt: json['created_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'student_id': studentId,
      'embedding_id': embeddingId,
      'created_at': createdAt,
    };
  }
} 