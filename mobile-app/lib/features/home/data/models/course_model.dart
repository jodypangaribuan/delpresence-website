class CourseModel {
  final String id;
  final String title;
  final String description;
  final String lecturer;
  final String semester;
  final int credits;
  final String schedule;

  CourseModel({
    required this.id,
    required this.title,
    required this.description,
    required this.lecturer,
    required this.semester,
    required this.credits,
    this.schedule = '',
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    return CourseModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      lecturer: json['lecturer'] ?? '',
      semester: json['semester'] ?? '',
      credits: json['credits'] ?? 0,
      schedule: json['schedule'] ?? '',
    );
  }

  // Sample data for demonstration
  static List<CourseModel> getSampleCourses() {
    return [
      CourseModel(
        id: '1',
        title: 'Keamanan Perangkat Lunak',
        description:
            'Secara garis besar, terdapat 3 topik yang akan diberikan, yakni (1) prinsip keamanan komputer, (2) teknik keamanan, dan (3) implementasi keamanan perangkat lunak.',
        lecturer: 'Dr. Ahmad Wijaya',
        semester: 'Semester 5',
        credits: 3,
      ),
      CourseModel(
        id: '2',
        title: 'Sistem Komputasi Awan',
        description:
            'Kuliah ini menawarkan pembelajaran tingkat lanjut mengenai implementasi sebuah jaringan sistem komputasi awan dan penerapannya dalam dunia industri.',
        lecturer: 'Dr. Sarah Johnson',
        semester: 'Semester 6',
        credits: 3,
      ),
      CourseModel(
        id: '3',
        title: 'Bahasa Inggris III',
        description:
            'Mata kuliah ini bertujuan untuk mempersiapkan mahasiswa dalam mengikuti tes TOEFL ITP yang menjadi persyaratan kelulusan di universitas.',
        lecturer: 'Prof. Robert Smith',
        semester: 'Semester 3',
        credits: 2,
      ),
      CourseModel(
        id: '4',
        title: 'Pengujian Kualitas Perangkat Lunak',
        description:
            'Related to SW-Testing, this course: introduces the role/importance of software testing, presents testing techniques, and discusses test planning.',
        lecturer: 'Dr. Jessica Williams',
        semester: 'Semester 4',
        credits: 3,
      ),
      CourseModel(
        id: '5',
        title: 'Desain Pengalaman Pengguna',
        description:
            'User Experience Design bukan tentang membuat sesuai yang cantik, tetapi tentang menciptakan pengalaman yang menyeluruh bagi pengguna akhir.',
        lecturer: 'Prof. Michael Brown',
        semester: 'Semester 5',
        credits: 3,
      ),
      CourseModel(
        id: '6',
        title: 'Aljabar Linear',
        description:
            'Aljabar Linier dan Matriks berisi bahasan bagaimana menerapkan konsep matriks dan berbagai metode penyelesaian.',
        lecturer: 'Dr. Lisa Davis',
        semester: 'Semester 2',
        credits: 3,
      ),
    ];
  }
}
