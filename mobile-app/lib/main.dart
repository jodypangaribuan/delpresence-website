import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'package:toastification/toastification.dart';
import 'dart:io';

import 'core/theme/theme.dart';
import 'core/utils/http_override.dart';
import 'core/utils/api_logger.dart';
import 'core/network/network_info.dart';
import 'features/auth/data/datasources/auth_remote_datasource.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/home/data/datasources/student_remote_datasource.dart';
import 'features/home/data/repositories/student_repository_impl.dart';
import 'features/home/domain/repositories/student_repository.dart';
import 'features/splash/presentation/screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set HTTP overrides untuk menerima sertifikat self-signed
  HttpOverrides.global = DevHttpOverrides();

  // Configure API Logger
  ApiLogger.setEnabled(true);
  ApiLogger.setDetailedMode(true);
  ApiLogger.setColorfulLogs(true);

  // Set system UI properties immediately on app startup
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.transparent,
    ),
  );

  // Initialize SharedPreferences
  final prefs = await SharedPreferences.getInstance();

  // Create http client
  final httpClient = http.Client();

  // Create network info
  final networkInfo =
      NetworkInfoImpl(InternetConnectionChecker.createInstance());

  // Create auth data source
  final authDataSource = AuthRemoteDataSourceImpl(client: httpClient);

  // Create auth repository
  final authRepository = AuthRepositoryImpl(
    remoteDataSource: authDataSource,
    prefs: prefs,
  );

  // Create mahasiswa data source
  final studentDataSource = StudentRemoteDataSourceImpl(
    client: httpClient,
    sharedPreferences: prefs,
  );

  // Create mahasiswa repository
  final studentRepository = StudentRepositoryImpl(
    remoteDataSource: studentDataSource,
    networkInfo: networkInfo,
  );

  runApp(MyApp(
    prefs: prefs,
    httpClient: httpClient,
    authRepository: authRepository,
    studentRepository: studentRepository,
  ));
}

class MyApp extends StatelessWidget {
  final SharedPreferences prefs;
  final http.Client httpClient;
  final AuthRepository authRepository;
  final StudentRepository studentRepository;

  const MyApp({
    super.key,
    required this.prefs,
    required this.httpClient,
    required this.authRepository,
    required this.studentRepository,
  });

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Provide the auth repository
        Provider<AuthRepository>(
          create: (_) => authRepository,
        ),
        // Provide the mahasiswa repository
        Provider<StudentRepository>(
          create: (_) => studentRepository,
        ),
        // Provide the auth bloc
        BlocProvider<AuthBloc>(
          create: (context) => AuthBloc(authRepository),
        ),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const SplashScreen(),
        builder: (context, child) {
          return ToastificationWrapper(child: child!);
        },
      ),
    );
  }
}
