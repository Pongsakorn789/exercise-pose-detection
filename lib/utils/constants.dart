// lib/utils/constants.dart
// ค่าคงที่ที่ใช้ทั่วแอพ

class AppConstants {
  // ชื่อแอพ
  static const String appName = 'แอพออกกำลังกายผู้สูงอายุ';
  
  // ชื่อท่าออกกำลังกาย
  static const Map<int, String> exerciseNames = {
    1: "ท่าเหยียดเข่า",
    2: "ท่ายกแขนเหนือศีรษะ",
  };
  
  // ค่าเริ่มต้น
  static const int defaultTargetReps = 10;
  static const int defaultCountdownSeconds = 5;
  static const int minTargetReps = 5;
  static const int maxTargetReps = 30;
  
  // SharedPreferences Keys
  static const String keyExerciseHistory = 'exerciseHistory';
  static const String keyVoiceFeedbackEnabled = 'voiceFeedbackEnabled';
  static const String keyTargetReps = 'targetReps';
  static const String keyLastExercise = 'lastExercise';
  
  // Text-to-Speech
  static const String ttsLanguage = 'th-TH';
  static const double ttsSpeechRate = 0.5;
  static const double ttsVolume = 1.0;
  static const double ttsPitch = 1.0;
  
  // Animation Durations
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const Duration countdownInterval = Duration(seconds: 1);
  
  // Progress Bar Colors
  static const double progressLowThreshold = 30.0;
  static const double progressMediumThreshold = 70.0;
  
  // WebView
  static const String defaultExerciseUrl = 'assets/site/index.html';
  
  // Dialog
  static const double dialogBorderRadius = 16.0;
  static const double dialogMaxWidth = 600.0;
  static const double dialogMaxHeight = 600.0;
  
  // Helper Methods
  static String getExerciseName(int exerciseNumber) {
    return exerciseNames[exerciseNumber] ?? "ท่าที่ $exerciseNumber";
  }
  
  static String formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year + 543}';
  }
  
  static String getTodayKey() {
    return DateTime.now().toIso8601String().split('T')[0];
  }
}

// ข้อความที่ใช้ในแอพ
class AppStrings {
  // ทั่วไป
  static const String ok = 'ตกลง';
  static const String cancel = 'ยกเลิก';
  static const String close = 'ปิด';
  static const String save = 'บันทึก';
  static const String reset = 'รีเซ็ต';
  static const String start = 'เริ่ม';
  static const String stop = 'หยุด';
  
  // การออกกำลังกาย
  static const String exerciseTracking = 'บันทึกการออกกำลังกาย';
  static const String round = 'รอบที่';
  static const String leftSide = 'ข้างซ้าย';
  static const String rightSide = 'ข้างขวา';
  static const String target = 'เป้าหมาย';
  static const String times = 'ครั้ง';
  
  // การนับถอยหลัง
  static const String getReady = 'เตรียมพร้อม';
  static const String startingExercise = 'กำลังเริ่มนับการออกกำลังกาย';
  static const String startExercising = 'เริ่มการออกกำลังกาย';
  
  // ประวัติ
  static const String history = 'ประวัติ';
  static const String exerciseHistory = 'ประวัติการออกกำลังกาย';
  static const String noHistory = 'ยังไม่มีประวัติการออกกำลังกาย';
  
  // เสียง
  static const String voiceOn = 'เปิดเสียง';
  static const String voiceOff = 'ปิดเสียง';
  static const String voiceEnabled = 'เปิดใช้งานเสียงบรรยายแล้ว';
  
  // ความสำเร็จ
  static const String congratulations = '🎉 ยินดีด้วย!';
  
  // ข้อผิดพลาด
  static const String errorSavingExercise = 'เกิดข้อผิดพลาดในการบันทึกการออกกำลังกาย';
  static const String errorLoadingHistory = 'เกิดข้อผิดพลาดในการโหลดประวัติ';
}