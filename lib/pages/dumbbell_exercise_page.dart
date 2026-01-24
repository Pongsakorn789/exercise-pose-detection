import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import '../widgets/ui_components.dart';

class DumbbellExercisePage extends StatefulWidget {
  const DumbbellExercisePage({super.key});

  @override
  State<DumbbellExercisePage> createState() => _DumbbellExercisePageState();
}

class _DumbbellExercisePageState extends State<DumbbellExercisePage> {
  late InAppLocalhostServer _server;

  @override
  void initState() {
    super.initState();
    // Serving assets/site on port 8080
    _server = InAppLocalhostServer(documentRoot: 'assets/site', port: 8080);
    _server.start();
  }

  @override
  void dispose() {
    _server.close();
    super.dispose();
  }

  Future<void> _saveToFirebase(Map<String, dynamic> data) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่')),
      );
      return;
    }

    try {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection('exercise_history')
          .add({
            'exercise': 'dumbbell_standing', // ระบุประเภทท่า
            'date': data['date'],
            'left': data['left'],
            'right': data['right'],
            'rounds': data['rounds'],
            'total': data['total'],
            'duration_seconds': data['durationSec'],
            'timestamp': FieldValue.serverTimestamp(),
          });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('บันทึกข้อมูลเรียบร้อยแล้ว'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      debugPrint('Error saving to Firebase: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('เกิดข้อผิดพลาดในการบันทึก: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'ท่ายกดัมเบล',
          style: TextStyle(
            color: textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: textPrimaryColor,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Text(
              "จัดตำแหน่งร่างกายให้อยู่ในกรอบ",
              style: TextStyle(fontSize: 16, color: textSecondaryColor),
            ),
          ),
          Expanded(
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              decoration: BoxDecoration(
                color: Colors.black, // Camera background
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: InAppWebView(
                  initialUrlRequest: URLRequest(
                    url: WebUri('http://localhost:8080/index.html'),
                  ),
                  initialSettings: InAppWebViewSettings(
                    javaScriptEnabled: true,
                    allowsInlineMediaPlayback: true,
                    mediaPlaybackRequiresUserGesture: false,
                  ),
                  onWebViewCreated: (controller) {
                    controller.addJavaScriptHandler(
                      handlerName: 'saveExerciseData',
                      callback: (args) {
                        if (args.isNotEmpty) {
                          final data = args[0] as Map<String, dynamic>;
                          _saveToFirebase(data);
                          return 'Saved';
                        }
                        return 'No Data';
                      },
                    );
                  },
                  onPermissionRequest: (controller, request) async {
                    return PermissionResponse(
                      resources: request.resources,
                      action: PermissionResponseAction.GRANT,
                    );
                  },
                  onConsoleMessage: (controller, message) {
                    debugPrint('WEB ▶ ${message.message}');
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
