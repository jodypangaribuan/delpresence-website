import 'package:delpresence/features/schedule/data/models/schedule_model.dart';

/// CourseScheduleModel represents a course schedule with additional attendance-related properties
class CourseScheduleModel extends ScheduleModel {
  final bool? isAttendanceCompleted;
  
  CourseScheduleModel({
    required int id,
    required String courseName,
    required String lecturerName,
    required String roomName,
    required String day,
    required String startTime,
    required String endTime,
    String? status,
    required String courseCode,
    this.isAttendanceCompleted,
  }) : super(
          id: id,
          courseName: courseName,
          lecturerName: lecturerName,
          roomName: roomName,
          day: day,
          startTime: startTime,
          endTime: endTime,
          status: status,
          courseCode: courseCode,
        );
  
  /// Create a CourseScheduleModel from a ScheduleModel
  factory CourseScheduleModel.fromScheduleModel(ScheduleModel schedule, {bool? isAttendanceCompleted}) {
    return CourseScheduleModel(
      id: schedule.id,
      courseName: schedule.courseName,
      lecturerName: schedule.lecturerName,
      roomName: schedule.roomName,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status,
      courseCode: schedule.courseCode,
      isAttendanceCompleted: isAttendanceCompleted,
    );
  }
  
  /// Create a new instance with updated properties
  @override
  CourseScheduleModel copyWith({
    int? id,
    String? courseName,
    String? lecturerName,
    String? roomName,
    String? day,
    String? startTime,
    String? endTime,
    String? status,
    String? courseCode,
    bool? isAttendanceCompleted,
  }) {
    return CourseScheduleModel(
      id: id ?? this.id,
      courseName: courseName ?? this.courseName,
      lecturerName: lecturerName ?? this.lecturerName,
      roomName: roomName ?? this.roomName,
      day: day ?? this.day,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      courseCode: courseCode ?? this.courseCode,
      isAttendanceCompleted: isAttendanceCompleted ?? this.isAttendanceCompleted,
    );
  }
  
  /// Create a CourseScheduleModel from a JSON map
  factory CourseScheduleModel.fromJson(Map<String, dynamic> json) {
    return CourseScheduleModel(
      id: json['id'] as int,
      courseName: json['course_name'] as String,
      lecturerName: json['lecturer_name'] as String,
      roomName: json['room_name'] as String,
      day: json['day'] as String,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      status: json['status'] as String?,
      courseCode: json['course_code'] as String,
      isAttendanceCompleted: json['is_attendance_completed'] as bool?,
    );
  }
  
  /// Convert the model to a JSON map
  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['is_attendance_completed'] = isAttendanceCompleted;
    return json;
  }
} 