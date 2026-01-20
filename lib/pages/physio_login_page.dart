import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../auth/auth_service.dart';
import '../widgets/ui_components.dart';
import 'physio_register_page.dart';
import 'home_page.dart';

class PhysioLoginPage extends StatefulWidget {
  const PhysioLoginPage({super.key});

  @override
  State<PhysioLoginPage> createState() => _PhysioLoginPageState();
}

class _PhysioLoginPageState extends State<PhysioLoginPage> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final AuthService auth = AuthService();
  bool isLoading = false;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    // ตรวจสอบข้อมูล
    if (emailController.text.trim().isEmpty) {
      _showError("กรุณากรอกอีเมล");
      return;
    }

    if (passwordController.text.isEmpty) {
      _showError("กรุณากรอกรหัสผ่าน");
      return;
    }

    setState(() => isLoading = true);

    try {
      // เข้าสู่ระบบ
      final user = await auth.login(
        email: emailController.text.trim(),
        password: passwordController.text,
      );

      if (user == null) {
        setState(() => isLoading = false);
        return;
      }

      // ตรวจสอบ role
      final role = await auth.getUserRole(user.uid);

      if (!mounted) {
        setState(() => isLoading = false);
        return;
      }

      // ตรวจสอบว่าเป็นนักกายภาพหรือไม่
      if (role != 'physio') {
        await FirebaseAuth.instance.signOut();
        throw FirebaseAuthException(
          code: 'not-physio',
          message: 'บัญชีนี้ไม่ใช่บัญชีนักกายภาพ',
        );
      }

      // เข้าสู่หน้าหลัก
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => const HomePage(role: 'physio'),
          ),
        );
      }
    } on FirebaseAuthException catch (e) {
      setState(() => isLoading = false);
      if (!mounted) return;
      
      String message = 'เข้าสู่ระบบไม่สำเร็จ';
      
      switch (e.code) {
        case 'user-not-found':
          message = 'ไม่พบบัญชีผู้ใช้นี้ กรุณาสมัครสมาชิกก่อน';
          break;
        case 'wrong-password':
          message = 'รหัสผ่านไม่ถูกต้อง';
          break;
        case 'invalid-email':
          message = 'รูปแบบอีเมลไม่ถูกต้อง';
          break;
        case 'user-disabled':
          message = 'บัญชีนี้ถูกระงับการใช้งาน';
          break;
        case 'too-many-requests':
          message = 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่';
          break;
        case 'not-physio':
          message = e.message ?? 'บัญชีนี้ไม่ใช่บัญชีนักกายภาพ';
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
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: primaryGreen,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "เข้าสู่ระบบนักกายภาพ",
          style: TextStyle(color: Colors.white),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              
              // ไอคอน
              const Icon(
                Icons.medical_services_outlined,
                size: 80,
                color: Colors.white,
              ),
              
              const SizedBox(height: 20),
              
              const Text(
                'เข้าสู่ระบบนักกายภาพ',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 40),
              
              // อีเมล
              floatingInput(
                label: "อีเมล",
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              
              const SizedBox(height: 16),
              
              // รหัสผ่าน
              floatingInput(
                label: "รหัสผ่าน",
                controller: passwordController,
                obscure: true,
              ),
              
              const SizedBox(height: 30),
              
              // ปุ่มเข้าสู่ระบบ
              SizedBox(
                height: 60,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: goldButtonColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  onPressed: isLoading ? null : _login,
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
                          "เข้าสู่ระบบ",
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // สมัครสมาชิก
              TextButton(
                onPressed: isLoading
                    ? null
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const PhysioRegisterPage(),
                          ),
                        );
                      },
                child: const Text(
                  "สมัครสมาชิก",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                  ),
                ),
              ),
              
              const SizedBox(height: 40),
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