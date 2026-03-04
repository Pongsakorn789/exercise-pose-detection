import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/ui_components.dart';

class ExerciseProgramEditPage extends StatefulWidget {
  final String elderlyId;
  final String elderlyName;

  const ExerciseProgramEditPage({
    super.key,
    required this.elderlyId,
    required this.elderlyName,
  });

  @override
  State<ExerciseProgramEditPage> createState() =>
      _ExerciseProgramEditPageState();
}

class _ExerciseProgramEditPageState
    extends State<ExerciseProgramEditPage> {
  String exerciseId = 'dumbbell_standing';
  String exerciseName = 'ท่ายกดัมเบลแบบยืน';

  final roundsCtrl = TextEditingController(text: '10');

  bool _saving = false;

  @override
  void dispose() {
    roundsCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final rounds = int.tryParse(roundsCtrl.text.trim());
    const int reps = 10; // 🔒 ล็อกไว้ที่ 10 ครั้ง

    /// ✅ Validate input (เช็คเฉพาะจำนวนรอบ)
    if (rounds == null || rounds <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('กรุณากรอกจำนวนรอบเป็นตัวเลขมากกว่า 0'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _saving = true);

    try {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(widget.elderlyId)
          .update({
        'exerciseProgram': {
          'exerciseId': exerciseId,
          'exerciseName': exerciseName,
          'roundsPerDay': rounds,
          'repsPerRound': reps, // = 10 ตลอด
          'updatedAt': FieldValue.serverTimestamp(),
        }
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('บันทึกโปรแกรมเรียบร้อย'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context);
    } on FirebaseException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('บันทึกไม่สำเร็จ: ${e.message}'),
          backgroundColor: Colors.red,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('เกิดข้อผิดพลาด: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text('ตั้งค่าโปรแกรมออกกำลังกาย'),
        centerTitle: true,
        backgroundColor: primaryGreen,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              /// 🌈 HEADER
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF0F766E),
                      Color(0xFF14B8A6),
                      Color(0xFF38BDF8),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: primaryGreen.withOpacity(0.35),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.fitness_center,
                      color: Colors.white,
                      size: 40,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ตั้งค่าโปรแกรม',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.elderlyName,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              /// 🏋️ EXERCISE SELECT
              _card(
                title: 'เลือกท่าออกกำลังกาย',
                child: DropdownButtonFormField<String>(
                  value: exerciseId,
                  decoration: _inputDecoration('ท่าออกกำลังกาย'),
                  items: const [
                    DropdownMenuItem(
                      value: 'dumbbell_standing',
                      child: Text('ท่ายกดัมเบลแบบยืน'),
                    ),
                    DropdownMenuItem(
                      value: 'hip_abduction',
                      child: Text('ท่าบริหารสะโพกด้านข้าง'),
                    ),
                  ],
                  onChanged: (val) {
                    if (val == null) return;
                    setState(() {
                      exerciseId = val;
                      exerciseName = val == 'hip_abduction'
                          ? 'ท่าบริหารสะโพกด้านข้าง'
                          : 'ท่ายกดัมเบลแบบยืน';
                    });
                  },
                ),
              ),

              const SizedBox(height: 20),

              /// 🔁 ROUNDS / REPS
              _card(
                title: 'จำนวนการฝึก',
                child: Column(
                  children: [
                    TextField(
                      controller: roundsCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          _inputDecoration('จำนวนรอบต่อวัน'),
                    ),
                    const SizedBox(height: 12),

                    /// 🔒 จำนวนครั้ง (แก้ไม่ได้)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          vertical: 16, horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Text(
                        'จำนวนครั้งต่อรอบ: 10 ครั้ง',
                        style: TextStyle(
                          fontSize: 16,
                          color: textPrimaryColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              /// 💾 SAVE BUTTON
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: _saving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.save),
                  label: Text(
                    _saving ? 'กำลังบันทึก...' : 'บันทึกโปรแกรม',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryGreen,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    elevation: 6,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// ================= UI COMPONENTS =================

  Widget _card({
    required String title,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
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
          child,
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.grey[100],
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
    );
  }
}
