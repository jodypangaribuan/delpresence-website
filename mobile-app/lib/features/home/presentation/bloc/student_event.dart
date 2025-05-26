part of 'student_bloc.dart';

abstract class StudentEvent extends Equatable {
  const StudentEvent();

  @override
  List<Object> get props => [];
}

class LoadStudentDataEvent extends StudentEvent {
  const LoadStudentDataEvent();
}
