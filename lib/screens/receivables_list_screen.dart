import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/receivable.dart';
import '../providers/finance_provider.dart';
import '../utils/formatters.dart';
import 'add_receivable_screen.dart';

class ReceivablesListScreen extends StatelessWidget {
  const ReceivablesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final finance = context.watch<FinanceProvider>();
    final receivables = finance.receivables;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('A Cobrar (Me deben)', style: TextStyle(color: isDark ? Colors.white : Colors.black)),
        backgroundColor: Theme.of(context).colorScheme.secondary,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black),
      ),
      body: receivables.isEmpty
          ? const Center(child: Text('No tienes cuentas por cobrar.'))
          : ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: receivables.length,
              itemBuilder: (ctx, i) {
                final receivable = receivables[i];
                final isDone = receivable.isPaid;
                final textColor = isDone ? Colors.grey : Theme.of(context).colorScheme.onSurface;
                final textStyle = TextStyle(
                  fontWeight: FontWeight.bold,
                  color: textColor,
                  decoration: isDone ? TextDecoration.lineThrough : null,
                );

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  clipBehavior: Clip.antiAlias,
                  child: ExpansionTile(
                    title: Row(
                      children: [
                        Expanded(child: Text(receivable.debtor, style: textStyle)),
                        Text(
                          formatCurrency(receivable.amount),
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: isDone ? Colors.grey : Theme.of(context).colorScheme.secondary),
                        ),
                        Checkbox(
                          value: receivable.isPaid,
                          activeColor: Theme.of(context).colorScheme.secondary,
                          checkColor: isDark ? Colors.white : Colors.black,
                          onChanged: (val) {
                            if (val != null) {
                              context.read<FinanceProvider>().updateReceivable(
                                Receivable(
                                  id: receivable.id,
                                  debtor: receivable.debtor,
                                  amount: receivable.amount,
                                  concept: receivable.concept,
                                  dueDate: receivable.dueDate,
                                  createdAt: receivable.createdAt,
                                  isPaid: val,
                                )
                              );
                            }
                          },
                        ),
                      ],
                    ),
                    children: [
                      Builder(builder: (ctx) {
                        try {
                          return Container(
                            color: isDark ? Colors.grey.shade900 : Colors.grey.shade50,
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Concepto: ${receivable.concept}', style: TextStyle(fontSize: 16, color: textColor)),
                                const SizedBox(height: 8),
                                Text('Fecha Creado: ${DateFormat("dd/MM/yyyy").format(receivable.createdAt)}', style: TextStyle(color: textColor)),
                                const SizedBox(height: 16),
                                Wrap(
                                  alignment: WrapAlignment.end,
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  spacing: 8,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit, color: Colors.orange),
                                      onPressed: () {
                                        Navigator.push(context, MaterialPageRoute(builder: (_) => AddReceivableScreen(receivableToEdit: receivable)));
                                      },
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete, color: Colors.red),
                                      onPressed: () => context.read<FinanceProvider>().deleteReceivable(receivable.id),
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
                      }),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Theme.of(context).colorScheme.secondary,
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddReceivableScreen())),
        child: Icon(Icons.add, color: isDark ? Colors.white : Colors.black),
      ),
    );
  }
}
