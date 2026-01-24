import 'package:flutter/services.dart';

class ThaiIdInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var text = newValue.text;

    if (newValue.selection.baseOffset == 0) {
      return newValue;
    }

    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      var nonZeroIndex = i + 1;
      if (nonZeroIndex <= 1 && nonZeroIndex != text.length) {
        buffer.write('-'); // After 1st digit
      } else if (nonZeroIndex == 5 && nonZeroIndex != text.length) {
        buffer.write(
          '-',
        ); // After 5th digit (actually 5th char including hyphens?)
        // Wait, text here includes user input. If I use digits only logic it's safer.
      }
    }

    // Better approach: strip all non-digits, then re-format
    String newText = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (newText.length > 13) newText = newText.substring(0, 13);

    buffer.clear();
    for (int i = 0; i < newText.length; i++) {
      buffer.write(newText[i]);
      if ((i == 0 || i == 4 || i == 9 || i == 11) && i != newText.length - 1) {
        buffer.write('-');
      }
    }

    String string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}
