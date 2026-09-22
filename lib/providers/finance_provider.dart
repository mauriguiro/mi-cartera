import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/debt.dart';
import '../models/receivable.dart';

class FinanceProvider with ChangeNotifier {
  List<Debt> _debts = [];
  List<Receivable> _receivables = [];

  FinanceProvider() {
    _initFirestore();
  }

  void _initFirestore() {
    // Activar persistencia offline explícita para la Web usando la API moderna
    try {
      FirebaseFirestore.instance.settings = const Settings(
        persistenceEnabled: true,
      );
    } catch (e) {
      debugPrint("Firebase persistence error: \$e");
    }

    // Escuchar Deudas
    FirebaseFirestore.instance.collection('debts').snapshots().listen((snapshot) {
      _debts = snapshot.docs.map((doc) => Debt.fromMap(doc.data(), doc.id)).toList();
      _debts.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
      _checkMonthlyReset(); // Verificar reinicio mensual cada vez que llegan datos frescos
      notifyListeners();
    });

    // Escuchar Cobros
    FirebaseFirestore.instance.collection('receivables').snapshots().listen((snapshot) {
      _receivables = snapshot.docs.map((doc) => Receivable.fromMap(doc.data(), doc.id)).toList();
      _receivables.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
      notifyListeners();
    });
  }

  Future<void> _checkMonthlyReset() async {
    final prefs = await SharedPreferences.getInstance();
    final now = DateTime.now();
    final currentMonthKey = '\${now.year}-\${now.month}'; 
    
    final lastReset = prefs.getString('last_reset_month');
    
    if (lastReset != currentMonthKey && _debts.isNotEmpty) {
      bool changed = false;
      for (int i = 0; i < _debts.length; i++) {
        if (_debts[i].isFixed && _debts[i].isPaid) {
          final updated = _debts[i].togglePaid(false);
          updateDebt(updated); // Guardar en Firebase directamente
          changed = true;
        }
      }
      
      if (changed) {
        await prefs.setString('last_reset_month', currentMonthKey);
      }
    }
  }

  List<Debt> get debts => _debts;
  List<Receivable> get receivables => _receivables;

  // Cálculos para el Dashboard
  double get totalDebt {
    return _debts
        .where((d) => !d.isPaid)
        .fold(0, (sum, debt) => sum + debt.remainingAmount);
  }

  double get totalReceivables {
    return _receivables
        .where((r) => !r.isPaid)
        .fold(0, (sum, receivable) => sum + receivable.amount);
  }

  double get netBalance => totalReceivables - totalDebt;

  // --- MÉTODOS PARA DEUDAS (Ahora en Firestore) ---
  void addDebt(Debt debt) {
    FirebaseFirestore.instance.collection('debts').doc(debt.id).set(debt.toMap());
  }

  void updateDebt(Debt debt) {
    FirebaseFirestore.instance.collection('debts').doc(debt.id).update(debt.toMap());
  }

  void toggleDebtPaid(String debtId, bool paid) {
    final debt = _debts.firstWhere((d) => d.id == debtId);
    updateDebt(debt.togglePaid(paid));
  }

  void payDebt(String debtId, double amount) {
    final debt = _debts.firstWhere((d) => d.id == debtId);
    updateDebt(debt.addPayment(amount));
  }

  void deleteDebt(String debtId) {
    FirebaseFirestore.instance.collection('debts').doc(debtId).delete();
  }

  void reorderDebts(int oldIndex, int newIndex, List<Debt> currentList) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final Debt item = currentList.removeAt(oldIndex);
    currentList.insert(newIndex, item);

    final batch = FirebaseFirestore.instance.batch();
    for (int i = 0; i < currentList.length; i++) {
      final docRef = FirebaseFirestore.instance.collection('debts').doc(currentList[i].id);
      batch.update(docRef, {'orderIndex': i});
    }
    batch.commit();
  }

  // --- MÉTODOS PARA COBROS (Ahora en Firestore) ---
  void addReceivable(Receivable receivable) {
    FirebaseFirestore.instance.collection('receivables').doc(receivable.id).set(receivable.toMap());
  }

  void updateReceivable(Receivable receivable) {
    FirebaseFirestore.instance.collection('receivables').doc(receivable.id).update(receivable.toMap());
  }

  void markReceivableAsPaid(String id) {
    final receivable = _receivables.firstWhere((r) => r.id == id);
    updateReceivable(receivable.markAsPaid());
  }

  void deleteReceivable(String id) {
    FirebaseFirestore.instance.collection('receivables').doc(id).delete();
  }

  void reorderReceivables(int oldIndex, int newIndex, List<Receivable> currentList) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final Receivable item = currentList.removeAt(oldIndex);
    currentList.insert(newIndex, item);

    final batch = FirebaseFirestore.instance.batch();
    for (int i = 0; i < currentList.length; i++) {
      final docRef = FirebaseFirestore.instance.collection('receivables').doc(currentList[i].id);
      batch.update(docRef, {'orderIndex': i});
    }
    batch.commit();
  }
}
