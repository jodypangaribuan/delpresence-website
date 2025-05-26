import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../datasources/student_local_datasource.dart';
import '../datasources/student_remote_datasource.dart';
import '../models/student_model.dart';
import '../../domain/repositories/student_repository.dart';

class StudentRepositoryImpl implements StudentRepository {
  final StudentRemoteDataSource remoteDataSource;
  final StudentLocalDataSource localDataSource;
  final NetworkInfo networkInfo;

  StudentRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, StudentComplete>> getStudentData(int userId) async {
    if (await networkInfo.isConnected) {
      try {
        final studentData = await remoteDataSource.getStudentData(userId);
        // Cache the data for offline use
        await localDataSource.cacheStudentData(studentData);
        return Right(studentData);
      } on ServerException catch (e) {
        // Try to get cached data if server fails
        final cachedData = await localDataSource.getCachedStudentData();
        if (cachedData != null) {
          return Right(cachedData);
        }
        return Left(ServerFailure(message: e.message));
      } catch (e) {
        // Try to get cached data if any other error occurs
        final cachedData = await localDataSource.getCachedStudentData();
        if (cachedData != null) {
          return Right(cachedData);
        }
        return Left(ServerFailure(message: e.toString()));
      }
    } else {
      // Try to get cached data when offline
      final cachedData = await localDataSource.getCachedStudentData();
      if (cachedData != null) {
        return Right(cachedData);
      }
      return Left(NetworkFailure(message: 'No internet connection'));
    }
  }

  @override
  Future<bool> isUsingCachedData() async {
    return !(await networkInfo.isConnected);
  }
}
