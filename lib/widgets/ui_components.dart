import 'package:flutter/material.dart';

/// ===== สีหลัก =====
const Color primaryGreen = Color(0xFF0F766E);
const Color goldButtonColor = Color(0xFFB88A1E);

/// ===== Decoration สำหรับ TextField (label ลอย) =====
InputDecoration inputDecoration(String label) {
  return InputDecoration(
    labelText: label,
    floatingLabelBehavior: FloatingLabelBehavior.auto,
    labelStyle: const TextStyle(fontSize: 18),
    filled: true,
    fillColor: Colors.white,
    contentPadding:
        const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
    ),
  );
}

/// ===== TextField มาตรฐาน (ผู้สูงอายุ) =====
Widget floatingInput({
  required String label,
  required TextEditingController controller,
  TextInputType keyboardType = TextInputType.text,
  bool obscure = false,
  bool enabled = true,
}) {
  return TextField(
    controller: controller,
    keyboardType: keyboardType,
    obscureText: obscure,
    enabled: enabled,
    style: const TextStyle(fontSize: 20),
    decoration: inputDecoration(label),
  );
}

/// ===== ปุ่มสีทอง =====
Widget goldButton({
  required String text,
  required VoidCallback onPressed,
}) {
  return SizedBox(
    height: 60,
    width: double.infinity,
    child: ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: goldButtonColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
      onPressed: onPressed,
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
        ),
      ),
    ),
  );
}

/// ===== DatePicker + คำนวณอายุ =====
Future<void> pickBirthDate({
  required BuildContext context,
  required TextEditingController birthCtrl,
  required TextEditingController ageCtrl,
}) async {
  final picked = await showDatePicker(
    context: context,
    initialDate: DateTime(1970),
    firstDate: DateTime(1900),
    lastDate: DateTime.now(),
  );

  if (picked != null) {
    final now = DateTime.now();
    int age = now.year - picked.year;
    if (now.month < picked.month ||
        (now.month == picked.month && now.day < picked.day)) {
      age--;
    }

    birthCtrl.text =
        "${picked.day}/${picked.month}/${picked.year}";
    ageCtrl.text = age.toString();
  }
}

/// ===== คำนวณ BMI =====
void calculateBMI({
  required TextEditingController heightCtrl,
  required TextEditingController weightCtrl,
  required TextEditingController bmiCtrl,
}) {
  final h = double.tryParse(heightCtrl.text);
  final w = double.tryParse(weightCtrl.text);

  if (h != null && w != null && h > 0) {
    final bmi = w / ((h / 100) * (h / 100));
    bmiCtrl.text = bmi.toStringAsFixed(1);
  }
}
