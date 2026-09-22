'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditDebtPage() {
  const { debts, updateDebt } = useFinance();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [concept, setConcept] = useState('');
  const [creditor, setCreditor] = useState('');
  const [amount, setAmount] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const debt = debts.find(d => d.id === id);
    if (debt) {
      setConcept(debt.concept);
      setCreditor(debt.creditor);
      setAmount(debt.originalAmount.toString());
      setIsFixed(debt.isFixed);
      setDueDate(debt.dueDate?.split('T')[0] || '');
    }
  }, [id, debts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !creditor || !amount) return;

    updateDebt(id, {
      concept,
      creditor,
      originalAmount: parseFloat(amount),
      isFixed,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
    });
    router.push('/debts');
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen relative shadow-sm">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center shadow-sm border-b border-gray-700">
        <Link href="/debts" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">Editar Deuda</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Concepto</label>
          <input type="text" className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-red-500 focus:border-red-500" value={concept} onChange={(e) => setConcept(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Acreedor</label>
          <input type="text" className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-red-500 focus:border-red-500" value={creditor} onChange={(e) => setCreditor(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Monto Original</label>
          <input type="number" step="0.01" className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-red-500 focus:border-red-500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="isFixed" className="appearance-none w-5 h-5 bg-gray-900 border-2 border-gray-600 rounded flex items-center justify-center checked:bg-red-500 checked:border-red-500 cursor-pointer relative after:content-['✓'] after:text-white after:text-xs after:font-bold after:hidden checked:after:block transition-colors" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)} />
          <label htmlFor="isFixed" className="ml-2 text-sm font-bold text-gray-300">Es un gasto fijo (mensual)</label>
        </div>
        {isFixed && (
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Fecha de Vencimiento (opcional)</label>
            <input type="date" className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-red-500 focus:border-red-500 dark:[color-scheme:dark]" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        )}
        
        <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition-colors mt-6">
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
