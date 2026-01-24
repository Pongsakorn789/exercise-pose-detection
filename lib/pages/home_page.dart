import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'exercise_history_page.dart';
import 'exercise_selection_page.dart';
import 'instruction_page.dart';
import 'profile_page.dart';
import 'user_type_selection_page.dart';
import '../widgets/ui_components.dart';

class HomePage extends StatefulWidget {
  final String role;
  const HomePage({super.key, required this.role});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
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
      // Prevent crash if document is not ready
    }
  }

  Future<void> _logout() async {
    try {
      await _updateOnlineStatus(false);
      await FirebaseAuth.instance.signOut();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (context) => const UserTypeSelectionPage(),
          ),
          (route) => false,
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('เกิดข้อผิดพลาดในการออกจากระบบ: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return const Scaffold(body: Center(child: Text("ไม่พบข้อมูลผู้ใช้")));
    }

    return Scaffold(
      backgroundColor: softBackgroundColor,
      body: StreamBuilder<DocumentSnapshot>(
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

          final data = snapshot.data!.data() as Map<String, dynamic>;
          final name = "${data['firstName'] ?? ''} ${data['lastName'] ?? ''}";

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context, name),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      _buildWelcomeSection(),
                      const SizedBox(height: 24),

                      const Text(
                        "เมนูหลัก",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: textPrimaryColor,
                        ),
                      ),
                      const SizedBox(height: 16),

                      _buildMenuCard(
                        icon: Icons.fitness_center_rounded,
                        iconColor: Colors.blueAccent,
                        title: "เลือกโปรแกรมออกกำลังกาย",
                        subtitle: "เริ่มต้นการออกกำลังกายของคุณที่นี่",
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ExerciseSelectionPage(),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 16),

                      _buildMenuCard(
                        icon: Icons.menu_book_rounded,
                        iconColor: Colors.blueAccent,
                        title: "วิธีออกกำลังกาย",
                        subtitle: "เรียนรู้ท่าและการปฏิบัติที่ถูกต้อง",
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const InstructionSelectionPage(),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 16),

                      _buildMenuCard(
                        icon: Icons.bar_chart_rounded,
                        iconColor: Colors.orangeAccent,
                        title: "ผลการออกกำลังกาย",
                        subtitle: "ดูสถิติและความก้าวหน้าของคุณ",
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ExerciseHistoryPage(),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 24),
                      _buildTodayStats(),

                      const SizedBox(height: 24),
                      _buildHealthTip(),

                      const SizedBox(height: 32),
                      _buildEmergencyButton(),

                      const SizedBox(height: 40),
                      Center(
                        child: Text(
                          "Senior Fitness App v1.0.0",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// ===== UI Sections =====

  Widget _buildHeader(BuildContext context, String name) {
    // Current date for display
    final now = DateTime.now();
    final dateText =
        "${now.day}/${now.month}/${now.year + 543}"; // Simple Thai year formatting if preferred or use DateFormat

    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 20,
        bottom: 30,
        left: 24,
        right: 24,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "สวัสดีคุณ",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: textPrimaryColor,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "วันนี้วันที่ $dateText",
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ProfilePage()),
                      );
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: primaryGreen.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      padding: const EdgeInsets.all(12),
                      child: const Icon(
                        Icons.person_rounded,
                        color: primaryGreen,
                        size: 32,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.logout_rounded, color: Colors.red),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (c) => AlertDialog(
                            title: const Text('ออกจากระบบ'),
                            content: const Text('ต้องการออกจากระบบใช่หรือไม่?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(c),
                                child: const Text('ยกเลิก'),
                              ),
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(c);
                                  _logout();
                                },
                                style: TextButton.styleFrom(
                                  foregroundColor: Colors.red,
                                ),
                                child: const Text('ออกจากระบบ'),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryGreen, primaryGreen.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: primaryGreen.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: const Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "ได้เวลาขยับร่างกาย!",
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  "การออกกำลังกายวันละนิด ช่วยให้จิตแจ่มใสและร่างกายแข็งแรง",
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 16),
          Icon(Icons.directions_run_rounded, color: Colors.white, size: 48),
        ],
      ),
    );
  }

  Widget _buildMenuCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: iconColor, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: textPrimaryColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios_rounded,
              color: Colors.grey[300],
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodayStats() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(user!.uid)
          .collection('exercise_history')
          .orderBy('timestamp', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        int totalSessions = 0;
        int totalMinutes = 0;
        double totalCalories = 0.0;

        // Weekly data mapping: "yyyy-MM-dd" : minutes
        Map<String, int> weeklyData = {};

        // Generate last 7 days dates (including today)
        final now = DateTime.now();
        List<DateTime> last7Days = List.generate(7, (i) {
          return now.subtract(Duration(days: 6 - i));
        });

        // Initialize map with 0
        for (var date in last7Days) {
          weeklyData[DateFormat('yyyy-MM-dd').format(date)] = 0;
        }

        if (snapshot.hasData && snapshot.data!.docs.isNotEmpty) {
          totalSessions = snapshot.data!.docs.length;

          for (var doc in snapshot.data!.docs) {
            final data = doc.data() as Map<String, dynamic>;
            final reps = data['total'] as int? ?? 0;
            final durationStr = data['duration_seconds'];
            final timestamp = data['timestamp'];

            int durationSec = 0;
            if (durationStr is int)
              durationSec = durationStr;
            else if (durationStr is String)
              durationSec = int.tryParse(durationStr) ?? 0;

            final minutes = (durationSec / 60).round(); // round to minutes

            totalCalories += (reps * 0.1) + (durationSec / 60 * 2.5);
            totalMinutes += minutes;

            // Bucket into weeklyData if within range
            if (timestamp != null && timestamp is Timestamp) {
              final date = timestamp.toDate();
              final dateKey = DateFormat('yyyy-MM-dd').format(date);
              if (weeklyData.containsKey(dateKey)) {
                weeklyData[dateKey] = (weeklyData[dateKey] ?? 0) + minutes;
              }
            }
          }
        }

        // Find max for bar height normalization
        int maxMinutes = 1;
        weeklyData.forEach((_, v) {
          if (v > maxMinutes) maxMinutes = v;
        });

        final thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
        const thaiMonths = [
          'ม.ค.',
          'ก.พ.',
          'มี.ค.',
          'เม.ย.',
          'พ.ค.',
          'มิ.ย.',
          'ก.ค.',
          'ส.ค.',
          'ก.ย.',
          'ต.ค.',
          'พ.ย.',
          'ธ.ค.',
        ];

        final startDay = last7Days.first.day;
        final startMonth = thaiMonths[last7Days.first.month - 1];
        final endDay = last7Days.last.day;
        final endMonth = thaiMonths[last7Days.last.month - 1];
        final dateRangeStr = "$startDay $startMonth - $endDay $endMonth";

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "สรุปภาพรวมการออกกำลังกาย",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: textPrimaryColor,
                  ),
                ),
                Text(
                  dateRangeStr,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Bar Chart
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: last7Days.map((date) {
                      final key = DateFormat('yyyy-MM-dd').format(date);
                      final minutes = weeklyData[key] ?? 0;

                      // Calculate bar height percentage (max height 100px)
                      final height = (minutes / maxMinutes) * 100.0;
                      final showHeight = height < 5
                          ? 5.0
                          : height; // min height
                      final isToday =
                          key == DateFormat('yyyy-MM-dd').format(now);
                      final dayLabel = thaiDays[date.weekday % 7];

                      return Column(
                        children: [
                          Container(
                            height: 100, // Fixed visualization area
                            alignment: Alignment.bottomCenter,
                            child: Tooltip(
                              message: '$minutes นาที',
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 500),
                                curve: Curves.easeOut,
                                width: 20, // bar width
                                height: minutes == 0 ? 2 : showHeight,
                                decoration: BoxDecoration(
                                  color: isToday
                                      ? primaryGreen
                                      : const Color(0xFFE2E8F0),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            dayLabel,
                            style: TextStyle(
                              fontSize: 12,
                              color: isToday ? primaryGreen : Colors.grey[500],
                              fontWeight: isToday
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  ),

                  const Divider(height: 32, color: Color(0xFFF1F5F9)),

                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "สัปดาห์นี้",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: textPrimaryColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Summary Text
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _StatItem(
                        value: "$totalSessions",
                        label: "จำนวนครั้ง",
                        color: Colors.blue,
                        isSmall: true,
                      ),
                      Container(width: 1, height: 30, color: Colors.grey[200]),
                      _StatItem(
                        value: "$totalMinutes",
                        label: "นาที (รวม)",
                        color: Colors.green,
                        isSmall: true,
                      ),
                      Container(width: 1, height: 30, color: Colors.grey[200]),
                      _StatItem(
                        value: totalCalories.toStringAsFixed(0),
                        label: "แคลอรี่ (Kcal)",
                        color: Colors.orange,
                        isSmall: true,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHealthTip() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFEEBC8)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("💡", style: TextStyle(fontSize: 24)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "เกร็ดความรู้สุขภาพ",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF744210),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "การออกกำลังกายอย่างสม่ำเสมอช่วยลดความเสี่ยงของโรคหัวใจและหลอดเลือดได้",
                  style: TextStyle(
                    fontSize: 14,
                    color: const Color(0xFF975A16).withOpacity(0.8),
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

  Widget _buildEmergencyButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE53E3E),
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          shadowColor: Colors.red.withOpacity(0.4),
        ),
        onPressed: () {},
        icon: const Icon(Icons.warning_amber_rounded),
        label: const Text(
          "ขอความช่วยเหลือฉุกเฉิน",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  final bool isSmall;

  const _StatItem({
    super.key,
    required this.value,
    required this.label,
    required this.color,
    this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: isSmall ? 20 : 28,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: isSmall ? 12 : 14,
            color: Colors.grey[500],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
