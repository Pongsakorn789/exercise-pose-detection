import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class Exercise1Page extends StatefulWidget {
  const Exercise1Page({super.key});

  @override
  State<Exercise1Page> createState() => _Exercise1PageState();
}

class _Exercise1PageState extends State<Exercise1Page> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('ท่ายกดัมเบล'),
        backgroundColor: Colors.black,
        elevation: 0,
      ),
      body: InAppWebView(
        initialUrlRequest: URLRequest(
          url: WebUri('http://localhost:8080/index.html'),
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
        onConsoleMessage: (controller, message) {
          debugPrint('WEB ▶ ${message.message}');
        },
      ),
    );
  }
}
