import 'package:get_it/get_it.dart';
import '../../features/attendance/data/repositories/attendance_repository.dart';
import '../../features/attendance/data/services/attendance_api_service.dart';
import 'network_service.dart';

final GetIt serviceLocator = GetIt.instance;

/// Initialize all service dependencies
void setupServiceLocator() {
  // Core services
  serviceLocator.registerLazySingleton<NetworkService>(() => NetworkService(
        baseUrl: 'https://api.delpresence.com', // Replace with actual API URL
        timeout: const Duration(seconds: 15),
      ));

  // API services
  serviceLocator.registerLazySingleton<AttendanceApiService>(() => 
    AttendanceApiService(networkService: serviceLocator<NetworkService>()));

  // Repositories
  serviceLocator.registerLazySingleton<AttendanceRepository>(() => 
    AttendanceRepository(apiService: serviceLocator<AttendanceApiService>()));
} 