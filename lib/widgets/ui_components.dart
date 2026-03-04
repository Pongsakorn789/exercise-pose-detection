import 'package:flutter/material.dart';

/// ================== COLOR SYSTEM (Medical + Modern) ==================

const Color primaryGreen = Color(0xFF0F766E); // เขียวสุขภาพ
const Color accentGreen = Color(0xFF14B8A6);
const Color goldButtonColor = Color(0xFFB88A1E);

const Color softBackgroundColor = Color(0xFFF8F9FA);
const Color cardBackgroundColor = Colors.white;

const Color textPrimaryColor = Color(0xFF1F2937); // อ่านง่ายกว่าเดิม
const Color textSecondaryColor = Color(0xFF6B7280);

/// ================== INPUT DECORATION ==================

InputDecoration inputDecoration(String label) {
  return InputDecoration(
    labelText: label,
    floatingLabelBehavior: FloatingLabelBehavior.auto,
    labelStyle: const TextStyle(
      fontSize: 18,
      color: textSecondaryColor,
    ),
    filled: true,
    fillColor: cardBackgroundColor,
    contentPadding:
        const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: Colors.grey.shade300),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: const BorderSide(color: primaryGreen, width: 2),
    ),
  );
}

/// ================== TEXT FIELD (Elderly Friendly) ==================

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
    style: const TextStyle(
      fontSize: 20,
      color: textPrimaryColor,
    ),
    decoration: inputDecoration(label),
  );
}

/// ================== PRIMARY BUTTON (ใช้แทน goldButton ได้) ==================

Widget primaryButton({
  required String text,
  required VoidCallback onPressed,
  IconData? icon,
}) {
  return SizedBox(
    height: 60,
    width: double.infinity,
    child: ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon ?? Icons.arrow_forward, size: 26),
      label: Text(
        text,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryGreen,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
        elevation: 2,
      ),
    ),
  );
}

/// ================== GOLD BUTTON (กรณีต้องการความสำคัญพิเศษ) ==================

Widget goldButton({
  required String text,
  required VoidCallback onPressed,
}) {
  return SizedBox(
    height: 60,
    width: double.infinity,
    child: ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: goldButtonColor,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    ),
  );
}

/// ================== DATE PICKER + AGE ==================

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
    helpText: 'เลือกวันเกิด',
  );

  if (picked != null) {
    final now = DateTime.now();
    int age = now.year - picked.year;
    if (now.month < picked.month ||
        (now.month == picked.month && now.day < picked.day)) {
      age--;
    }

    birthCtrl.text =
        "${picked.day.toString().padLeft(2, '0')}/"
        "${picked.month.toString().padLeft(2, '0')}/"
        "${picked.year}";
    ageCtrl.text = age.toString();
  }
}

/// ================== BMI CALCULATOR ==================

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
  } else {
    bmiCtrl.text = '';
  }
}
