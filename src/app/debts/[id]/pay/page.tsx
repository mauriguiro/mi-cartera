'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function PayDebtPage() {
  const { debts, payDebt } = useFinance();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [amount, setAmount] = useState('');
  const debt = debts.find(d => d.id === id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !debt) return;

    payDebt(id, parseFloat(amount));
    router.push('/debts');
  };

  if (!debt) return null;

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen relative shadow-sm">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center shadow-sm border-b border-gray-700">
        <Link href="/debts" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">Abonar Deuda</h1>
      </header>

      <div className="p-4 bg-gray-800 m-4 rounded-xl border border-gray-700">
        <p className="text-gray-400 text-sm mb-1">Concepto:</p>
        <p className="text-white font-bold mb-3">{debt.concept}</p>
        
        <p className="text-gray-400 text-sm mb-1">Monto Restante:</p>
        <p className="text-red-400 text-2xl font-black">{formatCurrency(debt.remainingAmount)}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Monto a abonar</label>
          <input 
            type="number" 
            step="0.01" 
            max={debt.remainingAmount}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-red-500 focus:border-red-500" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
            autoFocus
          />
        </div>
        
        <button type="submit" className="w-full bg-red-500 text-white font-bold py-3 rounded hover:bg-red-600 transition-colors mt-6 shadow-md">
          Registrar Pago
        </button>
      </form>
    </div>
  );
}
