import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../widgets/ui_components.dart';
import 'physio_profile_page.dart';
import 'elderly_list_page.dart';
import 'change_password_page.dart';

class PhysioSettingsPage extends StatelessWidget {
  const PhysioSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text('ตั้งค่านักกายภาพ'),
        centerTitle: true,
        backgroundColor: primaryGreen,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            /// ================= ข้อมูลส่วนตัว =================
            _sectionTitle('ข้อมูลส่วนตัว'),
            _settingTile(
              icon: Icons.person,
              title: 'แก้ไขโปรไฟล์',
              subtitle: 'ข้อมูลชื่อ เบอร์โทร และใบประกอบวิชาชีพ',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const PhysioProfilePage(),
                  ),
                );
              },
            ),

            const SizedBox(height: 8),

            /// ================= การจัดการ =================
            _sectionTitle('การจัดการ'),
            _settingTile(
              icon: Icons.group,
              title: 'ผู้สูงอายุที่ดูแล',
              subtitle: 'ดูรายชื่อและสถานะผู้สูงอายุ',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const ElderlyListPage(),
                  ),
                );
              },
            ),

            const SizedBox(height: 8),

            /// ================= ระบบ =================
            _sectionTitle('ระบบ'),
            _settingTile(
              icon: Icons.lock,
              title: 'เปลี่ยนรหัสผ่าน',
              subtitle: 'ตั้งรหัสผ่านใหม่เพื่อความปลอดภัย',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const ChangePasswordPage(),
                  ),
                );
              },
            ),

            const SizedBox(height: 12),

            _dangerTile(
              icon: Icons.logout,
              title: 'ออกจากระบบ',
              onTap: () async {
                await FirebaseAuth.instance.signOut();
                if (!context.mounted) return;
                Navigator.popUntil(context, (route) => route.isFirst);
              },
            ),
          ],
        ),
      ),
    );
  }

  /// ================= COMPONENTS =================

  Widget _sectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: textPrimaryColor,
        ),
      ),
    );
  }

  Widget _settingTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: primaryGreen.withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: primaryGreen),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: subtitle != null ? Text(subtitle) : null,
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _dangerTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.05),
        borderRadius: BorderRadius.circular(18),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.red.withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.redAccent),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.redAccent,
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}
