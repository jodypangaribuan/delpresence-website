import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'package:toastification/toastification.dart';
import 'dart:io';
import 'dart:async';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:flutter/rendering.dart';

import 'core/theme/theme.dart';
import 'core/utils/http_override.dart';
import 'core/utils/api_logger.dart';
import 'core/network/network_info.dart';
import 'features/auth/data/datasources/auth_remote_datasource.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/home/data/datasources/student_remote_datasource.dart';
import 'features/home/data/datasources/student_local_datasource.dart';
import 'features/home/data/repositories/student_repository_impl.dart';
import 'features/home/domain/repositories/student_repository.dart';
import 'features/splash/presentation/screens/splash_screen.dart';

// Add function to preload critical assets
Future<void> _preloadAssets() async {
  try {
    // Preload background image to check if it can load properly
    final imageProvider = AssetImage('assets/images/background/background-header.png');
    // Use a BuildContext-free approach for preloading
    final imageStream = imageProvider.resolve(ImageConfiguration.empty);
    final completer = Completer<void>();
    final listener = ImageStreamListener(
      (ImageInfo info, bool syncCall) {
        completer.complete();
      },
      onError: (dynamic exception, StackTrace? stackTrace) {
        debugPrint('Error preloading header background image: $exception');
        completer.completeError(exception);
      },
    );
    
    imageStream.addListener(listener);
    await completer.future;
    imageStream.removeListener(listener);
    debugPrint('Successfully preloaded header background image');
  } catch (e) {
    debugPrint('Error preloading assets: $e');
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Add global error handling for image loading
  ErrorWidget.builder = (FlutterErrorDetails details) {
    if (details.exception.toString().contains('image')) {
      debugPrint('Image loading error: ${details.exception}');
      return Container(
        height: 30,
        width: 30,
        color: Colors.grey[300],
        child: const Icon(Icons.error, size: 16, color: Colors.red),
      );
    }
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Center(
        child: Text(
          'An error occurred: ${details.exception}',
          style: const TextStyle(color: Colors.red),
        ),
      ),
    );
  };

  // Initialize locale data for Indonesian at app startup - with proper error handling
  try {
    await initializeDateFormatting('id_ID', null);
    // Verify the locale is properly loaded by testing it
    DateFormat('EEEE, d MMMM yyyy', 'id_ID');
    debugPrint('Indonesian locale initialized successfully');
  } catch (e) {
    debugPrint('Error initializing Indonesian locale: $e');
    // Force locale initialization with a direct call to ensure availability
    Intl.defaultLocale = 'id_ID';
    try {
      await initializeDateFormatting('id_ID', null);
      debugPrint('Retry: Indonesian locale initialized successfully');
    } catch (e) {
      debugPrint('Retry failed: $e');
    }
  }

  // Preload critical assets
  await _preloadAssets();

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

  // Create student data sources
  final studentRemoteDataSource = StudentRemoteDataSourceImpl(
    client: httpClient,
    sharedPreferences: prefs,
  );

  final studentLocalDataSource = StudentLocalDataSourceImpl(
    sharedPreferences: prefs,
  );

  // Create student repository
  final studentRepository = StudentRepositoryImpl(
    remoteDataSource: studentRemoteDataSource,
    localDataSource: studentLocalDataSource,
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
