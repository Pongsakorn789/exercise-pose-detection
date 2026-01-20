import 'package:flutter/material.dart';
import 'dumbbell_exercise_page.dart';
import 'hip_exercise_page.dart';

class ExerciseSelectionPage extends StatelessWidget {
  const ExerciseSelectionPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('เลือกท่าออกกำลังกาย'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [

            // ===== ท่าที่ 1 =====
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 60),
                backgroundColor: Colors.teal,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const DumbbellExercisePage(),
                  ),
                );
              },
              child: const Text(
                'ท่ายกดัมเบลแบบยืน',
                style: TextStyle(fontSize: 18),
              ),
            ),

            const SizedBox(height: 16),

            // ===== 🆕 ท่าที่ 2 =====
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 60),
                backgroundColor: Colors.deepOrange,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const HipExercisePage(),
                  ),
                );
              },
              child: const Text(
                'ท่าบริหารสะโพกด้านข้าง',
                style: TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
