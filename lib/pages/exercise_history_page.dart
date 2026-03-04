import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:firebase_demo/utils/constants.dart';

/// ================= DATE PARSER =================
DateTime parseDate(dynamic raw) {
  if (raw == null) return DateTime.fromMillisecondsSinceEpoch(0);
  if (raw is Timestamp) return raw.toDate();
  if (raw is String) {
    try {
      return DateTime.parse(raw);
    } catch (_) {}
  }
  return DateTime.fromMillisecondsSinceEpoch(0);
}

/// ================= DURATION =================
int readDurationSeconds(Map<String, dynamic> data) {
  if (data['duration_seconds'] != null) {
    return (data['duration_seconds'] as num).toInt();
  }
  if (data['duration'] != null) {
    return (data['duration'] as num).toInt() * 60;
  }
  return 0;
}

String formatDuration(int seconds) {
  if (seconds <= 0) return '-';
  final m = seconds ~/ 60;
  final s = seconds % 60;
  if (m == 0) return '$s วินาที';
  if (s == 0) return '$m นาที';
  return '$m นาที $s วินาที';
}

/// ================= DISPLAY NAME =================
String getExerciseDisplayName(String key) {
  switch (key) {
    case 'dumbbell_standing':
      return 'ท่ายกดัมเบลแบบยืน';
    case 'hip_adduction_standing':
      return 'ท่าบริหารสะโพกด้านข้างแบบยืน';
    default:
      return 'ไม่ระบุชื่อท่า';
  }
}

/// ================= SUMMARY GRAPH (ROUNDS) =================
class WeeklySummaryChart extends StatelessWidget {
  final List<Map<String, dynamic>> history;

  const WeeklySummaryChart({super.key, required this.history});

  @override
  Widget build(BuildContext context) {
    /// รวมจำนวน "รอบ" ต่อวัน
    final Map<DateTime, int> dailyRounds = {};

    for (final h in history) {
      final d = parseDate(h['timestamp'] ?? h['date']);
      final day = DateTime(d.year, d.month, d.day);
      final rounds = (h['rounds'] as num?)?.toInt() ?? 0;
      dailyRounds[day] = (dailyRounds[day] ?? 0) + rounds;
    }

    final today = DateTime.now();
    final days = List.generate(7, (i) {
      final d = today.subtract(Duration(days: 6 - i));
      return DateTime(d.year, d.month, d.day);
    });

    /// ป้องกันกราฟพัง + ทำแกนอ่านง่าย
    final double maxValue = dailyRounds.values.isEmpty
        ? 5.0
        : ((dailyRounds.values.reduce((a, b) => a > b ? a : b) / 5)
                    .ceil() *
                5)
            .toDouble();

    final double interval = maxValue <= 0 ? 1.0 : maxValue / 5;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'สรุปจำนวนรอบการออกกำลังกาย (7 วันล่าสุด)',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 200,
          child: BarChart(
            BarChartData(
              minY: 0,
              maxY: maxValue,
              barGroups: List.generate(days.length, (i) {
                return BarChartGroupData(
                  x: i,
                  barRods: [
                    BarChartRodData(
                      toY: (dailyRounds[days[i]] ?? 0).toDouble(),
                      width: 18,
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ],
                );
              }),
              titlesData: FlTitlesData(
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, _) {
                      final i = value.toInt();
                      if (i < 0 || i >= days.length) {
                        return const SizedBox.shrink();
                      }
                      return Text(
                        DateFormat('dd/MM').format(days[i]),
                        style: const TextStyle(fontSize: 12),
                      );
                    },
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: interval,
                    getTitlesWidget: (value, _) => Text(
                      value.toInt().toString(),
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ),
                rightTitles:
                    AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles:
                    AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              gridData: FlGridData(
                show: true,
                horizontalInterval: interval,
                drawVerticalLine: false,
              ),
              borderData: FlBorderData(show: false),
            ),
          ),
        ),
      ],
    );
  }
}

class ExerciseHistoryPage extends StatelessWidget {
  final String? elderlyId;
  const ExerciseHistoryPage({super.key, this.elderlyId});

  @override
  Widget build(BuildContext context) {
    final uid = elderlyId ?? FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      return const Scaffold(
        body: Center(child: Text('ไม่พบข้อมูลผู้ใช้')),
      );
    }

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .collection('exercise_history')
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final docs = snapshot.data!.docs;
        if (docs.isEmpty) {
          return const Scaffold(
            body: Center(child: Text('ยังไม่มีประวัติการออกกำลังกาย')),
          );
        }

        final history = docs
            .map((e) => e.data() as Map<String, dynamic>)
            .toList()
          ..sort((a, b) {
            final da = parseDate(a['timestamp'] ?? a['date']);
            final db = parseDate(b['timestamp'] ?? b['date']);
            return db.compareTo(da);
          });

        /// ===== GROUP BY EXERCISE =====
        final Map<String, List<Map<String, dynamic>>> grouped = {};
        for (final h in history) {
          final key = (h['exerciseType'] as String?) ?? 'unknown';
          grouped.putIfAbsent(key, () => []);
          grouped[key]!.add(h);
        }

        return Scaffold(
          backgroundColor: softBackgroundColor,
          appBar: AppBar(
            title: const Text('ประวัติการออกกำลังกาย'),
            centerTitle: true,
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              /// ===== SUMMARY GRAPH =====
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: WeeklySummaryChart(history: history),
                ),
              ),
              const SizedBox(height: 24),

              /// ===== DETAIL BY EXERCISE =====
              ...grouped.entries.map((entry) {
                final exerciseKey = entry.key;
                final records = entry.value;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      getExerciseDisplayName(exerciseKey),
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),

                    ...records.map((data) {
                      final date =
                          parseDate(data['timestamp'] ?? data['date']);
                      final rounds =
                          (data['rounds'] as num?)?.toInt() ?? 0;
                      final left =
                          (data['left'] as num?)?.toInt() ?? 0;
                      final right =
                          (data['right'] as num?)?.toInt() ?? 0;
                      final total =
                          (data['total'] as num?)?.toInt() ??
                              (left + right);
                      final durationSec =
                          readDurationSeconds(data);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              Text(
                                  'วันที่: ${DateFormat('d MMM yyyy').format(date)}'),
                              Text(
                                  'เวลา: ${DateFormat('HH:mm').format(date)} น.'),
                              const SizedBox(height: 8),
                              Text('จำนวนรอบ: $rounds รอบ'),
                              Text('จำนวนครั้งรวม: $total ครั้ง'),
                              Text('ขาซ้าย: $left ครั้ง'),
                              Text('ขาขวา: $right ครั้ง'),
                              Text(
                                  'ระยะเวลา: ${formatDuration(durationSec)}'),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 24),
                  ],
                );
              }),
            ],
          ),
        );
      },
    );
  }
}
