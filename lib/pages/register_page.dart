import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../auth/auth_service.dart';
import '../widgets/ui_components.dart';

class RegisterPage extends StatefulWidget {
  final String role;
  const RegisterPage({super.key, required this.role});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final auth = AuthService();

  final firstNameCtrl = TextEditingController();
  final lastNameCtrl = TextEditingController();
  final birthCtrl = TextEditingController();
  final ageCtrl = TextEditingController();
  final heightCtrl = TextEditingController();
  final weightCtrl = TextEditingController();
  final bmiCtrl = TextEditingController();
  final idCardCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  final confirmCtrl = TextEditingController();

  bool acceptPolicy = false;
  bool acceptNews = false;
  bool isLoading = false;

  @override
  void dispose() {
    firstNameCtrl.dispose();
    lastNameCtrl.dispose();
    birthCtrl.dispose();
    ageCtrl.dispose();
    heightCtrl.dispose();
    weightCtrl.dispose();
    bmiCtrl.dispose();
    idCardCtrl.dispose();
    passCtrl.dispose();
    confirmCtrl.dispose();
    super.dispose();
  }

  /// เลือกวันเกิด + คำนวณอายุ
  Future<void> pickBirthDate() async {
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

      birthCtrl.text = "${picked.day}/${picked.month}/${picked.year}";
      ageCtrl.text = age.toString();
    }
  }

  /// คำนวณ BMI
  void calculateBMI() {
    final h = double.tryParse(heightCtrl.text);
    final w = double.tryParse(weightCtrl.text);

    if (h != null && w != null && h > 0) {
      final bmi = w / ((h / 100) * (h / 100));
      bmiCtrl.text = bmi.toStringAsFixed(1);
    } else {
      _showError("กรุณากรอกส่วนสูงและน้ำหนักให้ถูกต้อง");
    }
  }

  /// ฟังก์ชันสมัครสมาชิก
  Future<void> _register() async {
    // ตรวจสอบข้อมูล
    if (firstNameCtrl.text.trim().isEmpty) {
      _showError("กรุณากรอกชื่อ");
      return;
    }

    if (lastNameCtrl.text.trim().isEmpty) {
      _showError("กรุณากรอกนามสกุล");
      return;
    }

    if (birthCtrl.text.isEmpty) {
      _showError("กรุณาเลือกวันเกิด");
      return;
    }

    if (heightCtrl.text.trim().isEmpty || weightCtrl.text.trim().isEmpty) {
      _showError("กรุณากรอกส่วนสูงและน้ำหนัก");
      return;
    }

    if (bmiCtrl.text.isEmpty) {
      _showError("กรุณาคำนวณ BMI");
      return;
    }

    if (idCardCtrl.text.trim().length != 13) {
      _showError("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
      return;
    }

    if (passCtrl.text.isEmpty) {
      _showError("กรุณาตั้งรหัสผ่าน");
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
      _showError("กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก");
      return;
    }

    setState(() => isLoading = true);

    try {
      // สมัครสมาชิก
      final user = await auth.register(
        email: "${idCardCtrl.text.trim()}@senior.app",
        password: passCtrl.text,
        role: 'elderly',
      );

      if (!mounted || user == null) {
        setState(() => isLoading = false);
        return;
      }

      // บันทึกข้อมูลเพิ่มเติมลง Firestore
      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        'firstName': firstNameCtrl.text.trim(),
        'lastName': lastNameCtrl.text.trim(),
        'birthDate': birthCtrl.text,
        'age': int.parse(ageCtrl.text),
        'height': double.parse(heightCtrl.text),
        'weight': double.parse(weightCtrl.text),
        'bmi': double.parse(bmiCtrl.text),
        'idCard': idCardCtrl.text.trim(),
        'acceptedPolicy': acceptPolicy,
        'acceptNews': acceptNews,
        'role': 'elderly',
        'email': "${idCardCtrl.text.trim()}@senior.app",
        'createdAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } on FirebaseAuthException catch (e) {
      setState(() => isLoading = false);
      if (!mounted) return;

      String message = 'สมัครสมาชิกไม่สำเร็จ';

      switch (e.code) {
        case 'email-already-in-use':
          message = 'เลขบัตรประชาชนนี้ถูกใช้งานแล้ว';
          break;
        case 'invalid-email':
          message = 'รูปแบบข้อมูลไม่ถูกต้อง';
          break;
        case 'weak-password':
          message = 'รหัสผ่านไม่ปลอดภัยเพียงพอ';
          break;
        case 'network-request-failed':
          message = 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้';
          break;
        default:
          message = 'เกิดข้อผิดพลาด: ${e.message}';
      }

      _showError(message);
    } catch (e) {
      setState(() => isLoading = false);
      if (!mounted) return;
      _showError('เกิดข้อผิดพลาดที่ไม่คาดคิด: ${e.toString()}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: primaryGreen,
      appBar: AppBar(
        backgroundColor: primaryGreen,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "สมัครสมาชิก",
          style: TextStyle(color: Colors.white),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            floatingInput(label: "ชื่อ", controller: firstNameCtrl),
            const SizedBox(height: 12),

            floatingInput(label: "นามสกุล", controller: lastNameCtrl),
            const SizedBox(height: 12),

            /// วันเกิด (ใช้ปฏิทิน)
            GestureDetector(
              onTap: pickBirthDate,
              child: AbsorbPointer(
                child: floatingInput(
                  label: "วัน/เดือน/ปีเกิด",
                  controller: birthCtrl,
                ),
              ),
            ),
            const SizedBox(height: 12),

            floatingInput(
              label: "อายุ (ปี)",
              controller: ageCtrl,
              enabled: false,
            ),
            const SizedBox(height: 12),

            floatingInput(
              label: "ส่วนสูง (ซม.)",
              controller: heightCtrl,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),

            floatingInput(
              label: "น้ำหนัก (กก.)",
              controller: weightCtrl,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 8),

            ElevatedButton(
              onPressed: calculateBMI,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: primaryGreen,
              ),
              child: const Text("คำนวณ BMI"),
            ),
            const SizedBox(height: 12),

            floatingInput(
              label: "BMI",
              controller: bmiCtrl,
              enabled: false,
            ),
            const SizedBox(height: 12),

            floatingInput(
              label: "เลขบัตรประชาชน (13 หลัก)",
              controller: idCardCtrl,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),

            floatingInput(
              label: "ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)",
              controller: passCtrl,
              obscure: true,
            ),
            const SizedBox(height: 12),

            floatingInput(
              label: "ยืนยันรหัสผ่าน",
              controller: confirmCtrl,
              obscure: true,
            ),
            const SizedBox(height: 10),

            /// Checkbox ยอมรับเงื่อนไข
            CheckboxListTile(
              value: acceptPolicy,
              onChanged: (v) => setState(() => acceptPolicy = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              activeColor: goldButtonColor,
              checkColor: Colors.white,
              title: const Text(
                "ฉันยอมรับ เงื่อนไขการใช้งาน และนโยบายการคุ้มครองข้อมูลส่วนบุคคล\nรวมถึงการใช้ข้อมูลเพื่อปรับปรุงบริการ",
                style: TextStyle(fontSize: 16, color: Colors.white),
              ),
            ),

            CheckboxListTile(
              value: acceptNews,
              onChanged: (v) => setState(() => acceptNews = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              activeColor: goldButtonColor,
              checkColor: Colors.white,
              title: const Text(
                "ฉันต้องการรับข่าวสารและคำแนะนำเกี่ยวกับการออกกำลังกาย (ไม่บังคับ)",
                style: TextStyle(fontSize: 16, color: Colors.white),
              ),
            ),
            const SizedBox(height: 10),

            /// ปุ่มสมัคร
            SizedBox(
              height: 60,
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: goldButtonColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                onPressed: isLoading ? null : _register,
                child: isLoading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        "สมัครสมาชิก",
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
      ),
    );
  }
}