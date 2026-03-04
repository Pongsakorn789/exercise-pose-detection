import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:fl_chart/fl_chart.dart';

import '../widgets/ui_components.dart';
import 'elderly_list_page.dart';
import 'physio_profile_page.dart';
import 'physio_settings_page.dart';
import 'user_type_selection_page.dart';

class PhysioHomePage extends StatefulWidget {
  const PhysioHomePage({super.key});

  @override
  State<PhysioHomePage> createState() => _PhysioHomePageState();
}

class _PhysioHomePageState extends State<PhysioHomePage> {
  int _currentIndex = 0;

  Future<void> _logout(BuildContext context) async {
    await FirebaseAuth.instance.signOut();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const UserTypeSelectionPage()),
      (_) => false,
    );
  }

  String get _appBarTitle {
    switch (_currentIndex) {
      case 0:
        return 'แดชบอร์ดนักกายภาพ';
      case 1:
        return 'ผู้สูงอายุ';
      case 2:
        return 'โปรไฟล์';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,

      /// ☰ Drawer
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              const ListTile(
                leading: Icon(Icons.medical_services),
                title: Text(
                  'เมนูนักกายภาพ',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('ตั้งค่า'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const PhysioSettingsPage(),
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('ออกจากระบบ'),
                onTap: () => _logout(context),
              ),
            ],
          ),
        ),
      ),

      appBar: AppBar(
        title: Text(_appBarTitle),
        centerTitle: true,
      ),

      body: SafeArea(
        bottom: true,
        child: IndexedStack(
          index: _currentIndex,
          children: [
            _dashboard(),
            const ElderlyListPage(),
            const PhysioProfilePage(),
          ],
        ),
      ),

      /// 🔽 Bottom Navigation
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: primaryGreen,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'แดชบอร์ด',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'ผู้สูงอายุ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'โปรไฟล์',
          ),
        ],
      ),
    );
  }

  /// ================= DASHBOARD =================

  Widget _dashboard() {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .where('role', isEqualTo: 'elderly')
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final docs = snapshot.data!.docs;
        final total = docs.length;
        final online =
            docs.where((d) => d.data()['isOnline'] == true).length;
        final offline = total - online;

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            /// 🌈 HERO HEADER
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF0F766E),
                    Color(0xFF14B8A6),
                    Color(0xFF38BDF8),
                  ],
                ),
              ),
              child: const Text(
                'ภาพรวมผู้สูงอายุที่ดูแล',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),

            const SizedBox(height: 24),

            /// 📊 SUMMARY
            Row(
              children: [
                _summaryCard(
                  title: 'ทั้งหมด',
                  value: total,
                  icon: Icons.people,
                  color: primaryGreen,
                  bgColor: primaryGreen.withOpacity(0.12),
                ),
                const SizedBox(width: 12),
                _summaryCard(
                  title: 'ออนไลน์',
                  value: online,
                  icon: Icons.check_circle,
                  color: Colors.green,
                  bgColor: Colors.green.withOpacity(0.12),
                ),
                const SizedBox(width: 12),
                _summaryCard(
                  title: 'ออฟไลน์',
                  value: offline,
                  icon: Icons.remove_circle,
                  color: Colors.redAccent,
                  bgColor: Colors.redAccent.withOpacity(0.12),
                ),
              ],
            ),

            const SizedBox(height: 24),

            /// 🍩 DONUT
            _onlineStatusDonut(
              online: online,
              offline: offline,
            ),

            const SizedBox(height: 32),

            const Text(
              'เมนูการจัดการ',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: textPrimaryColor,
              ),
            ),
            const SizedBox(height: 12),

            _menuTile(
              icon: Icons.list_alt,
              title: 'รายชื่อผู้สูงอายุ',
              onTap: () => setState(() => _currentIndex = 1),
            ),
          ],
        );
      },
    );
  }

  /// ================= COMPONENTS =================

  Widget _summaryCard({
    required String title,
    required int value,
    required IconData icon,
    required Color color,
    required Color bgColor,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 8),
            Text(
              value.toString(),
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: textPrimaryColor,
              ),
            ),
            Text(title),
          ],
        ),
      ),
    );
  }

  Widget _onlineStatusDonut({
    required int online,
    required int offline,
  }) {
    final total = online + offline;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'สถานะผู้สูงอายุ',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 16),

          SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                centerSpaceRadius: 55,
                sectionsSpace: 4,
                sections: [
                  PieChartSectionData(
                    value: online.toDouble(),
                    color: Colors.green,
                    radius: 34,
                    title: '',
                  ),
                  PieChartSectionData(
                    value: offline.toDouble(),
                    color: Colors.redAccent,
                    radius: 34,
                    title: '',
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),
          Text(
            'รวม $total คน',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: textPrimaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _menuTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: ListTile(
        leading: Icon(icon, color: primaryGreen),
        title: Text(title),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }
}
