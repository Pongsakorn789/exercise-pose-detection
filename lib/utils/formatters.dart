import 'package:flutter/services.dart';

class ThaiIdInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // เอาเฉพาะตัวเลข
    String digitsOnly =
        newValue.text.replaceAll(RegExp(r'[^0-9]'), '');

    // จำกัด 13 หลัก
    if (digitsOnly.length > 13) {
      digitsOnly = digitsOnly.substring(0, 13);
    }

    final buffer = StringBuffer();

    for (int i = 0; i < digitsOnly.length; i++) {
      buffer.write(digitsOnly[i]);

      // ใส่ขีดตามตำแหน่ง
      if ((i == 0 || i == 4 || i == 9 || i == 11) &&
          i != digitsOnly.length - 1) {
        buffer.write('-');
      }
    }

    final formatted = buffer.toString();

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(
        offset: formatted.length,
      ),
    );
  }
}
