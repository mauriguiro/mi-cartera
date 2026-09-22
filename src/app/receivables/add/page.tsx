'use client';

import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AddReceivablePage() {
  const { addReceivable } = useFinance();
  const router = useRouter();

  const [concept, setConcept] = useState('');
  const [debtor, setDebtor] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !debtor || !amount) return;

    addReceivable({
      concept,
      debtor,
      amount: parseFloat(amount),
      dueDate: dueDate || new Date().toISOString()
    });
    router.push('/receivables');
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-white min-h-screen relative shadow-sm">
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center shadow-md">
        <Link href="/receivables" className="mr-3 p-1 hover:bg-blue-700 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">Añadir Cobro</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Concepto</label>
          <input type="text" className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500" value={concept} onChange={(e) => setConcept(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Deudor (Quién debe)</label>
          <input type="text" className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500" value={debtor} onChange={(e) => setDebtor(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Monto a cobrar</label>
          <input type="number" step="0.01" className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Vencimiento (opcional)</label>
          <input type="date" className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors mt-6">
          Guardar Cobro
        </button>
      </form>
    </div>
  );
}
