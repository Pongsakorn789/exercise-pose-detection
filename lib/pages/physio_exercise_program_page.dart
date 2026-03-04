import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../widgets/ui_components.dart';

class PhysioExerciseProgramPage extends StatefulWidget {
  final String elderlyId;
  final String elderlyName;

  const PhysioExerciseProgramPage({
    super.key,
    required this.elderlyId,
    required this.elderlyName,
  });

  @override
  State<PhysioExerciseProgramPage> createState() =>
      _PhysioExerciseProgramPageState();
}

class _PhysioExerciseProgramPageState
    extends State<PhysioExerciseProgramPage> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController exerciseController =
      TextEditingController(text: 'โปรแกรมพื้นฐาน');
  final TextEditingController roundsController =
      TextEditingController(text: '10');
  final TextEditingController repsController =
      TextEditingController(text: '10');

  bool isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadCurrentProgram();
  }

  /// 🔹 โหลดโปรแกรมเดิม (ถ้ามี)
  Future<void> _loadCurrentProgram() async {
    final doc = await FirebaseFirestore.instance
        .collection('users')
        .doc(widget.elderlyId)
        .get();

    final data = doc.data();
    if (data != null && data['exerciseProgram'] != null) {
      final program = data['exerciseProgram'];
      exerciseController.text = program['exerciseName'] ?? '';
      roundsController.text =
          program['roundsPerDay']?.toString() ?? '10';
      repsController.text =
          program['repsPerRound']?.toString() ?? '10';
    }
  }

  /// 🔹 บันทึกโปรแกรม
  Future<void> _saveProgram() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => isSaving = true);

    try {
      final physioUid = FirebaseAuth.instance.currentUser!.uid;

      await FirebaseFirestore.instance
          .collection('users')
          .doc(widget.elderlyId)
          .update({
        'exerciseProgram': {
          'exerciseName': exerciseController.text.trim(),
          'roundsPerDay': int.parse(roundsController.text),
          'repsPerRound': int.parse(repsController.text),
          'updatedAt': FieldValue.serverTimestamp(),
          'updatedBy': physioUid,
        }
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('บันทึกโปรแกรมออกกำลังกายเรียบร้อย'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('เกิดข้อผิดพลาด: $e')),
      );
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'ตั้งค่าโปรแกรมออกกำลังกาย',
          style: TextStyle(color: textPrimaryColor),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ผู้สูงอายุ: ${widget.elderlyName}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
              const SizedBox(height: 24),

              _inputField(
                controller: exerciseController,
                label: 'ชื่อท่าออกกำลังกาย',
                icon: Icons.fitness_center_rounded,
              ),
              const SizedBox(height: 16),

              _inputField(
                controller: roundsController,
                label: 'จำนวนรอบต่อวัน',
                icon: Icons.loop_rounded,
                isNumber: true,
              ),
              const SizedBox(height: 16),

              _inputField(
                controller: repsController,
                label: 'จำนวนครั้งต่อรอบ',
                icon: Icons.repeat_rounded,
                isNumber: true,
              ),

              const Spacer(),

              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryGreen,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: isSaving ? null : _saveProgram,
                  child: isSaving
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'บันทึกโปรแกรม',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _inputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isNumber = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType:
          isNumber ? TextInputType.number : TextInputType.text,
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'กรุณากรอกข้อมูล';
        }
        if (isNumber && int.tryParse(value) == null) {
          return 'กรุณากรอกตัวเลข';
        }
        return null;
      },
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: primaryGreen),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
