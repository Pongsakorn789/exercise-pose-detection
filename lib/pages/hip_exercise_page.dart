import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class HipExercisePage extends StatefulWidget {
  const HipExercisePage({super.key});

  @override
  State<HipExercisePage> createState() => _HipExercisePageState();
}

class _HipExercisePageState extends State<HipExercisePage> {
  late InAppLocalhostServer _server;

  @override
  void initState() {
    super.initState();

    // 🔥 documentRoot ต้องตรงกับโฟลเดอร์ของไฟล์ที่ต้องการเปิด
    _server = InAppLocalhostServer(
      documentRoot: 'two/stow',
      port: 8081,
    );

    _server.start();
  }

  @override
  void dispose() {
    _server.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ท่าบริหารสะโพกด้านข้าง'),
      ),
      body: InAppWebView(
        // 🔥 ต้องเป็น index.html ของ two/stow เท่านั้น
        initialUrlRequest: URLRequest(
          url: WebUri('http://localhost:8081/index.html'),
        ),
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserGesture: false,
        ),
        onPermissionRequest: (controller, request) async {
          return PermissionResponse(
            resources: request.resources,
            action: PermissionResponseAction.GRANT,
          );
        },
      ),
    );
  }
}
