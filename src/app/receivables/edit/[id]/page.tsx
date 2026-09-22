'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditReceivablePage() {
  const { receivables, updateReceivable } = useFinance();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [concept, setConcept] = useState('');
  const [debtor, setDebtor] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const rec = receivables.find(r => r.id === id);
    if (rec) {
      setConcept(rec.concept);
      setDebtor(rec.debtor);
      setAmount(rec.amount.toString());
      setDueDate(rec.dueDate?.split('T')[0] || '');
    }
  }, [id, receivables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !debtor || !amount) return;

    updateReceivable(id, {
      concept,
      debtor,
      amount: parseFloat(amount),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
    });
    router.push('/receivables');
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen relative shadow-sm">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center shadow-sm border-b border-gray-700">
        <Link href="/receivables" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">Editar Cobro</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Concepto</label>
          <input type="text" className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-blue-500 focus:border-blue-500" value={concept} onChange={(e) => setConcept(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Deudor (Quién debe)</label>
          <input type="text" className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-blue-500 focus:border-blue-500" value={debtor} onChange={(e) => setDebtor(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Monto a cobrar</label>
          <input type="number" step="0.01" className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-blue-500 focus:border-blue-500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Fecha de Vencimiento (opcional)</label>
          <input type="date" className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-blue-500 focus:border-blue-500 dark:[color-scheme:dark]" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors mt-6">
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
