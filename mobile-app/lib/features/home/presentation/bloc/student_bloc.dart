import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import '../../domain/repositories/student_repository.dart';
import '../../data/models/student_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'student_event.dart';
part 'student_state.dart';

class StudentBloc extends Bloc<StudentEvent, StudentState> {
  final StudentRepository _studentRepository;

  StudentBloc(this._studentRepository) : super(StudentInitial()) {
    on<LoadStudentDataEvent>(_onLoadStudentData);
  }

  Future<void> _onLoadStudentData(
    LoadStudentDataEvent event,
    Emitter<StudentState> emit,
  ) async {
    try {
      emit(StudentLoading());

      // Get external user ID from shared preferences
      final prefs = await SharedPreferences.getInstance();
      final externalUserId = prefs.getInt('external_user_id');

      if (externalUserId == null) {
        emit(const StudentError('User ID not found'));
        return;
      }

      final result = await _studentRepository.getStudentData(externalUserId);

      result.fold(
        (failure) => emit(StudentError(failure.message)),
        (student) => emit(StudentLoaded(student)),
      );
    } catch (e) {
      debugPrint('Error loading student data: $e');
      emit(StudentError(e.toString()));
    }
  }
}
