import 'package:flutter/material.dart';
import '../widgets/ui_components.dart';

class InstructionSelectionPage extends StatelessWidget {
  const InstructionSelectionPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'วิธีออกกำลังกาย',
          style: TextStyle(
            color: textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: textPrimaryColor,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildInstructionCard(
              context,
              title: 'ท่ายกดัมเบลแบบยืน',
              subtitle: 'เรียนรู้วิธีการยกดัมเบลที่ถูกต้อง',
              icon: Icons.fitness_center_rounded,
              color: primaryGreen,
              steps: [
                'ยืนตัวตรง แยกเท้าห่างกันประมาณหัวไหล่',
                'ถือดัมเบลในมือทั้งสองข้าง แขนเหยียดตรงข้างลำตัว',
                'หมุนข้อมือให้ฝ่ามือหันไปด้านหน้า',
                'หายใจออก พร้อมเกร็งแขนยกดัมเบลขึ้นมาทางหัวไหล่',
                'ค้างไว้สักครู่ แล้วค่อยๆ ผ่อนแรงลดดัมเบลลงพร้อมหายใจเข้า',
                'ทำซ้ำ 10-15 ครั้งต่อเซต',
              ],
              tips: [
                'อย่าเหวี่ยงตัวหรือใช้แรงจากหลังช่วยยก',
                'ล็อกข้อศอกให้อยู่กับที่ ไม่ขยับไปมา',
                'เลือกน้ำหนักดัมเบลที่เหมาะสม ไม่หนักเกินไป',
              ],
            ),
            const SizedBox(height: 16),
            _buildInstructionCard(
              context,
              title: 'ท่าบริหารสะโพกด้านข้าง',
              subtitle: 'เทคนิคการบริหารสะโพกและขา',
              icon: Icons.accessibility_new_rounded,
              color: Colors.orange,
              steps: [
                'ยืนตัวตรง มือจับพนักเก้าอี้หรือกำแพงเพื่อทรงตัว',
                'ถ่ายน้ำหนักไปที่ขาข้างซ้าย',
                'เกร็งหน้าท้อง แล้วค่อยๆ กางขาขวาออกไปด้านข้าง',
                'พยายามให้ปลายเท้าชี้ไปด้านหน้า ไม่หมุนออก',
                'ยกขาให้สูงเท่าที่ทำได้โดยที่ลำตัวไม่เอียง',
                'ค่อยๆ วางขากลับสู่ท่าเริ่มต้น',
                'ทำครบ 10 ครั้งแล้วสลับทำอีกข้าง',
              ],
              tips: [
                'ลำตัวต้องตั้งตรงตลอดเวลา ไม่เอียงตัวตามขา',
                'เคลื่อนไหวช้าๆ เพื่อโฟกัสกล้ามเนื้อ',
                'ระวังอย่าเตะขาสูงเกินไปจนเจ็บสะโพก',
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required List<String> steps,
    required List<String> tips,
  }) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => InstructionDetailPage(
              title: title,
              icon: icon,
              color: color,
              steps: steps,
              tips: tips,
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 32),
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
}

class InstructionDetailPage extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final List<String> steps;
  final List<String> tips;

  const InstructionDetailPage({
    super.key,
    required this.title,
    required this.icon,
    required this.color,
    required this.steps,
    required this.tips,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text(
          "รายละเอียดท่านั่ง",
          style: TextStyle(
            color: textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ), // Title placeholders, let's use the actual title passed?
        // Actually user might want specific "วิธีทำ..." title.
        // Let's just use 'วิธีฝึก...' + title
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: textPrimaryColor,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Image/Icon
            Center(
              child: Container(
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 80, color: color),
              ),
            ),
            const SizedBox(height: 24),
            Center(
              child: Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: textPrimaryColor,
                ),
              ),
            ),
            const SizedBox(height: 32),

            _buildSectionTitle(
              Icons.format_list_numbered_rounded,
              "ขั้นตอนการฝึก",
            ),
            const SizedBox(height: 16),
            ...steps.asMap().entries.map(
              (entry) => _buildStepItem(entry.key + 1, entry.value),
            ),

            const SizedBox(height: 32),
            _buildSectionTitle(
              Icons.lightbulb_outline_rounded,
              "ข้อแนะนำ / สิ่งที่ควรระวัง",
            ),
            const SizedBox(height: 16),
            Column(children: tips.map((tip) => _buildTipItem(tip)).toList()),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: primaryGreen),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: textPrimaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildStepItem(int index, String text) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: primaryGreen.withOpacity(0.2),
            child: Text(
              "$index",
              style: const TextStyle(
                color: primaryGreen,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 16,
                color: textPrimaryColor,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTipItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Icon(Icons.circle, size: 8, color: Colors.orange),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 16,
                color: textSecondaryColor,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
