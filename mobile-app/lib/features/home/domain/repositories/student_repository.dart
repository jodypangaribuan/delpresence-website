import 'package:delpresence/core/error/failures.dart';
import 'package:delpresence/features/home/data/models/student_model.dart';
import 'package:dartz/dartz.dart';

abstract class StudentRepository {
  Future<Either<Failure, StudentComplete>> getStudentData(int userId);

  /// Returns true if using cached data (offline), false if using fresh data (online)
  Future<bool> isUsingCachedData();
}
