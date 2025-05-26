part of 'student_bloc.dart';

abstract class StudentState extends Equatable {
  const StudentState();

  @override
  List<Object> get props => [];
}

class StudentInitial extends StudentState {}

class StudentLoading extends StudentState {}

class StudentLoaded extends StudentState {
  final StudentComplete student;
  final bool isUsingCachedData;

  const StudentLoaded(this.student, {this.isUsingCachedData = false});

  @override
  List<Object> get props => [student, isUsingCachedData];
}

class StudentError extends StudentState {
  final String message;

  const StudentError(this.message);

  @override
  List<Object> get props => [message];
}
