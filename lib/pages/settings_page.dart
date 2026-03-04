import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../widgets/ui_components.dart';
import 'profile_page.dart';
import 'login_page.dart';
import '../app_font_scale.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Future<void> _logout(BuildContext context) async {
    await FirebaseAuth.instance.signOut();
    if (context.mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'ตั้งค่า',
          style: TextStyle(
            color: textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: textPrimaryColor),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildSettingItem(
              icon: Icons.person,
              title: 'แก้ไขข้อมูลส่วนตัว',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const ProfilePage(),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),

            /// ⭐ เมนูตัวอักษรขนาดใหญ่
            _buildFontSizeSwitch(),
            const SizedBox(height: 12),

            _buildSettingItem(
              icon: Icons.lock,
              title: 'เปลี่ยนรหัสผ่าน',
              onTap: () async {
                final user = FirebaseAuth.instance.currentUser;
                if (user?.email != null) {
                  await FirebaseAuth.instance
                      .sendPasswordResetEmail(email: user!.email!);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('ส่งลิงก์เปลี่ยนรหัสผ่านไปที่อีเมลแล้ว'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                }
              },
            ),
            const SizedBox(height: 12),

            _buildSettingItem(
              icon: Icons.logout,
              title: 'ออกจากระบบ',
              isDanger: true,
              onTap: () => _logout(context),
            ),
          ],
        ),
      ),
    );
  }

  /// เมนู Switch ตัวอักษรใหญ่
  Widget _buildFontSizeSwitch() {
    return ValueListenableBuilder<double>(
      valueListenable: appTextScale,
      builder: (context, scale, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.text_fields, color: primaryGreen),
              const SizedBox(width: 16),
              const Expanded(
                child: Text(
                  'ตัวอักษรขนาดใหญ่',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Switch(
                value: scale > 1.0,
                onChanged: (value) {
                  appTextScale.value = value ? 1.3 : 1.0;
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSettingItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isDanger = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isDanger ? Colors.red : primaryGreen,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: isDanger ? Colors.red : textPrimaryColor,
                ),
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16),
          ],
        ),
      ),
    );
  }
}
