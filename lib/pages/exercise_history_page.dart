import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import '../widgets/ui_components.dart';

class ExerciseHistoryPage extends StatelessWidget {
  const ExerciseHistoryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return Scaffold(
        backgroundColor: softBackgroundColor,
        appBar: AppBar(title: const Text('ประวัติการออกกำลังกาย')),
        body: const Center(child: Text('กรุณาเข้าสู่ระบบก่อนดูประวัติ')),
      );
    }

    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: textPrimaryColor,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'ประวัติการออกกำลังกาย',
          style: TextStyle(
            color: textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .collection('exercise_history')
            .orderBy('timestamp', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('เกิดข้อผิดพลาด: ${snapshot.error}'));
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final docs = snapshot.data?.docs ?? [];

          // Process Chart Data (Last 7 Days Minutes)
          final Map<int, double> last7DaysMinutes = {};
          final now = DateTime.now();
          // Initialize 0 for last 7 days (0 = Today, 1 = Yesterday, ..., 6 = 6 days ago)
          // But for LineChart X-axis being 0..6 (Day T-6 .. T) fits better left-to-right.
          // Let's map X=0 -> T-6, X=6 -> T (Today)
          for (int i = 0; i < 7; i++) {
            last7DaysMinutes[i] = 0.0;
          }

          for (var doc in docs) {
            final data = doc.data() as Map<String, dynamic>;
            final Timestamp? ts = data['timestamp'] as Timestamp?;
            if (ts == null) continue;

            final date = ts.toDate();
            final difference = now.difference(date).inDays;

            // Check if within last 7 days (difference 0 to 6)
            // Note: difference inDays truncates. So if now is 10:00 and date is yesterday 11:00, diff is 0? No, 23h. inDays=0.
            // Better to check by day-only comparison.
            final dayDiff = DateTime(
              now.year,
              now.month,
              now.day,
            ).difference(DateTime(date.year, date.month, date.day)).inDays;

            if (dayDiff >= 0 && dayDiff < 7) {
              final xIndex = 6 - dayDiff; // 0 for 6 days ago, 6 for today

              final durationStr = data['duration_seconds'];
              int durationSec = 0;
              if (durationStr is int)
                durationSec = durationStr;
              else if (durationStr is String)
                durationSec = int.tryParse(durationStr) ?? 0;

              last7DaysMinutes[xIndex] =
                  (last7DaysMinutes[xIndex] ?? 0) + (durationSec / 60);
              // Max cap reasonable for graph? No, just sum.
            }
          }

          // Prepare Spots
          List<FlSpot> spots = [];
          last7DaysMinutes.forEach((k, v) {
            spots.add(FlSpot(k.toDouble(), v));
          });
          spots.sort((a, b) => a.x.compareTo(b.x));

          return ListView.builder(
            padding: const EdgeInsets.all(24),
            itemCount: docs.length + 1, // +1 for Chart
            itemBuilder: (context, index) {
              if (index == 0) {
                if (docs.isEmpty) return const SizedBox();
                return _buildChartSection(spots);
              }

              final docIndex = index - 1;
              final data = docs[docIndex].data() as Map<String, dynamic>;
              return _buildHistoryCard(context, data);
            },
          );
        },
      ),
    );
  }

  Widget _buildChartSection(List<FlSpot> spots) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "แนวโน้มเวลาที่ใช้ (นาที)",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: textPrimaryColor,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 5,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(color: Colors.grey[100], strokeWidth: 1);
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ), // Clean look
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        final now = DateTime.now();
                        // 6 is Today, 5 is yst...
                        final date = now.subtract(Duration(days: 6 - idx));
                        final thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
                        return Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(
                            thaiDays[date.weekday % 7], // 1=Mon .. 7=Sun
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[500],
                              fontWeight: idx == 6
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: 6,
                minY: 0,
                // Add simplistic padding to maxY
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: primaryGreen,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: Colors.white,
                          strokeWidth: 2,
                          strokeColor: primaryGreen,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: primaryGreen.withOpacity(0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, Map<String, dynamic> data) {
    final exerciseType = data['exercise'] as String? ?? 'unknown';
    final Timestamp? timestamp = data['timestamp'] as Timestamp?;
    final dateTime = timestamp?.toDate() ?? DateTime.now();

    final dateStr = DateFormat('d MMM yyyy').format(dateTime);
    // Thai format? Maybe 'd MMM yyyy' uses English locale by default if not set.
    // Let's stick to user request style, minimal change unless asked.
    final timeStr = DateFormat('HH:mm').format(dateTime);

    final totalReps = data['total'] ?? 0;
    // rounds removed or kept? user didn't say, keep it.
    final rounds = data['rounds'] ?? '-';
    final durationSec = data['duration_seconds'] ?? 0;

    // Safety for string duration
    int durationVal = 0;
    if (durationSec is int) durationVal = durationSec;
    if (durationSec is String) durationVal = int.tryParse(durationSec) ?? 0;

    final durationMin = (durationVal / 60).floor();
    final durationRemSec = durationVal % 60;
    final durationStr = '${durationMin} นาที ${durationRemSec} วิ';

    String exerciseName = 'ออกกำลังกาย';
    Color iconColor = Colors.blue;
    IconData iconData = Icons.fitness_center;

    if (exerciseType == 'dumbbell_standing') {
      exerciseName = 'ท่ายกดัมเบล (ยืน)';
      iconColor = primaryGreen;
      iconData = Icons.accessibility_new_rounded;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(iconData, color: iconColor, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      exerciseName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: textPrimaryColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today_rounded,
                          size: 14,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '$dateStr เวลา $timeStr',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: Color(0xFFF3F4F6)),
          const SizedBox(height: 16),

          // Stats Grid
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildModernStat('ซ้าย', '${data['left'] ?? 0}'),
              _buildModernStat('ขวา', '${data['right'] ?? 0}'),
              _buildModernStat('รอบ', '$rounds'),
              _buildModernStat('รวม', '$totalReps'),
              _buildModernStat('เวลา', durationStr, isWide: true),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModernStat(String label, String value, {bool isWide = false}) {
    // Handling wide content for time
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: isWide ? 14 : 18,
            fontWeight: FontWeight.bold,
            color: textPrimaryColor,
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
      ],
    );
  }
}
