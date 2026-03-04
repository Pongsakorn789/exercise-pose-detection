import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'pages/user_type_selection_page.dart';
import 'app_font_scale.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    }
  } catch (e) {
    if (!e.toString().contains('duplicate-app')) {
      print('Firebase initialization error: $e');
      rethrow;
    }
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<double>(
      valueListenable: appTextScale,
      builder: (context, scale, _) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'FitAI',
          theme: ThemeData(
            useMaterial3: true,
          ),
          builder: (context, child) {
            return MediaQuery(
              data: MediaQuery.of(context).copyWith(
                textScaleFactor: scale,
              ),
              child: child!,
            );
          },
          home: const UserTypeSelectionPage(),
        );
      },
    );
  }
}
