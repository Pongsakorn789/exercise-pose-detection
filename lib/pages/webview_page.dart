import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class WebViewPage extends StatefulWidget {
  const WebViewPage({super.key});

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Exercise Tracking')),
      body: InAppWebView(
        initialFile: 'assets/site/index.html',
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
          mediaPlaybackRequiresUserGesture: false,
          allowsInlineMediaPlayback: true,
        ),
        onWebViewCreated: (controller) {
          

          // 🔥 รับค่าจาก JavaScript
          controller.addJavaScriptHandler(
            handlerName: 'onExerciseResult',
            callback: (args) async {
              final Map<String, dynamic> data =
                  Map<String, dynamic>.from(args.first);

              await _saveExerciseToFirebase(data);
            },
          );
        },
      ),
    );
  }

Future<void> _saveExerciseToFirebase(Map<String, dynamic> data) async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) return;

  final int left = data['left'] ?? 0;
  final int right = data['right'] ?? 0;

  await FirebaseFirestore.instance
      .collection('exercise_records')
      .add({
        'userId': user.uid,
        'exercise': data['exercise'] ?? 'unknown',
        'left': left,
        'right': right,
        'round': data['round'] ?? 0,
        'total': left + right,
        'timestamp': FieldValue.serverTimestamp(),
      });

  debugPrint('✅ Saved exercise for user ${user.uid}');
}

}