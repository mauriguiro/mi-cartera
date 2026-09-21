import 'package:uuid/uuid.dart';

class Receivable {
  final String id;
  final String debtor;
  final double amount;
  final String concept;
  final DateTime dueDate;
  final DateTime createdAt;
  final bool isPaid;

  Receivable({
    String? id,
    required this.debtor,
    required this.amount,
    required this.concept,
    required this.dueDate,
    DateTime? createdAt,
    this.isPaid = false,
  })  : id = id ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
        'debtor': debtor,
        'amount': amount,
        'concept': concept,
        'dueDate': dueDate.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'isPaid': isPaid,
      };

  factory Receivable.fromMap(Map<String, dynamic> map, String docId) => Receivable(
        id: docId,
        debtor: map['debtor'] ?? '',
        amount: map['amount']?.toDouble() ?? 0.0,
        concept: map['concept'] ?? '',
        dueDate: map['dueDate'] != null ? DateTime.parse(map['dueDate']) : DateTime.now(),
        createdAt: map['createdAt'] != null ? DateTime.parse(map['createdAt']) : DateTime.now(),
        isPaid: map['isPaid'] ?? false,
      );

  Receivable markAsPaid() {
    return Receivable(
      id: id,
      debtor: debtor,
      amount: amount,
      concept: concept,
      dueDate: dueDate,
      createdAt: createdAt,
      isPaid: true,
    );
  }
}
