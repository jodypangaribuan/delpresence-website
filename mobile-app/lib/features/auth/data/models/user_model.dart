class UserModel {
  final int id;
  final String firstName;
  final String? middleName;
  final String? lastName;
  final String email;
  final String userType;
  final bool verified;

  UserModel({
    required this.id,
    required this.firstName,
    this.middleName,
    this.lastName,
    required this.email,
    required this.userType,
    required this.verified,
  });

  String get fullName {
    final parts = [firstName];
    if (middleName != null && middleName!.isNotEmpty) {
      parts.add(middleName!);
    }
    if (lastName != null && lastName!.isNotEmpty) {
      parts.add(lastName!);
    }
    return parts.join(' ');
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    try {
      return UserModel(
        id: json['id'] as int,
        firstName: json['first_name'] as String,
        middleName: json['middle_name'] as String?,
        lastName: json['last_name'] as String?,
        email: json['email'] as String,
        userType: json['user_type'] as String,
        verified: json['verified'] as bool,
      );
    } catch (e) {
      print('Error parsing UserModel: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'middle_name': middleName,
      'last_name': lastName,
      'email': email,
      'user_type': userType,
      'verified': verified,
    };
  }
}
