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
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  final auth = AuthService();
  bool isLoading = false;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    // ตรวจสอบข้อมูล
    if (emailController.text.trim().isEmpty) {
      _showError("กรุณากรอกอีเมล");
      return;
    }

    if (!emailController.text.trim().contains('@')) {
      _showError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    if (passwordController.text.isEmpty) {
      _showError("กรุณาตั้งรหัสผ่าน");
      return;
    }

    if (passwordController.text.length < 6) {
      _showError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (passwordController.text != confirmPasswordController.text) {
      _showError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setState(() => isLoading = true);

    try {
      // สมัครสมาชิก
      final user = await auth.register(
        email: emailController.text.trim(),
        password: passwordController.text,
        role: 'physio',
      );

      if (!mounted || user == null) {
        setState(() => isLoading = false);
        return;
      }

      // บันทึกข้อมูลเพิ่มเติมลง Firestore
      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        'email': emailController.text.trim(),
        'role': 'physio',
        'createdAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('สมัครสมาชิกนักกายภาพสำเร็จ! กรุณาเข้าสู่ระบบ'),
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
          message = 'อีเมลนี้ถูกใช้งานแล้ว';
          break;
        case 'invalid-email':
          message = 'รูปแบบอีเมลไม่ถูกต้อง';
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
          'สมัครสมาชิกนักกายภาพ',
          style: TextStyle(color: Colors.white),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),

              // ไอคอน
              const Icon(
                Icons.medical_services_outlined,
                size: 80,
                color: Colors.white,
              ),

              const SizedBox(height: 20),

              const Text(
                'สมัครสมาชิกนักกายภาพ',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 30),

              floatingInput(
                label: "อีเมล",
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
              ),

              const SizedBox(height: 16),

              floatingInput(
                label: "รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)",
                controller: passwordController,
                obscure: true,
              ),

              const SizedBox(height: 16),

              floatingInput(
                label: "ยืนยันรหัสผ่าน",
                controller: confirmPasswordController,
                obscure: true,
              ),

              const SizedBox(height: 24),

              SizedBox(
                height: 60,
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
                          'สมัครสมาชิก',
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