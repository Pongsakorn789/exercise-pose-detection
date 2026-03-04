import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../widgets/ui_components.dart';

class PhysioProfilePage extends StatefulWidget {
  const PhysioProfilePage({super.key});

  @override
  State<PhysioProfilePage> createState() => _PhysioProfilePageState();
}

class _PhysioProfilePageState extends State<PhysioProfilePage> {
  final _formKey = GlobalKey<FormState>();

  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _licenseCtrl = TextEditingController();
  final _birthCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();

  bool _loading = true;
  bool _saving = false;

  String get uid => FirebaseAuth.instance.currentUser!.uid;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _licenseCtrl.dispose();
    _birthCtrl.dispose();
    _ageCtrl.dispose();
    super.dispose();
  }

  // ================= LOAD =================

  Future<void> _loadProfile() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .get();

      if (!doc.exists || doc.data() == null) return;

      final d = doc.data()!;
      _firstNameCtrl.text = d['firstName'] ?? '';
      _lastNameCtrl.text = d['lastName'] ?? '';
      _emailCtrl.text = d['email'] ?? '';
      _phoneCtrl.text = d['phoneNumber'] ?? '';
      _licenseCtrl.text = d['licenseNumber'] ?? '';
      _birthCtrl.text = d['birthDate'] ?? '';
      _ageCtrl.text = d['age']?.toString() ?? '';
    } catch (_) {
      _showSnack('ไม่สามารถโหลดข้อมูลได้', error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // ================= SAVE =================

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);

    try {
      await FirebaseFirestore.instance.collection('users').doc(uid).update({
        'firstName': _firstNameCtrl.text.trim(),
        'lastName': _lastNameCtrl.text.trim(),
        'phoneNumber': _phoneCtrl.text.trim(),
        'licenseNumber': _licenseCtrl.text.trim(),
        'birthDate': _birthCtrl.text.trim(),
        'age': int.tryParse(_ageCtrl.text) ?? 0,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      _showSnack('บันทึกข้อมูลเรียบร้อย');
    } catch (e) {
      _showSnack('เกิดข้อผิดพลาด: $e', error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showSnack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: error ? Colors.red : primaryGreen,
      ),
    );
  }

  // ================= UI =================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text('โปรไฟล์นักกายภาพ'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    _avatar(),
                    const SizedBox(height: 32),

                    Row(
                      children: [
                        Expanded(
                          child: _input(
                            label: 'ชื่อ',
                            controller: _firstNameCtrl,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _input(
                            label: 'นามสกุล',
                            controller: _lastNameCtrl,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    _input(
                      label: 'อีเมล',
                      controller: _emailCtrl,
                      readOnly: true,
                    ),
                    const SizedBox(height: 16),

                    _input(
                      label: 'วันเกิด',
                      controller: _birthCtrl,
                    ),
                    const SizedBox(height: 16),

                    _input(
                      label: 'อายุ (ปี)',
                      controller: _ageCtrl,
                      readOnly: true,
                    ),
                    const SizedBox(height: 16),

                    _input(
                      label: 'เบอร์โทรศัพท์',
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      formatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                    ),
                    const SizedBox(height: 16),

                    _input(
                      label: 'เลขใบประกอบวิชาชีพ',
                      controller: _licenseCtrl,
                    ),
                    const SizedBox(height: 40),

                    primaryButton(
                      text: 'บันทึกข้อมูล',
                      icon: Icons.save,
                      onPressed: _saving ? () {} : _saveProfile,
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  // ================= COMPONENTS =================

  Widget _avatar() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: primaryGreen, width: 3),
      ),
      child: const CircleAvatar(
        radius: 60,
        backgroundColor: Colors.white,
        child: Icon(Icons.person, size: 80, color: Colors.grey),
      ),
    );
  }

  Widget _input({
    required String label,
    required TextEditingController controller,
    bool readOnly = false,
    TextInputType keyboardType = TextInputType.text,
    List<TextInputFormatter>? formatters,
  }) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      keyboardType: keyboardType,
      inputFormatters: formatters,
      style: const TextStyle(fontSize: 18),
      decoration: inputDecoration(label),
      validator: readOnly
          ? null
          : (v) => v == null || v.trim().isEmpty
              ? 'กรุณากรอก $label'
              : null,
    );
  }
}
