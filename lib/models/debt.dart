import 'package:uuid/uuid.dart';

class Payment {
  final String id;
  final double amount;
  final DateTime date;

  Payment({
    String? id,
    required this.amount,
    required this.date,
  }) : id = id ?? const Uuid().v4();

  Map<String, dynamic> toMap() => {
        'id': id,
        'amount': amount,
        'date': date.toIso8601String(),
      };

  factory Payment.fromMap(Map<String, dynamic> map) => Payment(
        id: map['id'],
        amount: map['amount']?.toDouble() ?? 0.0,
        date: DateTime.parse(map['date']),
      );
}

class Debt {
  final String id;
  final String concept;
  final String creditor;
  final double originalAmount;
  final double remainingAmount;
  final bool isFixed;
  final DateTime dueDate;
  final DateTime createdAt;
  final List<Payment> payments;
  final bool isPaid;

  Debt({
    String? id,
    required this.concept,
    required this.creditor,
    required this.originalAmount,
    double? remainingAmount,
    required this.isFixed,
    required this.dueDate,
    DateTime? createdAt,
    List<Payment>? payments,
    this.isPaid = false,
  })  : id = id ?? const Uuid().v4(),
        remainingAmount = remainingAmount ?? originalAmount,
        createdAt = createdAt ?? DateTime.now(),
        payments = payments ?? [];

  Map<String, dynamic> toMap() => {
        'concept': concept,
        'creditor': creditor,
        'originalAmount': originalAmount,
        'remainingAmount': remainingAmount,
        'isFixed': isFixed,
        'dueDate': dueDate.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'isPaid': isPaid,
        'payments': payments.map((p) => p.toMap()).toList(),
      };

  factory Debt.fromMap(Map<String, dynamic> map, String docId) => Debt(
        id: docId,
        concept: map['concept'] ?? '',
        creditor: map['creditor'] ?? '',
        originalAmount: map['originalAmount']?.toDouble() ?? 0.0,
        remainingAmount: map['remainingAmount']?.toDouble() ?? 0.0,
        isFixed: map['isFixed'] ?? false,
        dueDate: map['dueDate'] != null ? DateTime.parse(map['dueDate']) : DateTime.now(),
        createdAt: map['createdAt'] != null ? DateTime.parse(map['createdAt']) : DateTime.now(),
        isPaid: map['isPaid'] ?? false,
        payments: (map['payments'] as List<dynamic>?)?.map((p) => Payment.fromMap(p)).toList() ?? [],
      );

  Debt addPayment(double amount) {
    final newPayment = Payment(amount: amount, date: DateTime.now());
    final newRemaining = remainingAmount - amount;
    
    return Debt(
      id: id,
      concept: concept,
      creditor: creditor,
      originalAmount: originalAmount,
      remainingAmount: newRemaining < 0 ? 0 : newRemaining,
      isFixed: isFixed,
      dueDate: dueDate,
      createdAt: createdAt,
      payments: [...payments, newPayment],
      isPaid: (newRemaining <= 0), // Se marca pagado si llega a 0
    );
  }

  Debt togglePaid(bool paid) {
    return Debt(
      id: id,
      concept: concept,
      creditor: creditor,
      originalAmount: originalAmount,
      remainingAmount: paid ? 0 : originalAmount, // Si se marca pagado, el restante es 0
      isFixed: isFixed,
      dueDate: dueDate,
      createdAt: createdAt,
      payments: payments,
      isPaid: paid,
    );
  }
}
