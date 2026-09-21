import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/debt.dart';
import '../providers/finance_provider.dart';
import '../utils/formatters.dart';

class AddDebtScreen extends StatefulWidget {
  final Debt? debtToEdit;

  const AddDebtScreen({super.key, this.debtToEdit});

  @override
  State<AddDebtScreen> createState() => _AddDebtScreenState();
}

class _AddDebtScreenState extends State<AddDebtScreen> {
  final _formKey = GlobalKey<FormState>();
  late String _concept;
  late String _creditor;
  late double _amount;
  late bool _isFixed;
  late DateTime _dueDate;

  @override
  void initState() {
    super.initState();
    _concept = widget.debtToEdit?.concept ?? '';
    _creditor = widget.debtToEdit?.creditor ?? '';
    _amount = widget.debtToEdit?.originalAmount ?? 0;
    _isFixed = widget.debtToEdit?.isFixed ?? true;
    _dueDate = widget.debtToEdit?.dueDate ?? DateTime.now().add(const Duration(days: 30));
  }

  void _saveDebt() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      
      final newDebt = Debt(
        id: widget.debtToEdit?.id,
        concept: _concept,
        creditor: _creditor,
        originalAmount: _amount,
        remainingAmount: widget.debtToEdit == null ? _amount : widget.debtToEdit!.remainingAmount,
        isFixed: _isFixed,
        dueDate: _dueDate,
        createdAt: widget.debtToEdit?.createdAt,
        payments: widget.debtToEdit?.payments,
        isPaid: widget.debtToEdit?.isPaid ?? false,
      );
      
      if (widget.debtToEdit == null) {
        context.read<FinanceProvider>().addDebt(newDebt);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deuda guardada correctamente ✅')));
      } else {
        context.read<FinanceProvider>().updateDebt(newDebt);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deuda actualizada correctamente ✅')));
      }
      
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isEditing = widget.debtToEdit != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Modificar Deuda' : 'Registrar Nueva Deuda'),
        backgroundColor: colorScheme.error,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                initialValue: _concept,
                decoration: const InputDecoration(labelText: 'Concepto', border: OutlineInputBorder(), prefixIcon: Icon(Icons.description)),
                validator: (val) => val == null || val.isEmpty ? 'Requerido' : null,
                onSaved: (val) => _concept = val!,
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: _creditor,
                decoration: const InputDecoration(labelText: 'Acreedor', border: OutlineInputBorder(), prefixIcon: Icon(Icons.person)),
                validator: (val) => val == null || val.isEmpty ? 'Requerido' : null,
                onSaved: (val) => _creditor = val!,
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: _amount == 0 ? '' : NumberFormat('#,###', 'es_AR').format(_amount),
                decoration: const InputDecoration(labelText: 'Monto Total', border: OutlineInputBorder(), prefixIcon: Icon(Icons.attach_money)),
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  ThousandsSeparatorInputFormatter(),
                ],
                validator: (val) => val == null || !isValidAmount(val) ? 'Monto inválido' : null,
                onSaved: (val) => _amount = parseAmount(val!),
              ),
              const SizedBox(height: 24),
              const Text('Tipo de Deuda:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Card(
                elevation: 0,
                color: colorScheme.surface,
                shape: RoundedRectangleBorder(side: BorderSide(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
                child: Column(
                  children: [
                    RadioListTile<bool>(
                      title: const Text('Fija (Ej. Impuestos)'),
                      value: true, groupValue: _isFixed, activeColor: colorScheme.error,
                      onChanged: (val) => setState(() => _isFixed = val!),
                    ),
                    RadioListTile<bool>(
                      title: const Text('Ocasional / Préstamo'),
                      value: false, groupValue: _isFixed, activeColor: colorScheme.error,
                      onChanged: (val) => setState(() => _isFixed = val!),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: colorScheme.error),
                onPressed: _saveDebt,
                child: Text(isEditing ? 'Actualizar Deuda' : 'Guardar Deuda', style: const TextStyle(fontSize: 18)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
