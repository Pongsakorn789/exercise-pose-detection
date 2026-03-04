import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_tts/flutter_tts.dart'; // ✅ นำเข้าระบบเสียง
import '../widgets/ui_components.dart';

class HipExercisePage extends StatefulWidget {
  const HipExercisePage({super.key});

  @override
  State<HipExercisePage> createState() => _HipExercisePageState();
}

class _HipExercisePageState extends State<HipExercisePage> {
  late InAppLocalhostServer _server;
  final FlutterTts flutterTts = FlutterTts(); // ✅ สร้างตัวแปรลำโพง

  Future<void> _requestCameraPermission() async {
    var status = await Permission.camera.status;
    if (status.isDenied) {
      await Permission.camera.request();
    }
  }

  @override
  void initState() {
    super.initState();
    _requestCameraPermission();
    flutterTts.setLanguage("th-TH"); // ✅ ตั้งค่าให้พูดภาษาไทย
    _server = InAppLocalhostServer(documentRoot: 'two/stow', port: 8081);
    _server.start();
  }

  @override
  void dispose() {
    _server.close();
    flutterTts.stop(); // ✅ ปิดเสียงตอนออกหน้า
    super.dispose();
  }

  Future<void> _saveToFirebase(Map<String, dynamic> data) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่')),
        );
      }
      return;
    }

    try {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection('exercise_history')
          .add({
        'exerciseType': 'hip_adduction_standing',
        'date': FieldValue.serverTimestamp(),
        'left': data['left'] ?? 0,
        'right': data['right'] ?? 0,
        'rounds': data['rounds'] ?? 0,
        'total': data['total'] ?? 0,
        'duration_seconds': data['durationSec'] ?? 0,
      });

      if (mounted) {
        _showSummaryDialog(data);
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

  void _showSummaryDialog(Map<String, dynamic> data) {
    final durationSec = data['durationSec'] ?? 0;
    final min = (durationSec / 60).floor();
    final sec = durationSec % 60;
    final timeStr = '$min นาที $sec วินาที';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: Colors.green,
                  size: 48,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "บันทึกผลสำเร็จ!",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildSummaryRow("จำนวนครั้งรวม", "${data['total'] ?? 0}"),
              const SizedBox(height: 8),
              _buildSummaryRow("ด้านซ้าย", "${data['left'] ?? 0}"),
              const SizedBox(height: 8),
              _buildSummaryRow("ด้านขวา", "${data['right'] ?? 0}"),
              const SizedBox(height: 8),
              _buildSummaryRow("ระยะเวลา", timeStr),
            ],
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryGreen,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                child: const Text(
                  "ตกลง",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 16)),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'ท่าบริหารสะโพกด้านข้าง',
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
                color: Colors.black,
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
                    url: WebUri('http://localhost:8081/index.html'),
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
                    
                    // ✅ สะพานรับข้อความให้แอปพูด
                    controller.addJavaScriptHandler(
                      handlerName: 'speakText',
                      callback: (args) {
                        if (args.isNotEmpty) {
                          flutterTts.speak(args[0].toString());
                        }
                      },
                    );
                  },
                  onPermissionRequest: (controller, request) async {
                    return PermissionResponse(
                      resources: request.resources,
                      action: PermissionResponseAction.GRANT,
                    );
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