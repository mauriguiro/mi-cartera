import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/receivable.dart';
import '../providers/finance_provider.dart';
import '../utils/formatters.dart';

class AddReceivableScreen extends StatefulWidget {
  final Receivable? receivableToEdit;

  const AddReceivableScreen({super.key, this.receivableToEdit});

  @override
  State<AddReceivableScreen> createState() => _AddReceivableScreenState();
}

class _AddReceivableScreenState extends State<AddReceivableScreen> {
  final _formKey = GlobalKey<FormState>();
  late String _concept;
  late String _debtor;
  late double _amount;
  late DateTime _dueDate;

  @override
  void initState() {
    super.initState();
    _concept = widget.receivableToEdit?.concept ?? '';
    _debtor = widget.receivableToEdit?.debtor ?? '';
    _amount = widget.receivableToEdit?.amount ?? 0;
    _dueDate = widget.receivableToEdit?.dueDate ?? DateTime.now().add(const Duration(days: 30));
  }

  void _saveReceivable() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      
      final newReceivable = Receivable(
        id: widget.receivableToEdit?.id,
        concept: _concept,
        debtor: _debtor,
        amount: _amount,
        dueDate: _dueDate,
        createdAt: widget.receivableToEdit?.createdAt,
        isPaid: widget.receivableToEdit?.isPaid ?? false,
      );
      
      if (widget.receivableToEdit == null) {
        context.read<FinanceProvider>().addReceivable(newReceivable);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cobro guardado correctamente ✅')));
      } else {
        context.read<FinanceProvider>().updateReceivable(newReceivable);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cobro actualizado correctamente ✅')));
      }
      
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isEditing = widget.receivableToEdit != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Modificar Cobro' : 'Registrar Nuevo Cobro', style: const TextStyle(color: Colors.black)),
        backgroundColor: colorScheme.secondary,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                initialValue: _debtor,
                decoration: const InputDecoration(labelText: 'Deudor', border: OutlineInputBorder(), prefixIcon: Icon(Icons.person_pin)),
                validator: (val) => val == null || val.isEmpty ? 'Requerido' : null,
                onSaved: (val) => _debtor = val!,
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: _concept,
                decoration: const InputDecoration(labelText: 'Concepto', border: OutlineInputBorder(), prefixIcon: Icon(Icons.handshake)),
                validator: (val) => val == null || val.isEmpty ? 'Requerido' : null,
                onSaved: (val) => _concept = val!,
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: _amount == 0 ? '' : NumberFormat('#,###', 'es_AR').format(_amount),
                decoration: const InputDecoration(labelText: 'Monto a Cobrar', border: OutlineInputBorder(), prefixIcon: Icon(Icons.attach_money)),
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  ThousandsSeparatorInputFormatter(),
                ],
                validator: (val) => val == null || !isValidAmount(val) ? 'Monto inválido' : null,
                onSaved: (val) => _amount = parseAmount(val!),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: colorScheme.secondary, foregroundColor: Colors.black),
                onPressed: _saveReceivable,
                child: Text(isEditing ? 'Actualizar Cobro' : 'Guardar Cobro', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
