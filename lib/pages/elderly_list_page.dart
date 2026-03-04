import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_demo/utils/constants.dart';
import 'elderly_detail_page.dart';

class ElderlyListPage extends StatefulWidget {
  const ElderlyListPage({super.key});

  @override
  State<ElderlyListPage> createState() => _ElderlyListPageState();
}

class _ElderlyListPageState extends State<ElderlyListPage> {
  String keyword = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: softBackgroundColor,
      appBar: AppBar(
        title: const Text('ผู้สูงอายุที่ดูแล'),
        centerTitle: true,
        backgroundColor: primaryGreen,
      ),
      body: SafeArea(
        child: Column(
          children: [
            /// 🔍 search
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'ค้นหาชื่อผู้สูงอายุ',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (val) {
                  setState(() {
                    keyword = val.trim();
                  });
                },
              ),
            ),

            /// 📄 list
            Expanded(
              child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                stream: FirebaseFirestore.instance
                    .collection('users')
                    .where('role', isEqualTo: 'elderly')
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState ==
                      ConnectionState.waiting) {
                    return const Center(
                        child: CircularProgressIndicator());
                  }

                  if (!snapshot.hasData ||
                      snapshot.data!.docs.isEmpty) {
                    return const Center(
                        child: Text('ไม่พบผู้สูงอายุ'));
                  }

                  /// ✅ filter แบบไม่พัง
                  final docs = snapshot.data!.docs.where((doc) {
                    final data = doc.data();

                    final firstName =
                        data['firstName']?.toString() ?? '';
                    final lastName =
                        data['lastName']?.toString() ?? '';
                    final name = '$firstName $lastName';

                    return name.contains(keyword);
                  }).toList();

                  if (docs.isEmpty) {
                    return const Center(
                        child: Text('ไม่พบผู้สูงอายุ'));
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: docs.length,
                    itemBuilder: (context, i) {
                      final doc = docs[i];
                      final data = doc.data();

                      /// ✅ safe fields
                      final firstName =
                          data['firstName']?.toString() ??
                              'ไม่ระบุชื่อ';
                      final lastName =
                          data['lastName']?.toString() ?? '';
                      final name = '$firstName $lastName';

                      final age = data['age']?.toString() ?? '-';
                      final online = data['isOnline'] == true;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: online
                                ? Colors.green[100]
                                : Colors.grey[300],
                            child: Icon(
                              Icons.person,
                              color: online
                                  ? Colors.green
                                  : Colors.grey,
                            ),
                          ),
                          title: Text(
                            name,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text('อายุ $age ปี'),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: online
                                  ? Colors.green.withOpacity(0.15)
                                  : Colors.redAccent.withOpacity(0.15),
                              borderRadius:
                                  BorderRadius.circular(12),
                            ),
                            child: Text(
                              online ? 'ออนไลน์' : 'ออฟไลน์',
                              style: TextStyle(
                                color: online
                                    ? Colors.green
                                    : Colors.redAccent,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ElderlyDetailPage(
                                  elderlyId: doc.id,
                                  elderlyName: name,
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
