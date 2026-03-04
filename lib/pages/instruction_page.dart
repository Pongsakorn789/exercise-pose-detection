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
            // =========================
            // การ์ดที่ 1
            // =========================
            _buildInstructionCard(
              context,
              title: 'ท่ายกดัมเบลแบบยืน',
              subtitle: 'เรียนรู้วิธีการยกดัมเบลที่ถูกต้อง',
              icon: Icons.fitness_center_rounded,
              color: primaryGreen,
              steps: [
                'ยืนตัวตรง แยกเท้าห่างกันประมาณระดับหัวไหล่',
                'ถือดัมเบลในมือทั้งสองข้าง แขนแนบลำตัว',
                'เริ่มยกแขนขึ้นด้านข้างจนถึงตำแหน่งแถบสีเขียวบนหน้าจอ',
                'แถบสีเขียวแสดงถึงท่าเริ่มต้นที่ถูกต้อง แอปจะเริ่มนับเวลาอัตโนมัติ 2 วินาที',
                'หลังจากครบเวลา ให้ยกแขนขึ้นต่อจนถึงตำแหน่งแถบสีแดง',
                'แถบสีแดงแสดงถึงท่าสิ้นสุดของการยกแขนเหนือศีรษะ',
                'เมื่อแขนอยู่ในแถบสีแดง แอปจะนับเวลาอัตโนมัติอีก 2 วินาที',
                'เมื่อทำครบทั้งแถบสีเขียวและแถบสีแดง ระบบจะนับเป็น 1 ครั้ง',
                'ทำซ้ำตามจำนวนครั้งที่นักกายภาพกำหนด',
              ],

              tips: [
                'ยกแขนช้า ๆ และควบคุมการเคลื่อนไหว',
                'หลีกเลี่ยงการเหวี่ยงแขนหรือแอ่นหลัง',
                'หากมีอาการปวดหรือเวียนศีรษะให้หยุดทันที',
              ],
            ),

            const SizedBox(height: 16),

            // =========================
            // การ์ดที่ 2
            // =========================
            _buildInstructionCard(
              context,
              title: 'ท่าบริหารสะโพกด้านข้าง',
              subtitle: 'เทคนิคการบริหารสะโพกและขา',
              icon: Icons.accessibility_new_rounded,
              color: Colors.orange,
              steps: [
                'ยืนตัวตรง เท้าวางราบกับพื้น แยกเท้ากว้างประมาณระดับหัวไหล่',
                'ใช้มือจับพนักเก้าอี้หรือผนังเพื่อช่วยพยุงร่างกาย',
                'ถ่ายน้ำหนักตัวไปที่ขาข้างหนึ่ง โดยให้ลำตัวตั้งตรง',
                'ค่อย ๆ ยกขาอีกข้างออกไปด้านข้าง โดยให้ปลายเท้าชี้ไปด้านหน้า',
                'ยกขาในมุมประมาณ 30–45 องศา หรือจนถึงตำแหน่งแถบสีเขียวบนหน้าจอแอป',
                'เมื่อขาอยู่ในตำแหน่งที่ถูกต้อง แอปจะเริ่มนับเวลาอัตโนมัติประมาณ 2 วินาที',
                'ค่อย ๆ วางขากลับสู่ท่าเริ่มต้นอย่างช้า ๆ และควบคุมการเคลื่อนไหว',
                'ระบบจะนับจำนวนครั้งให้อัตโนมัติเมื่อทำท่าถูกต้อง',
                'ทำซ้ำตามจำนวนครั้งที่กำหนด แล้วสลับทำอีกข้าง',
              ],

              tips: [
                'ไม่ควรยกขาสูงเกินไป เพื่อป้องกันการบาดเจ็บ',
                'ควรเคลื่อนไหวอย่างช้า ๆ และควบคุมการทรงตัว',
                'หากมีอาการปวด เวียนศีรษะ หรือเสียการทรงตัว ให้หยุดทันที',
                'จำนวนครั้งควรอยู่ภายใต้การดูแลของนักกายภาพบำบัด',
              ],

            ),
          ],
        ),
      ),
    );
  }

  // ==================================================
  // Instruction Card
  // ==================================================
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
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
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

// ==================================================
// Detail Page
// ==================================================
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
        title: Text(
          title,
          style: const TextStyle(
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
            const SizedBox(height: 32),

            _buildSectionTitle(
              Icons.format_list_numbered_rounded,
              'ขั้นตอนการฝึก',
            ),
            const SizedBox(height: 16),
            ...steps.asMap().entries.map(
              (entry) => _buildStepItem(entry.key + 1, entry.value),
            ),

            const SizedBox(height: 32),
            _buildSectionTitle(
              Icons.lightbulb_outline_rounded,
              'ข้อแนะนำ / สิ่งที่ควรระวัง',
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
