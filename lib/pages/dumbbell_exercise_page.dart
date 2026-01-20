import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class DumbbellExercisePage extends StatefulWidget {
  const DumbbellExercisePage({super.key});

  @override
  State<DumbbellExercisePage> createState() => _DumbbellExercisePageState();
}

class _DumbbellExercisePageState extends State<DumbbellExercisePage> {
  late InAppLocalhostServer _localhostServer;

  @override
  void initState() {
    super.initState();

    // ✅ เปิด localhost server
    _localhostServer = InAppLocalhostServer(
      documentRoot: 'assets/site',
      port: 8080,
    );

    _localhostServer.start();
  }

  @override
  void dispose() {
    _localhostServer.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ท่ายกดัมเบลแบบยืน'),
      ),
      body: InAppWebView(
        // ✅ โหลดผ่าน http://localhost (iOS อนุญาตกล้อง)
        initialUrlRequest: URLRequest(
          url: WebUri('http://localhost:8080/index.html'),
        ),

        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserGesture: false,
        ),

        // ✅ อนุญาต camera ให้ JS
        onPermissionRequest: (controller, request) async {
          return PermissionResponse(
            resources: request.resources,
            action: PermissionResponseAction.GRANT,
          );
        },

        onConsoleMessage: (controller, message) {
          debugPrint('WEB: ${message.message}');
        },
      ),
    );
  }
}
