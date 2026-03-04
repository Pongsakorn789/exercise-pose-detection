import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../auth/auth_service.dart';
import '../widgets/ui_components.dart';

class PhysioRegisterPage extends StatefulWidget {
  const PhysioRegisterPage({super.key});

  @override
  State<PhysioRegisterPage> createState() => _PhysioRegisterPageState();
}

class _PhysioRegisterPageState extends State<PhysioRegisterPage> {
  final auth = AuthService();

  final firstNameCtrl = TextEditingController();
  final lastNameCtrl = TextEditingController();
  final emailCtrl = TextEditingController();
  final birthCtrl = TextEditingController();
  final ageCtrl = TextEditingController();
  final licenseCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  final confirmCtrl = TextEditingController();

  bool acceptPolicy = false;
  bool isLoading = false;

  @override
  void dispose() {
    firstNameCtrl.dispose();
    lastNameCtrl.dispose();
    emailCtrl.dispose();
    birthCtrl.dispose();
    ageCtrl.dispose();
    licenseCtrl.dispose();
    passCtrl.dispose();
    confirmCtrl.dispose();
    super.dispose();
  }

  // ===== วันเกิด + อายุ =====
  Future<void> pickBirthDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1995),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: primaryGreen,
              onPrimary: Colors.white,
              onSurface: textPrimaryColor,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final now = DateTime.now();
      int age = now.year - picked.year;
      if (now.month < picked.month ||
          (now.month == picked.month && now.day < picked.day)) {
        age--;
      }

      birthCtrl.text = "${picked.day}/${picked.month}/${picked.year}";
      ageCtrl.text = age.toString();
    }
  }

  bool _isValidLicense(String value) {
    final regex = RegExp(r'^กภ\.\d{5}$');
    return regex.hasMatch(value);
  }

  Future<void> _register() async {
    if (firstNameCtrl.text.trim().isEmpty) {
      _showError("กรุณากรอกชื่อ");
      return;
    }

    if (lastNameCtrl.text.trim().isEmpty) {
      _showError("กรุณากรอกนามสกุล");
      return;
    }

    if (emailCtrl.text.trim().isEmpty ||
        !emailCtrl.text.contains('@')) {
      _showError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    if (birthCtrl.text.isEmpty) {
      _showError("กรุณาเลือกวันเกิด");
      return;
    }

    if (licenseCtrl.text.trim().isEmpty ||
        !_isValidLicense(licenseCtrl.text.trim())) {
      _showError("เลขใบอนุญาตต้องอยู่ในรูปแบบ กภ.12345");
      return;
    }

    if (passCtrl.text.length < 6) {
      _showError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (passCtrl.text != confirmCtrl.text) {
      _showError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!acceptPolicy) {
      _showError("กรุณายอมรับจรรยาบรรณวิชาชีพก่อนสมัครสมาชิก");
      return;
    }

    setState(() => isLoading = true);

    try {
      final user = await auth.register(
        email: emailCtrl.text.trim(),
        password: passCtrl.text,
        role: 'physio',
      );

      if (!mounted || user == null) return;

      await FirebaseFirestore.instance
    .collection('users')
    .doc(user.uid)
    .set({
  'firstName': firstNameCtrl.text.trim(),
  'lastName': lastNameCtrl.text.trim(),
  'email': emailCtrl.text.trim(),
  'birthDate': birthCtrl.text,
  'age': int.parse(ageCtrl.text),
  'licenseNumber': licenseCtrl.text.trim(),
  'role': 'physio',
  'acceptedPolicy': true,
  'createdAt': FieldValue.serverTimestamp(),
});


      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('สมัครสมาชิกนักกายภาพบำบัดสำเร็จ'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } on FirebaseAuthException catch (e) {
      setState(() => isLoading = false);

      String msg = 'สมัครสมาชิกไม่สำเร็จ';
      if (e.code == 'email-already-in-use') {
        msg = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (e.code == 'weak-password') {
        msg = 'รหัสผ่านไม่ปลอดภัย';
      }

      _showError(msg);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: textPrimaryColor),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: const Text(
          "สมัครนักกายภาพบำบัด",
          style: TextStyle(
            color: textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildSectionContainer(
              title: "ข้อมูลส่วนตัว",
              icon: Icons.person_rounded,
              children: [
                _buildTextField(
                  label: "ชื่อ",
                  controller: firstNameCtrl,
                  icon: Icons.text_fields_rounded,
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "นามสกุล",
                  controller: lastNameCtrl,
                  icon: Icons.text_fields_rounded,
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "อีเมล",
                  controller: emailCtrl,
                  icon: Icons.email_rounded,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: pickBirthDate,
                  child: AbsorbPointer(
                    child: _buildTextField(
                      label: "วัน/เดือน/ปีเกิด",
                      controller: birthCtrl,
                      icon: Icons.calendar_today_rounded,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "อายุ (ปี)",
                  controller: ageCtrl,
                  icon: Icons.cake_rounded,
                  enabled: false,
                ),
              ],
            ),

            const SizedBox(height: 24),

            _buildSectionContainer(
              title: "ข้อมูลวิชาชีพ",
              icon: Icons.badge_rounded,
              children: [
                _buildTextField(
                  label: "เลขใบอนุญาตนักกายภาพ (กภ.12345)",
                  controller: licenseCtrl,
                  icon: Icons.credit_card_rounded,
                ),
              ],
            ),

            const SizedBox(height: 24),

            _buildSectionContainer(
              title: "ข้อมูลบัญชีผู้ใช้",
              icon: Icons.lock_outline_rounded,
              children: [
                _buildTextField(
                  label: "รหัสผ่าน",
                  controller: passCtrl,
                  icon: Icons.lock_rounded,
                  obscure: true,
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "ยืนยันรหัสผ่าน",
                  controller: confirmCtrl,
                  icon: Icons.lock_reset_rounded,
                  obscure: true,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _register(),
                ),
              ],
            ),

            const SizedBox(height: 24),

            CheckboxListTile(
              value: acceptPolicy,
              onChanged: (v) => setState(() => acceptPolicy = v ?? false),
              activeColor: primaryGreen,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text(
                "ข้าพเจ้ายอมรับจรรยาบรรณและเงื่อนไขวิชาชีพนักกายภาพบำบัด",
                style: TextStyle(fontSize: 14, color: textPrimaryColor),
              ),
            ),

            const SizedBox(height: 32),

            SizedBox(
              height: 56,
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryGreen,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                onPressed: isLoading ? null : _register,
                child: isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        "ลงทะเบียนใช้งาน",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}

Widget _buildSectionContainer({
  required String title,
  required IconData icon,
  required List<Widget> children,
}) {
  return Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: primaryGreen),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: textPrimaryColor,
              ),
            ),
          ],
        ),
        const Divider(height: 24),
        ...children,
      ],
    ),
  );
}


Widget _buildTextField({
  required TextEditingController controller,
  required String label,
  required IconData icon,
  bool obscure = false,
  bool enabled = true,
  TextInputType keyboardType = TextInputType.text,
  TextInputAction? textInputAction,
  Function(String)? onSubmitted,
}) {
  return TextField(
    controller: controller,
    obscureText: obscure,
    enabled: enabled,
    keyboardType: keyboardType,
    textInputAction: textInputAction,
    onSubmitted: onSubmitted,
    style: const TextStyle(fontSize: 16, color: textPrimaryColor),
    decoration: InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: enabled ? primaryGreen : Colors.grey),
      filled: true,
      fillColor: enabled ? const Color(0xFFF9FAFB) : Colors.grey[100],
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
  );
}

