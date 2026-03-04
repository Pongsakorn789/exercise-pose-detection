import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'exercise_history_page.dart';
import 'exercise_selection_page.dart';
import 'instruction_page.dart';
import 'user_type_selection_page.dart';
import 'settings_page.dart';
import '../widgets/ui_components.dart';

class HomePage extends StatefulWidget {
  final String role;
  const HomePage({super.key, required this.role});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage>
    with WidgetsBindingObserver {
  final user = FirebaseAuth.instance.currentUser;
  bool _isOnline = false;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _updateOnlineStatus(true);
  }

  @override
  void dispose() {
    _updateOnlineStatus(false);
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _updateOnlineStatus(state == AppLifecycleState.resumed);
  }

  Future<void> _updateOnlineStatus(bool online) async {
    if (user == null || _isOnline == online) return;
    _isOnline = online;

    try {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(user!.uid)
          .update({
        'isOnline': online,
        'lastActive': FieldValue.serverTimestamp(),
      });
    } catch (_) {}
  }

  Future<void> _logout() async {
    await _updateOnlineStatus(false);
    await FirebaseAuth.instance.signOut();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (_) => const UserTypeSelectionPage(),
        ),
        (_) => false,
      );
    }
  }

  /// 🔤 AppBar Title ตามหน้า
  String _getAppBarTitle() {
    switch (_currentIndex) {
      case 0:
        return 'หน้าแรก';
      case 1:
        return ''; // เลือกท่าออกกำลังกาย
      case 2:
        return ''; // วิธีออกกำลังกาย
      case 3:
        return ''; // ประวัติ
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return const Scaffold(
        body: Center(child: Text("ไม่พบข้อมูลผู้ใช้")),
      );
    }

    return Scaffold(
      backgroundColor: softBackgroundColor,

      /// ☰ Drawer
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              const ListTile(
                leading: Icon(Icons.menu),
                title: Text(
                  'เมนู',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
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
                      builder: (_) => const SettingsPage(),
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('ออกจากระบบ'),
                onTap: _logout,
              ),
            ],
          ),
        ),
      ),

      /// 🧭 AppBar (เปลี่ยน title ตามหน้า)
      appBar: AppBar(
        title: Text(_getAppBarTitle()),
        centerTitle: true,
        elevation: 0,
      ),

      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(user!.uid)
              .snapshots(),
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final data = snapshot.data!.data()!;
            final name =
                "${data['firstName'] ?? ''} ${data['lastName'] ?? ''}".trim();

            final program =
                data['exerciseProgram'] as Map<String, dynamic>?;

            return IndexedStack(
              index: _currentIndex,
              children: [
                _homeContent(name, program),
                const ExerciseSelectionPage(),
                const InstructionSelectionPage(),
                ExerciseHistoryPage(elderlyId: user!.uid),
              ],
            );
          },
        ),
      ),

      /// 🔽 Bottom Navigation
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: primaryGreen,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'หน้าแรก',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.play_circle),
            label: 'ออกกำลังกาย',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.ondemand_video),
            label: 'วิธีทำ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart),
            label: 'ประวัติ',
          ),
        ],
      ),
    );
  }

  /// ================= HOME CONTENT =================

  Widget _homeContent(
    String name,
    Map<String, dynamic>? program,
  ) {
    final date = DateFormat('dd/MM/yyyy').format(DateTime.now());

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _welcomeHeader(name, date),
          const SizedBox(height: 24),

          _todayProgramHero(program),
          const SizedBox(height: 24),

          _dailyMotivationCard(),
          const SizedBox(height: 32),

          primaryButton(
            text: 'เริ่มออกกำลังกาย',
            icon: Icons.play_arrow,
            onPressed: () {
              setState(() => _currentIndex = 1);
            },
          ),
        ],
      ),
    );
  }

  /// 👋 Header
  Widget _welcomeHeader(String name, String date) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: primaryGreen.withOpacity(0.15),
            child: const Icon(
              Icons.person,
              size: 32,
              color: primaryGreen,
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'สวัสดีคุณ $name',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'วันนี้ $date',
                style: TextStyle(
                  fontSize: 16,
                  color: textSecondaryColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 🌈 โปรแกรมวันนี้
  Widget _todayProgramHero(Map<String, dynamic>? program) {
    final name = program?['exerciseName'] ?? 'ยังไม่มีโปรแกรม';
    final rounds = program?['roundsPerDay'] ?? 0;
    final reps = program?['repsPerRound'] ?? 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF22C55E),
            Color(0xFF14B8A6),
            Color(0xFF38BDF8),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF22C55E).withOpacity(0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.favorite, color: Colors.white, size: 26),
              SizedBox(width: 10),
              Text(
                'โปรแกรมออกกำลังกายวันนี้',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.18),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (rounds > 0 && reps > 0) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                _infoBadge(
                  icon: Icons.repeat,
                  label: 'วันละ $rounds รอบ',
                ),
                const SizedBox(width: 12),
                _infoBadge(
                  icon: Icons.fitness_center,
                  label: 'รอบละ $reps ครั้ง',
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  /// 💚 กำลังใจวันนี้
  Widget _dailyMotivationCard() {
    final messages = [
      'วันนี้คุณเก่งมาก แค่เริ่มก็ถือว่าชนะแล้ว 💪',
      'ขยับร่างกายวันละนิด สุขภาพดีขึ้นทุกวัน 🌱',
      'ทำเท่าที่ไหวก็พอ คุณกำลังดูแลตัวเองอยู่ 💚',
      'ทุกการเคลื่อนไหวคือก้าวสำคัญของสุขภาพ 😊',
    ];

    final message = (messages..shuffle()).first;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFDCFCE7),
            Color(0xFFE0F2FE),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: primaryGreen.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.favorite,
              color: primaryGreen,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'กำลังใจวันนี้',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  message,
                  style: TextStyle(
                    fontSize: 16,
                    color: textSecondaryColor,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 🏷 Badge
  Widget _infoBadge({
    required IconData icon,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.25),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
