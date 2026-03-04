import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';

class ElderlyExerciseHistoryWidget extends StatelessWidget {
  final String elderlyId;

  const ElderlyExerciseHistoryWidget({
    super.key,
    required this.elderlyId,
  });

  DateTime _parseDate(dynamic raw) {
    if (raw is Timestamp) return raw.toDate();
    if (raw is String) return DateTime.parse(raw);
    return DateTime.now();
  }

  @override
  Widget build(BuildContext context) {
    /// ⭐ ดึงข้อมูล user (เอา roundsPerDay)
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(elderlyId)
          .snapshots(),
      builder: (context, userSnap) {
        if (!userSnap.hasData) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: CircularProgressIndicator(),
          );
        }

        final userData =
            userSnap.data!.data() as Map<String, dynamic>;
        final program =
            userData['exerciseProgram'] as Map<String, dynamic>?;

        final int roundsPerDay =
            program?['roundsPerDay'] ?? 0;

        return StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(elderlyId)
              .collection('exercise_history')
              .orderBy('timestamp', descending: true)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState ==
                ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              );
            }

            final docs = snapshot.data?.docs ?? [];

            if (docs.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(16),
                child: Text('ยังไม่มีประวัติการออกกำลังกาย'),
              );
            }

            final history = docs
                .map((e) => e.data() as Map<String, dynamic>)
                .toList();

            /// ⭐ รวมจำนวนรอบต่อวัน (7 วัน)
            final Map<DateTime, int> dailyRounds = {};

            for (final h in history) {
              final DateTime date =
                  _parseDate(h['timestamp'] ?? h['date']);
              final day =
                  DateTime(date.year, date.month, date.day);

              final int rounds = h['rounds'] ?? 0;
              dailyRounds[day] =
                  (dailyRounds[day] ?? 0) + rounds;
            }

            final today = DateTime.now();
            final days = List.generate(7, (i) {
              final d =
                  today.subtract(Duration(days: 6 - i));
              return DateTime(d.year, d.month, d.day);
            });

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                /// ================= GRAPH =================
                if (roundsPerDay > 0)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'จำนวนรอบการออกกำลังกาย (7 วัน)',
                          style: TextStyle(
                              fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        AspectRatio(
                          aspectRatio: 1.8,
                          child: BarChart(
                            BarChartData(
                              minY: 0,
                              maxY:
                                  (roundsPerDay * 1.5)
                                      .toDouble(),
                              barGroups:
                                  List.generate(days.length,
                                      (i) {
                                final actual =
                                    dailyRounds[days[i]] ??
                                        0;

                                return BarChartGroupData(
                                  x: i,
                                  barsSpace: 6,
                                  barRods: [
                                    /// 🔵 ทำจริง
                                    BarChartRodData(
                                      toY: actual.toDouble(),
                                      color: Colors.blue,
                                      width: 12,
                                    ),
                                    /// ⚪ ตามโปรแกรม
                                    BarChartRodData(
                                      toY: roundsPerDay
                                          .toDouble(),
                                      color: Colors.grey,
                                      width: 12,
                                    ),
                                  ],
                                );
                              }),
                              titlesData: FlTitlesData(
                                bottomTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    getTitlesWidget:
                                        (value, meta) {
                                      final i =
                                          value.toInt();
                                      return Text(
                                        DateFormat('dd/MM')
                                            .format(
                                                days[i]),
                                        style:
                                            const TextStyle(
                                                fontSize:
                                                    10),
                                      );
                                    },
                                  ),
                                ),
                                leftTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    getTitlesWidget:
                                        (value, meta) {
                                      return Text(
                                          value
                                              .toInt()
                                              .toString(),
                                          style:
                                              const TextStyle(
                                                  fontSize:
                                                      10));
                                    },
                                  ),
                                ),
                                rightTitles: AxisTitles(
                                  sideTitles:
                                      SideTitles(
                                          showTitles:
                                              false),
                                ),
                                topTitles: AxisTitles(
                                  sideTitles:
                                      SideTitles(
                                          showTitles:
                                              false),
                                ),
                              ),
                              gridData:
                                  FlGridData(show: true),
                              borderData:
                                  FlBorderData(show: false),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: const [
                            Icon(Icons.square,
                                color: Colors.blue,
                                size: 12),
                            SizedBox(width: 4),
                            Text('รอบที่ทำจริง'),
                            SizedBox(width: 16),
                            Icon(Icons.square,
                                color: Colors.grey,
                                size: 12),
                            SizedBox(width: 4),
                            Text('รอบตามโปรแกรม'),
                          ],
                        ),
                      ],
                    ),
                  ),

                /// ================= HISTORY LIST =================
                ...docs.map((doc) {
                  final data =
                      doc.data() as Map<String, dynamic>;

                  final DateTime date = _parseDate(
                      data['timestamp'] ?? data['date']);

                  final durationSec =
                      _readDurationInSeconds(data);

                  return Container(
                    margin:
                        const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius:
                          BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment:
                          MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          DateFormat(
                                  'd MMM yyyy • HH:mm')
                              .format(date),
                          style: const TextStyle(
                              fontWeight: FontWeight.bold),
                        ),
                        Text(_formatDuration(durationSec)),
                      ],
                    ),
                  );
                }).toList(),
              ],
            );
          },
        );
      },
    );
  }

  int _readDurationInSeconds(Map<String, dynamic> data) {
    if (data['duration_seconds'] != null) {
      return (data['duration_seconds'] as num).toInt();
    }
    if (data['duration'] != null) {
      return (data['duration'] as num).toInt() * 60;
    }
    return 0;
  }

  String _formatDuration(int seconds) {
    if (seconds < 60) return '$seconds วินาที';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return s == 0 ? '$m นาที' : '$m นาที $s วินาที';
  }
}
