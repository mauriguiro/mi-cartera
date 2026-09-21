import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/finance_provider.dart';
import '../utils/formatters.dart';
import 'debts_list_screen.dart';
import 'receivables_list_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  Widget _build3DCard(BuildContext context, String title, double amount, Color color, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.5), width: 1.2),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 6, offset: const Offset(0, 4)),
            BoxShadow(color: color.withOpacity(0.15), blurRadius: 10, offset: const Offset(0, 0)),
          ],
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              color.withOpacity(0.15),
              Theme.of(context).colorScheme.surface,
            ],
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: color.withOpacity(0.4), blurRadius: 4, offset: const Offset(0, 2))
                ]
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.3)),
                  const SizedBox(height: 2),
                  Text(
                    formatCurrency(amount),
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 24),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final finance = context.watch<FinanceProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('MiCartera', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.settings), onPressed: () {}),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // Tarjeta de Balance Neto MUY pequeña y sutil
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: Colors.grey.withOpacity(0.2)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Balance Neto:', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    const SizedBox(width: 8),
                    Text(
                      formatCurrency(finance.netBalance),
                      style: TextStyle(
                        color: finance.netBalance >= 0 ? Colors.green : Colors.red,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
            
            // Tarjetas 3D clickeables (reemplazan a los botones)
            _build3DCard(
              context, 
              'A Cobrar', 
              finance.totalReceivables, 
              Theme.of(context).colorScheme.secondary, 
              Icons.account_balance_wallet,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReceivablesListScreen())),
            ),
            
            _build3DCard(
              context, 
              'A Pagar', 
              finance.totalDebt, 
              Theme.of(context).colorScheme.error, 
              Icons.payment,
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DebtsListScreen())),
            ),
          ],
        ),
      ),
    );
  }
}
