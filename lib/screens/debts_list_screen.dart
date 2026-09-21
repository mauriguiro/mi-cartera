import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/debt.dart';
import '../providers/finance_provider.dart';
import '../utils/formatters.dart';
import 'add_debt_screen.dart';

class DebtsListScreen extends StatelessWidget {
  const DebtsListScreen({super.key});

  void _showAddPaymentDialog(BuildContext context, Debt debt) {
    final TextEditingController amountController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Registrar Abono'),
          content: TextField(
            controller: amountController,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              ThousandsSeparatorInputFormatter(),
            ],
            decoration: const InputDecoration(labelText: 'Monto a abonar', prefixIcon: Icon(Icons.attach_money)),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () {
                if (isValidAmount(amountController.text)) {
                  context.read<FinanceProvider>().payDebt(debt.id, parseAmount(amountController.text));
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Guardar'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDebtCard(Debt debt, BuildContext context, bool isDark) {
    final isDone = debt.isPaid;
    final textColor = isDone ? Colors.grey : Theme.of(context).colorScheme.onSurface;
    final textStyle = TextStyle(
      fontWeight: FontWeight.bold,
      fontSize: 14,
      color: textColor,
      decoration: isDone ? TextDecoration.lineThrough : null,
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 4),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8), 
        side: BorderSide(color: isDark ? Colors.grey.shade800 : Colors.grey.shade300)
      ),
      clipBehavior: Clip.antiAlias,
      child: Theme(
        data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
          listTileTheme: const ListTileThemeData(dense: true, minVerticalPadding: 0),
        ),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
          title: Row(
            children: [
              Expanded(child: Text(debt.concept, style: textStyle)),
              Text(
                formatCurrency(debt.isFixed ? debt.originalAmount : debt.remainingAmount),
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDone ? Colors.grey : Theme.of(context).colorScheme.error),
              ),
              if (debt.isFixed)
                Transform.scale(
                  scale: 0.9,
                  child: Checkbox(
                    value: debt.isPaid,
                    activeColor: Theme.of(context).colorScheme.error,
                    visualDensity: VisualDensity.compact,
                    onChanged: (val) {
                      if (val != null) {
                        context.read<FinanceProvider>().toggleDebtPaid(debt.id, val);
                      }
                    },
                  ),
                ),
            ],
          ),
          children: [
            Builder(builder: (ctx) {
              try {
                return Container(
                  color: isDark ? Colors.grey.shade900 : Colors.grey.shade50,
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Acreedor: ${debt.creditor}', style: TextStyle(fontSize: 14, color: textColor)),
                      const SizedBox(height: 4),
                      if (!debt.isFixed) ...[
                        Text('Monto Original: ${formatCurrency(debt.originalAmount)}', style: TextStyle(fontSize: 14, color: textColor)),
                        const SizedBox(height: 4),
                      ],
                      Text('Creado el: ${DateFormat("dd/MM/yyyy").format(debt.createdAt)}', style: TextStyle(fontSize: 14, color: textColor)),
                      if (!debt.isFixed) ...[
                        const Divider(height: 16),
                        Text('Historial de Pagos:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: textColor)),
                        if (debt.payments.isEmpty) const Text('No hay pagos registrados aún.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        ...debt.payments.map((p) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(DateFormat('dd/MM/yyyy').format(p.date), style: TextStyle(fontSize: 12, color: textColor)),
                              Text('-${formatCurrency(p.amount)}', style: const TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )),
                      ],
                      const SizedBox(height: 8),
                      Wrap(
                        alignment: WrapAlignment.end,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        children: [
                          if (!debt.isFixed && !debt.isPaid)
                            TextButton.icon(
                              onPressed: () => _showAddPaymentDialog(context, debt),
                              icon: const Icon(Icons.payment, color: Colors.blue, size: 18),
                              label: const Text('Abonar', style: TextStyle(color: Colors.blue, fontSize: 12)),
                            ),
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.orange, size: 20),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => AddDebtScreen(debtToEdit: debt)));
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: () => context.read<FinanceProvider>().deleteDebt(debt.id),
                          ),
                        ],
                      )
                    ],
                  ),
                );
              } catch (e) {
                return Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text('Error interno al mostrar detalles: \$e', style: const TextStyle(color: Colors.red)),
                );
              }
            })
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 16.0, bottom: 8.0, left: 4.0),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: Colors.white, // Blanco como fue solicitado
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final finance = context.watch<FinanceProvider>();
    final debts = finance.debts;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final fixedDebts = debts.where((d) => d.isFixed).toList();
    final occasionalDebts = debts.where((d) => !d.isFixed).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('A Pagar (Deudas)'),
        backgroundColor: Theme.of(context).colorScheme.error,
      ),
      body: debts.isEmpty
          ? const Center(child: Text('No tienes deudas registradas 🎉'))
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
              children: [
                if (fixedDebts.isNotEmpty) ...[
                  _buildHeader('Fijas'),
                  ...fixedDebts.map((d) => _buildDebtCard(d, context, isDark)),
                ],
                if (occasionalDebts.isNotEmpty) ...[
                  _buildHeader('Ocasionales'),
                  ...occasionalDebts.map((d) => _buildDebtCard(d, context, isDark)),
                ],
              ],
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Theme.of(context).colorScheme.error,
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddDebtScreen())),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
