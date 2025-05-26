import 'package:delpresence/core/error/failures.dart';
import 'package:delpresence/features/home/data/models/student_model.dart';
import 'package:dartz/dartz.dart';

abstract class StudentRepository {
  Future<Either<Failure, StudentComplete>> getStudentData(int userId);
}
