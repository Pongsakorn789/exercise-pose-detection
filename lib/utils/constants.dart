// lib/utils/constants.dart
import 'package:flutter/material.dart';

/// ================= COLORS =================
const Color softBackgroundColor = Color(0xFFF6F6FA);
const Color primaryGreen = Color(0xFF4CAF50);
const Color textPrimaryColor = Colors.black;

/// ================= APP CONSTANTS =================
class AppConstants {
  static const String appName = 'แอพออกกำลังกายผู้สูงอายุ';

  static const Map<int, String> exerciseNames = {
    1: "ท่าเหยียดเข่า",
    2: "ท่ายกแขนเหนือศีรษะ",
  };

  static const int defaultTargetReps = 10;
  static const int minTargetReps = 5;
  static const int maxTargetReps = 30;

  static String getExerciseName(int exerciseNumber) {
    return exerciseNames[exerciseNumber] ??
        "ท่าที่ $exerciseNumber";
  }
}
