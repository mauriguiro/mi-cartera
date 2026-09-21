import 'package:intl/intl.dart';
import 'package:flutter/services.dart';

String formatCurrency(double amount) {
  // Configura separadores de miles con punto, SIN decimales
  final format = NumberFormat.currency(
    locale: 'es_AR', 
    symbol: '\$ ', 
    decimalDigits: 0,
  );
  return format.format(amount);
}

double parseAmount(String val) {
  // Ahora como no hay decimales, simplemente quitamos todos los puntos, comas, signos de dolar y espacios
  String clean = val.replaceAll('\$', '').replaceAll(' ', '').replaceAll('.', '').replaceAll(',', '');
  return double.tryParse(clean) ?? 0.0;
}

bool isValidAmount(String val) {
  return parseAmount(val) > 0;
}

class ThousandsSeparatorInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    
    if (newValue.text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    // Remover todo lo que no sea dígito
    String cleanText = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    
    if (cleanText.isEmpty) return newValue.copyWith(text: '');

    // Formatear con separadores de miles (punto en locale es_AR)
    final formatter = NumberFormat('#,###', 'es_AR');
    final double value = double.parse(cleanText);
    String formattedText = formatter.format(value);

    return newValue.copyWith(
      text: formattedText,
      selection: TextSelection.collapsed(offset: formattedText.length),
    );
  }
}
