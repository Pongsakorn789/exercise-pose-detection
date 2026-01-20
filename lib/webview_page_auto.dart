import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class WebViewPageAuto extends StatelessWidget {
  final String assetPath;
  final String title;

  const WebViewPageAuto({
    super.key,
    required this.assetPath,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: InAppWebView(
        initialFile: assetPath,
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,

          // ✅ สำคัญมากสำหรับ iOS (ถ้าขาด = จอดำ)
          mediaPlaybackRequiresUserGesture: false,
          allowsInlineMediaPlayback: true,

          // ✅ ช่วยเรื่อง render
          useHybridComposition: true,
        ),
      ),
    );
  }
}
