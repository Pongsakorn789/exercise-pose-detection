import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_demo/utils/constants.dart';

import 'exercise_history_page.dart';
import 'exercise_program_edit_page.dart';

class ElderlyDetailPage extends StatelessWidget {
  final String elderlyId;
  final String elderlyName;

  const ElderlyDetailPage({
    super.key,
    required this.elderlyId,
    required this.elderlyName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: Text(elderlyName),
        centerTitle: true,
      ),
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(elderlyId)
              .snapshots(),
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final data = snapshot.data!.data()!;
            final program = data['exerciseProgram'];

            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                /// 🌈 HEADER
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
                  child: Row(
                    children: const [
                      Icon(Icons.person, color: Colors.white, size: 40),
                      SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          'ข้อมูลผู้สูงอายุ',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                _infoCard(
                  title: 'ข้อมูลทั่วไป',
                  children: [
                    _infoText('ชื่อ', elderlyName),
                    _infoText('อายุ', '${data['age'] ?? "-"} ปี'),
                    _infoText('เพศ', data['gender'] ?? "-"),
                    _infoText('โรคประจำตัว', data['disease'] ?? "-"),
                    if (data['height'] != null)
                      _infoText('ส่วนสูง', '${data['height']} ซม.'),
                    if (data['weight'] != null)
                      _infoText('น้ำหนัก', '${data['weight']} กก.'),
                  ],
                ),

                const SizedBox(height: 20),

                _infoCard(
                  title: 'โปรแกรมออกกำลังกาย',
                  accentColor: primaryGreen,
                  children: program == null
                      ? const [
                          Text(
                            'ยังไม่ได้ตั้งโปรแกรม',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ]
                      : [
                          _infoText(
                              'ท่า', program['exerciseName'] ?? "-"),
                          _infoText(
                              'วันละ',
                              '${program['roundsPerDay'] ?? "-"} รอบ'),
                          _infoText(
                              'รอบละ',
                              '${program['repsPerRound'] ?? "-"} ครั้ง'),
                        ],
                ),

                const SizedBox(height: 28),

                Row(
                  children: [
                    Expanded(
                      child: _actionButton(
                        icon: Icons.bar_chart,
                        text: 'ประวัติ',
                        color: Colors.blueGrey,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ExerciseHistoryPage(
                                elderlyId: elderlyId,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _actionButton(
                        icon: Icons.edit,
                        text: 'ปรับโปรแกรม',
                        color: primaryGreen,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ExerciseProgramEditPage(
                                elderlyId: elderlyId,
                                elderlyName: elderlyName,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _infoCard({
    required String title,
    Color accentColor = Colors.transparent,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: accentColor == Colors.transparent
            ? null
            : Border(left: BorderSide(color: accentColor, width: 4)),
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
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _infoText(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text('$label: $value'),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required String text,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ElevatedButton.icon(
      icon: Icon(icon),
      label: Text(text),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      onPressed: onTap,
    );
  }
}
