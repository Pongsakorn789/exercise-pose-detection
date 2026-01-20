import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// ฟังก์ชันสมัครสมาชิก
  Future<User?> register({
    required String email,
    required String password,
    required String role, // 'elderly' หรือ 'physio'
  }) async {
    try {
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // บันทึก role ลงใน Firestore
      if (userCredential.user != null) {
        await _firestore.collection('users').doc(userCredential.user!.uid).set({
          'email': email,
          'role': role,
          'createdAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true)); // ใช้ merge เพื่อไม่ลบข้อมูลเดิม
      }

      return userCredential.user;
    } catch (e) {
      print('Error during registration: $e');
      rethrow;
    }
  }

  /// ฟังก์ชันเข้าสู่ระบบ
  Future<User?> login({
    required String email,
    required String password,
  }) async {
    try {
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return userCredential.user;
    } catch (e) {
      print('Error during login: $e');
      rethrow;
    }
  }

  /// ฟังก์ชันออกจากระบบ
  Future<void> logout() async {
    try {
      await _auth.signOut();
    } catch (e) {
      print('Error during logout: $e');
      rethrow;
    }
  }

  /// ฟังก์ชันดึง role ของผู้ใช้จาก Firestore
  Future<String?> getUserRole(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      
      if (doc.exists) {
        final data = doc.data();
        return data?['role'] as String?;
      }
      return null;
    } catch (e) {
      print('Error getting user role: $e');
      return null;
    }
  }

  /// ฟังก์ชันดึงข้อมูลผู้ใช้ทั้งหมดจาก Firestore
  Future<Map<String, dynamic>?> getUserData(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (e) {
      print('Error getting user data: $e');
      return null;
    }
  }

  /// ฟังก์ชันอัปเดตข้อมูลผู้ใช้
  Future<void> updateUserData(String uid, Map<String, dynamic> data) async {
    try {
      await _firestore.collection('users').doc(uid).update(data);
    } catch (e) {
      print('Error updating user data: $e');
      rethrow;
    }
  }

  /// ฟังก์ชันตรวจสอบว่าผู้ใช้เข้าสู่ระบบอยู่หรือไม่
  User? get currentUser => _auth.currentUser;

  /// Stream สำหรับติดตามสถานะการเข้าสู่ระบบ
  Stream<User?> get authStateChanges => _auth.authStateChanges();
}