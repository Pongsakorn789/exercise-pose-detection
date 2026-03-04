import 'package:firebase_demo/utils/formatters.dart' show ThaiIdInputFormatter;
import 'package:flutter/services.dart';


import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../auth/auth_service.dart';
import '../widgets/ui_components.dart';

class RegisterPage extends StatefulWidget {
  final String role;
  const RegisterPage({super.key, required this.role});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final auth = AuthService();

  final firstNameCtrl = TextEditingController();
  final lastNameCtrl = TextEditingController();
  final birthCtrl = TextEditingController();
  final ageCtrl = TextEditingController();
  final heightCtrl = TextEditingController();
  final weightCtrl = TextEditingController();
  final bmiCtrl = TextEditingController();
  final idCardCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  final confirmCtrl = TextEditingController();

  // ⭐ เพิ่ม: เพศ
  String? gender; // male / female / other

  // ⭐ เพิ่ม: โรคประจำตัว
  final List<String> chronicOptions = [
    'ไม่มีโรคประจำตัว',
    'เบาหวาน',
    'ความดันโลหิตสูง',
    'โรคหัวใจ',
    'โรคไขมันในเลือดสูง',
    'โรคข้อเข่าเสื่อม',
    'โรคหลอดเลือดสมอง',
  ];
  List<String> selectedChronic = [];

  bool acceptPolicy = false;
  bool acceptNews = false;
  bool isLoading = false;

  @override
  void dispose() {
    firstNameCtrl.dispose();
    lastNameCtrl.dispose();
    birthCtrl.dispose();
    ageCtrl.dispose();
    heightCtrl.dispose();
    weightCtrl.dispose();
    bmiCtrl.dispose();
    idCardCtrl.dispose();
    passCtrl.dispose();
    confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> pickBirthDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1960),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: primaryGreen,
              onPrimary: Colors.white,
              onSurface: textPrimaryColor,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final now = DateTime.now();
      int age = now.year - picked.year;
      if (now.month < picked.month ||
          (now.month == picked.month && now.day < picked.day)) {
        age--;
      }
      birthCtrl.text = "${picked.day}/${picked.month}/${picked.year}";
      ageCtrl.text = age.toString();
    }
  }

  void calculateBMI() {
    final h = double.tryParse(heightCtrl.text);
    final w = double.tryParse(weightCtrl.text);

    if (h != null && w != null && h > 0) {
      final bmi = w / ((h / 100) * (h / 100));
      bmiCtrl.text = bmi.toStringAsFixed(1);
    } else {
      _showError("กรุณากรอกส่วนสูงและน้ำหนักให้ถูกต้อง");
    }
  }

  Future<void> _register() async {
    if (firstNameCtrl.text.trim().isEmpty) {
      _showError("กรุณากรอกชื่อ");
      return;
    }

    if (lastNameCtrl.text.trim().isEmpty) {
      _showError("กรุณากรอกนามสกุล");
      return;
    }

    if (birthCtrl.text.isEmpty) {
      _showError("กรุณาเลือกวันเกิด");
      return;
    }

    if (heightCtrl.text.trim().isEmpty || weightCtrl.text.trim().isEmpty) {
      _showError("กรุณากรอกส่วนสูงและน้ำหนัก");
      return;
    }

    if (bmiCtrl.text.isEmpty) {
      _showError("กรุณาคำนวณ BMI");
      return;
    }

    // ⭐ เพิ่ม validation เพศ
    if (gender == null) {
      _showError("กรุณาเลือกเพศ");
      return;
    }

    final cleanId = idCardCtrl.text.replaceAll('-', '').trim();
    if (cleanId.length != 13) {
      _showError("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
      return;
    }

    if (passCtrl.text.isEmpty) {
      _showError("กรุณาตั้งรหัสผ่าน");
      return;
    }

    if (passCtrl.text.length < 6) {
      _showError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (passCtrl.text != confirmCtrl.text) {
      _showError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!acceptPolicy) {
      _showError("กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก");
      return;
    }

    setState(() => isLoading = true);

    try {
      final user = await auth.register(
        email: "$cleanId@senior.app",
        password: passCtrl.text,
        role: 'elderly',
      );

      if (!mounted || user == null) {
        setState(() => isLoading = false);
        return;
      }

      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        // 🔹 ของเดิม
        'firstName': firstNameCtrl.text.trim(),
        'lastName': lastNameCtrl.text.trim(),
        'birthDate': birthCtrl.text,
        'age': int.parse(ageCtrl.text),
        'height': double.parse(heightCtrl.text),
        'weight': double.parse(weightCtrl.text),
        'bmi': double.parse(bmiCtrl.text),
        'idCard': cleanId,
        'acceptedPolicy': acceptPolicy,
        'acceptNews': acceptNews,
        'role': 'elderly',
        'email': "$cleanId@senior.app",

        // ⭐ เพิ่ม
        'gender': gender,
        'chronicDiseases': selectedChronic,

        'createdAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: textPrimaryColor,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: const Text(
          "สมัครสมาชิก",
          style: TextStyle(
            color: textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            /// 👤 ข้อมูลส่วนตัว
            _buildSectionContainer(
              title: "ข้อมูลส่วนตัว",
              icon: Icons.person_rounded,
              children: [
                _buildTextField(
                  label: "ชื่อ",
                  controller: firstNameCtrl,
                  icon: Icons.text_fields_rounded,
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "นามสกุล",
                  controller: lastNameCtrl,
                  icon: Icons.text_fields_rounded,
                ),
                const SizedBox(height: 12),

                // ⭐ เพศ
                const Text(
                  "เพศ",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: textPrimaryColor,
                  ),
                ),
                Row(
                  children: [
                    _genderRadio("ชาย", "male"),
                    _genderRadio("หญิง", "female"),
                    _genderRadio("อื่น ๆ", "other"),
                  ],
                ),

                GestureDetector(
                  onTap: pickBirthDate,
                  child: AbsorbPointer(
                    child: _buildTextField(
                      label: "วัน/เดือน/ปีเกิด",
                      controller: birthCtrl,
                      icon: Icons.calendar_today_rounded,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "อายุ (ปี)",
                  controller: ageCtrl,
                  icon: Icons.cake_rounded,
                  enabled: false,
                ),
              ],
            ),
            

            const SizedBox(height: 24),

            /// ⚠️ โรคประจำตัว
            _buildSectionContainer(
              title: "โรคประจำตัว",
              icon: Icons.warning_rounded,
              children: chronicOptions
                  .map(
                    (disease) => CheckboxListTile(
                      value: selectedChronic.contains(disease),
                      title: Text(disease),
                      activeColor: primaryGreen,
                      controlAffinity: ListTileControlAffinity.leading,
                      onChanged: (checked) {
                        setState(() {
                          if (disease == 'ไม่มีโรคประจำตัว') {
                            selectedChronic =
                                checked == true ? [disease] : [];
                          } else {
                            selectedChronic.remove('ไม่มีโรคประจำตัว');
                            checked == true
                                ? selectedChronic.add(disease)
                                : selectedChronic.remove(disease);
                          }
                        });
                      },
                    ),
                  )
                  .toList(),
            ),

            const SizedBox(height: 24),

            /// ❤️ ข้อมูลสุขภาพ (ของเดิม)
            _buildSectionContainer(
              title: "ข้อมูลสุขภาพ",
              icon: Icons.favorite_rounded,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        label: "ส่วนสูง (ซม.)",
                        controller: heightCtrl,
                        icon: Icons.height_rounded,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTextField(
                        label: "น้ำหนัก (กก.)",
                        controller: weightCtrl,
                        icon: Icons.monitor_weight_rounded,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: calculateBMI,
                    icon: const Icon(Icons.calculate_rounded),
                    label: const Text("คำนวณ BMI"),
                  ),
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "BMI",
                  controller: bmiCtrl,
                  icon: Icons.speed_rounded,
                  enabled: false,
                ),
              ],
            ),

            const SizedBox(height: 24),

            /// 🔐 บัญชีผู้ใช้ (ของเดิม)
            _buildSectionContainer(
              title: "ข้อมูลบัญชีผู้ใช้",
              icon: Icons.lock_outline_rounded,
              children: [
                _buildTextField(
                  label: "เลขบัตรประชาชน (13 หลัก)",
                  controller: idCardCtrl,
                  icon: Icons.credit_card_rounded,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    ThaiIdInputFormatter(),
                  ],
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "รหัสผ่าน",
                  controller: passCtrl,
                  icon: Icons.lock_rounded,
                  obscure: true,
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  label: "ยืนยันรหัสผ่าน",
                  controller: confirmCtrl,
                  icon: Icons.lock_reset_rounded,
                  obscure: true,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _register(),
                ),
              ],
            ),

            const SizedBox(height: 24),

            CheckboxListTile(
              value: acceptPolicy,
              onChanged: (v) => setState(() => acceptPolicy = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              activeColor: primaryGreen,
              title: const Text(
                "ฉันยอมรับ เงื่อนไขการใช้งาน และนโยบายการคุ้มครองข้อมูลส่วนบุคคล",
                style: TextStyle(fontSize: 14, color: textPrimaryColor),
              ),
            ),

            CheckboxListTile(
              value: acceptNews,
              onChanged: (v) => setState(() => acceptNews = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              activeColor: primaryGreen,
              title: const Text(
                "ฉันต้องการรับข่าวสารและคำแนะนำ (ไม่บังคับ)",
                style: TextStyle(fontSize: 14, color: textPrimaryColor),
              ),
            ),

            const SizedBox(height: 32),

            SizedBox(
              height: 56,
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryGreen,
                  elevation: 4,
                  shadowColor: primaryGreen.withOpacity(0.4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                onPressed: isLoading ? null : _register,
                child: isLoading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        "ลงทะเบียนใช้งาน",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _genderRadio(String label, String value) {
    return Expanded(
      child: RadioListTile<String>(
        title: Text(label),
        value: value,
        groupValue: gender,
        activeColor: primaryGreen,
        onChanged: (v) => setState(() => gender = v),
      ),
    );
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 4),
      ),
    );
  }
}

// ================== ADD MISSING METHODS ==================

Widget _buildSectionContainer({
  required String title,
  required IconData icon,
  required List<Widget> children,
}) {
  return Container(
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
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: primaryGreen, size: 24),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: textPrimaryColor,
              ),
            ),
          ],
        ),
        const Divider(height: 24),
        ...children,
      ],
    ),
  );
}

Widget _buildTextField({
  required TextEditingController controller,
  required String label,
  required IconData icon,
  bool obscure = false,
  bool enabled = true,
  TextInputType keyboardType = TextInputType.text,
  List<TextInputFormatter>? inputFormatters,
  TextInputAction? textInputAction,
  Function(String)? onSubmitted,
}) {
  return TextField(
    controller: controller,
    obscureText: obscure,
    enabled: enabled,
    keyboardType: keyboardType,
    inputFormatters: inputFormatters,
    textInputAction: textInputAction,
    onSubmitted: onSubmitted,
    style: const TextStyle(fontSize: 16, color: textPrimaryColor),
    decoration: InputDecoration(
      labelText: label,
      prefixIcon: Icon(
        icon,
        color: enabled ? primaryGreen : Colors.grey,
      ),
      filled: true,
      fillColor: enabled ? const Color(0xFFF9FAFB) : Colors.grey[100],
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryGreen, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        vertical: 16,
        horizontal: 16,
      ),
    ),
  );
}
String genderToThai(String? gender) {
  switch (gender) {
    case 'male':
      return 'ชาย';
    case 'female':
      return 'หญิง';
    case 'other':
      return 'อื่น ๆ';
    default:
      return '-';
  }
}
