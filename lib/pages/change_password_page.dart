import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../widgets/ui_components.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _currentPasswordCtrl = TextEditingController();
  final _newPasswordCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _loading = false;
  bool _hideCurrent = true;
  bool _hideNew = true;

  @override
  void dispose() {
    _currentPasswordCtrl.dispose();
    _newPasswordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text('เปลี่ยนรหัสผ่าน'),
        centerTitle: true,
        backgroundColor: primaryGreen,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                /// 🌈 HERO HEADER
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(26),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(26),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF0F766E),
                        Color(0xFF14B8A6),
                        Color(0xFF38BDF8),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: primaryGreen.withOpacity(0.35),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: const [
                      Icon(
                        Icons.lock_reset_rounded,
                        color: Colors.white,
                        size: 40,
                      ),
                      SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ตั้งรหัสผ่านใหม่',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'กรุณายืนยันตัวตนก่อนเปลี่ยนรหัส',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 36),

                /// 🔑 CURRENT PASSWORD
                _passwordField(
                  label: 'รหัสผ่านปัจจุบัน',
                  icon: Icons.lock_outline,
                  controller: _currentPasswordCtrl,
                  obscure: _hideCurrent,
                  onToggle: () =>
                      setState(() => _hideCurrent = !_hideCurrent),
                ),

                const SizedBox(height: 20),

                /// 🔑 NEW PASSWORD
                _passwordField(
                  label: 'รหัสผ่านใหม่',
                  icon: Icons.lock_reset,
                  controller: _newPasswordCtrl,
                  obscure: _hideNew,
                  onToggle: () =>
                      setState(() => _hideNew = !_hideNew),
                ),

                const SizedBox(height: 36),

                /// ✅ SAVE BUTTON
                SizedBox(
                  width: double.infinity,
                  height: 58,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _changePassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryGreen,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      elevation: 6,
                    ),
                    child: _loading
                        ? const CircularProgressIndicator(
                            color: Colors.white,
                          )
                        : const Text(
                            'บันทึกรหัสผ่านใหม่',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// ================= LOGIC =================

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final user = FirebaseAuth.instance.currentUser!;
      final email = user.email;

      if (email == null) {
        throw Exception('ไม่พบอีเมลผู้ใช้');
      }

      /// 🔐 Re-authentication
      final credential = EmailAuthProvider.credential(
        email: email,
        password: _currentPasswordCtrl.text.trim(),
      );

      await user.reauthenticateWithCredential(credential);

      /// 🔁 Update password
      await user.updatePassword(_newPasswordCtrl.text.trim());

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('เปลี่ยนรหัสผ่านสำเร็จ'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context);
    } on FirebaseAuthException catch (e) {
      String msg = 'เกิดข้อผิดพลาด';

      if (e.code == 'wrong-password') {
        msg = 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
      } else if (e.code == 'weak-password') {
        msg = 'รหัสผ่านใหม่ต้องอย่างน้อย 6 ตัวอักษร';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('เกิดข้อผิดพลาด: $e')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// ================= UI COMPONENT =================

  Widget _passwordField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required bool obscure,
    required VoidCallback onToggle,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
          ),
        ],
      ),
      child: TextFormField(
        controller: controller,
        obscureText: obscure,
        decoration: InputDecoration(
          border: InputBorder.none,
          labelText: label,
          prefixIcon: Icon(icon, color: primaryGreen),
          suffixIcon: IconButton(
            icon: Icon(
              obscure ? Icons.visibility : Icons.visibility_off,
            ),
            onPressed: onToggle,
          ),
        ),
        validator: (v) {
          if (v == null || v.trim().isEmpty) {
            return 'กรุณากรอกรหัสผ่าน';
          }
          if (v.length < 6) {
            return 'รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร';
          }
          return null;
        },
      ),
    );
  }
}
