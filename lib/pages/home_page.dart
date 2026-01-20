import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'exercise_selection_page.dart';
import '../widgets/ui_components.dart';

class HomePage extends StatefulWidget {
  final String role;
  const HomePage({super.key, required this.role});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage>
    with WidgetsBindingObserver {
  final User? user = FirebaseAuth.instance.currentUser;

  bool _isOnline = false;

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
    if (state == AppLifecycleState.resumed) {
      _updateOnlineStatus(true);
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      _updateOnlineStatus(false);
    }
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
    } catch (_) {
      // ป้องกัน crash ถ้า document ยังไม่พร้อม
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
      backgroundColor: Colors.grey[100],
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(user!.uid)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (!snapshot.hasData || snapshot.data!.data() == null) {
              return const Center(child: Text("ไม่พบข้อมูลผู้ใช้"));
            }

            final data =
                snapshot.data!.data() as Map<String, dynamic>;
            final name =
                "${data['firstName'] ?? ''} ${data['lastName'] ?? ''}";

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _header(context, name),
                  const SizedBox(height: 20),
                  _welcomeCard(),
                  const SizedBox(height: 20),
                  _menuTitle("เมนูหลัก"),

                  _menuCard(
                    icon: "💪",
                    title: "เลือกโปรแกรมออกกำลังกาย",
                    subtitle:
                        "เลือกโปรแกรมที่เหมาะสมกับคุณ และเริ่มออกกำลังกายได้เลย",
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ExerciseSelectionPage(),
                        ),
                      );
                    },
                  ),

                  _menuCard(
                    icon: "📊",
                    title: "ดูผลออกกำลังกายที่ผ่านมา",
                    subtitle:
                        "ดูประวัติและผลการออกกำลังกาย พร้อมสถิติความก้าวหน้า",
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text("ฟีเจอร์นี้กำลังพัฒนา"),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 20),
                  _todayStats(),
                  const SizedBox(height: 20),
                  _healthTip(),
                  const SizedBox(height: 20),
                  _emergencyButton(),
                  const SizedBox(height: 30),

                  const Center(
                    child: Text(
                      "Senior Fitness App\nเวอร์ชัน 1.0.0",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  /// ===== UI =====

  Widget _header(BuildContext context, String name) {
    final timeText = TimeOfDay.now().format(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: primaryGreen,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "สวัสดี",
                style: TextStyle(color: Colors.white70, fontSize: 18),
              ),
              Text(
                "คุณ $name",
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Text(
            timeText,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
            ),
          ),
        ],
      ),
    );
  }

  Widget _welcomeCard() {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Padding(
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            Text("🏋️‍♂️", style: TextStyle(fontSize: 40)),
            SizedBox(height: 10),
            Text(
              "ยินดีต้อนรับสู่\nแอปพลิเคชันออกกำลังกายผู้สูงอายุ",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: primaryGreen,
              ),
            ),
            SizedBox(height: 10),
            Text(
              "เลือกเมนูด้านล่างเพื่อเริ่มต้นออกกำลังกาย",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18),
            ),
          ],
        ),
      ),
    );
  }

  Widget _menuTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _menuCard({
    required String icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          radius: 28,
          backgroundColor: Colors.green[100],
          child: Text(icon, style: const TextStyle(fontSize: 26)),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 16)),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: onTap,
      ),
    );
  }

  Widget _todayStats() {
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _StatItem(icon: "🏃‍♂️", value: "0", label: "ครั้ง"),
            _StatItem(icon: "⏱️", value: "0", label: "นาที"),
            _StatItem(icon: "🔥", value: "0", label: "แคลอรี่"),
          ],
        ),
      ),
    );
  }

  Widget _healthTip() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange[100],
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Text(
        "💡 การออกกำลังกายสม่ำเสมอช่วยให้ร่างกายแข็งแรง",
        style: TextStyle(fontSize: 18),
      ),
    );
  }

  Widget _emergencyButton() {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        onPressed: () {},
        child: const Text(
          "🚨 ปุ่มฉุกเฉิน",
          style: TextStyle(fontSize: 22),
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String icon;
  final String value;
  final String label;

  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(icon, style: const TextStyle(fontSize: 28)),
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: primaryGreen,
          ),
        ),
        Text(label),
      ],
    );
  }
}
