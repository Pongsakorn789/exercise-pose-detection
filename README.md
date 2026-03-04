# FitAI (PJ-FINAL)

แอปพลิเคชัน Flutter สำหรับช่วยในการออกกำลังกายและกายภาพบำบัด ติดตามผลการฝึก และจัดการข้อมูลสุขภาพ

## 📋 ภาพรวมโปรเจค (Overview)
FitAI พัฒนาขึ้นเพื่อเป็นเครื่องมือช่วยในการดูแลสุขภาพ โดยเชื่อมต่อข้อมูลผ่าน Firebase ทำให้สามารถเก็บประวัติและติดตามความคืบหน้าของผู้ใช้งานได้อย่างมีประสิทธิภาพ รองรับการใช้งานทั้งในรูปแบบผู้ใช้ทั่วไปและนักกายภาพบำบัด

## ✨ ฟีเจอร์หลัก (Key Features)

### 👥 การจัดการผู้ใช้งาน (User Management)
- **ระบบคัดกรองผู้ใช้**: หน้า `UserTypeSelectionPage` สำหรับเลือกประเภทผู้ใช้งาน
- **การลงทะเบียนและเข้าสู่ระบบ**: แยก Flow ระหว่างผู้ใช้ทั่วไปและนักกายภาพ (`Login`/`Register` และ `PhysioLogin`/`PhysioRegister`)
- **ข้อมูลส่วนตัว**: หน้า `ProfilePage` สำหรับดูและแก้ไขข้อมูลส่วนตัว วันเกิด อายุ

### 🏋️‍♂️ การออกกำลังกายและการติดตาม (Exercise & Tracking)
- **โหมดออกกำลังกาย**:
  - ท่ายกน้ำหนัก (Dumbbell Exercise)
  - ท่าบริหารสะโพก (Hip Exercise)
- **ประวัติการฝึก**: หน้า `ExerciseHistoryPage` แสดงรายการบันทึกการออกกำลังกายย้อนหลัง (วันที่, เวลา, จำนวนครั้ง, ระยะเวลา)
- **คำแนะนำ**: หน้า `InstructionPage` สำหรับสอนท่าทางที่ถูกต้อง

### 📊 อื่นๆ (Others)
- **WebView**: สำหรับเปิดเนื้อหาเว็บภายนอกภายในแอป
- **Dashboard**: หน้า `HomePage` สรุปภาพรวม

## 🛠 เทคโนโลยี (Tech Stack)
- **Framework**: Flutter (Dart)
- **Backend**: Firebase (Authentication, Cloud Firestore)
- **Key Packages**:
  - `firebase_auth`, `cloud_firestore`: ระบบฐานข้อมูลและยืนยันตัวตน
  - `fl_chart`: แสดงผลกราฟข้อมูล
  - `flutter_inappwebview`: เว็บเบราว์เซอร์ในแอป
  - `intl`: จัดรูปแบบวันที่และเวลา

## 🚀 การเริ่มต้นใช้งาน (Getting Started)
1. **ติดตั้ง Flutter SDK**: ตรวจสอบว่าติดตั้ง Flutter เรียบร้อยแล้ว
2. **Clone Repository**: ดาวน์โหลดซอร์สโค้ด
3. **ติดตั้ง Libraries**:
   ```bash
   flutter pub get
   ```
4. **รันเชื่อต่อกับอุปกรณ์**:
   ```bash
   flutter run
   ```

> **Note**: โปรเจคนี้ใช้ Firebase กรุณาตรวจสอบการตั้งค่า `firebase_options.dart` ให้ถูกต้องก่อนรัน

---
*Created for PJ-FINAL*
# exercise-pose-detection
