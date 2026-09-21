import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dashboard_screen.dart';

class PinScreen extends StatefulWidget {
  const PinScreen({super.key});

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  String _pin = '';
  String? _savedPin;
  bool _isSettingPin = false;

  @override
  void initState() {
    super.initState();
    _loadSavedPin();
  }

  Future<void> _loadSavedPin() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _savedPin = prefs.getString('app_pin');
      if (_savedPin == null) {
        _isSettingPin = true;
      }
    });
  }

  void _onNumberPressed(String number) async {
    if (_pin.length < 6) {
      setState(() {
        _pin += number;
      });
      if (_pin.length == 6) {
        await _processPin();
      }
    }
  }

  void _onDeletePressed() {
    if (_pin.isNotEmpty) {
      setState(() {
        _pin = _pin.substring(0, _pin.length - 1);
      });
    }
  }

  Future<void> _processPin() async {
    if (_isSettingPin) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('app_pin', _pin);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PIN configurado exitosamente 🔒', style: TextStyle(fontSize: 16))),
      );
      _navigateToDashboard();
    } else {
      if (_pin == _savedPin) {
        _navigateToDashboard();
      } else {
        setState(() => _pin = '');
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PIN incorrecto ❌', style: TextStyle(fontSize: 16)),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  void _navigateToDashboard() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const DashboardScreen()),
    );
  }

  Widget _buildNumpadButton(String number) {
    return InkWell(
      onTap: () => _onNumberPressed(number),
      borderRadius: BorderRadius.circular(40),
      child: Container(
        width: 75,
        height: 75,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Theme.of(context).colorScheme.surface,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))
          ],
        ),
        alignment: Alignment.center,
        child: Text(number, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(),
            const Icon(Icons.account_balance_wallet_rounded, size: 80, color: Color(0xFF6200EA)),
            const SizedBox(height: 16),
            Text('MiCartera', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
            const SizedBox(height: 24),
            Text(_isSettingPin ? 'Crea tu PIN de 6 dígitos' : 'Ingresa tu PIN para entrar', style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (index) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: index < _pin.length ? Theme.of(context).colorScheme.primary : Colors.grey.shade300,
                ),
              )),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Column(
                children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: ['1', '2', '3'].map(_buildNumpadButton).toList()),
                  const SizedBox(height: 20),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: ['4', '5', '6'].map(_buildNumpadButton).toList()),
                  const SizedBox(height: 20),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: ['7', '8', '9'].map(_buildNumpadButton).toList()),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      const SizedBox(width: 75),
                      _buildNumpadButton('0'),
                      InkWell(
                        onTap: _onDeletePressed,
                        borderRadius: BorderRadius.circular(40),
                        child: Container(
                          width: 75, height: 75,
                          alignment: Alignment.center,
                          child: const Icon(Icons.backspace_outlined, size: 32),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}
