class CourseModel {
  final String id;
  final String title;
  final String description;
  final String lecturer;
  final String semester;
  final int credits;
  final String schedule;
  final String code;
  final String academicYearName;

  CourseModel({
    required this.id,
    required this.title,
    required this.description,
    required this.lecturer,
    required this.semester,
    required this.credits,
    this.schedule = '',
    this.code = '',
    this.academicYearName = '',
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    // Helper function to safely convert values that might be int or String
    T parseValue<T>(dynamic value, T defaultValue) {
      if (value == null) return defaultValue;
      if (value is T) return value;
      
      // Handle specific type conversions
      if (T == int && value is String) {
        return int.tryParse(value) as T? ?? defaultValue;
      } else if (T == String && value is int) {
        return value.toString() as T;
      } else {
        return defaultValue;
      }
    }

    // Extract lecturer name, handling null and empty values
    String lecturerName = '';
    final rawLecturerName = json['lecturer_name'];
    if (rawLecturerName != null && 
        rawLecturerName.toString().isNotEmpty && 
        rawLecturerName.toString().toLowerCase() != 'null') {
      lecturerName = rawLecturerName.toString();
    }

    return CourseModel(
      id: parseValue<String>(json['id'] ?? json['course_id'], ''),
      title: parseValue<String>(json['title'] ?? json['course_name'], ''),
      code: parseValue<String>(json['code'] ?? json['course_code'], ''),
      description: parseValue<String>(json['description'], ''),
      lecturer: lecturerName,
      semester: parseValue<String>(json['semester'], ''),
      credits: parseValue<int>(json['credits'] ?? json['sks'], 0),
      schedule: parseValue<String>(json['schedule'], ''),
      academicYearName: parseValue<String>(json['academic_year_name'], ''),
    );
  }

  // Sample data for demonstration
  static List<CourseModel> getSampleCourses() {
    return [
      CourseModel(
        id: '1',
        title: 'Keamanan Perangkat Lunak',
        code: 'KPL-201',
        description:
            'Secara garis besar, terdapat 3 topik yang akan diberikan, yakni (1) prinsip keamanan komputer, (2) teknik keamanan, dan (3) implementasi keamanan perangkat lunak.',
        lecturer: 'Dr. Ahmad Wijaya',
        semester: 'Semester 5',
        credits: 3,
      ),
      CourseModel(
        id: '2',
        title: 'Sistem Komputasi Awan',
        code: 'SKA-301',
        description:
            'Kuliah ini menawarkan pembelajaran tingkat lanjut mengenai implementasi sebuah jaringan sistem komputasi awan dan penerapannya dalam dunia industri.',
        lecturer: 'Dr. Sarah Johnson',
        semester: 'Semester 6',
        credits: 3,
      ),
      CourseModel(
        id: '3',
        title: 'Bahasa Inggris III',
        code: 'BIG-303',
        description:
            'Mata kuliah ini bertujuan untuk mempersiapkan mahasiswa dalam mengikuti tes TOEFL ITP yang menjadi persyaratan kelulusan di universitas.',
        lecturer: 'Prof. Robert Smith',
        semester: 'Semester 3',
        credits: 2,
      ),
      CourseModel(
        id: '4',
        title: 'Pengujian Kualitas Perangkat Lunak',
        code: 'PKP-401',
        description:
            'Related to SW-Testing, this course: introduces the role/importance of software testing, presents testing techniques, and discusses test planning.',
        lecturer: 'Dr. Jessica Williams',
        semester: 'Semester 4',
        credits: 3,
      ),
      CourseModel(
        id: '5',
        title: 'Desain Pengalaman Pengguna',
        code: 'DPP-501',
        description:
            'User Experience Design bukan tentang membuat sesuai yang cantik, tetapi tentang menciptakan pengalaman yang menyeluruh bagi pengguna akhir.',
        lecturer: 'Prof. Michael Brown',
        semester: 'Semester 5',
        credits: 3,
      ),
      CourseModel(
        id: '6',
        title: 'Aljabar Linear',
        code: 'ALJ-201',
        description:
            'Aljabar Linier dan Matriks berisi bahasan bagaimana menerapkan konsep matriks dan berbagai metode penyelesaian.',
        lecturer: 'Dr. Lisa Davis',
        semester: 'Semester 2',
        credits: 3,
      ),
    ];
  }
}
