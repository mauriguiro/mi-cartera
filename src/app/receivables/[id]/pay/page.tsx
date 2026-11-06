'use client';

import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, StickyNote, Coins } from 'lucide-react';
import { formatCurrency, formatAmountInput, parseAmount } from '@/utils/formatters';

export default function PayReceivablePage() {
  const { receivables, payReceivable } = useFinance();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const rec = receivables.find((r) => r.id === id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rec) return;
    setError('');

    const numericAmount = parseAmount(amount);
    if (numericAmount <= 0) {
      setError('Ingresá un monto mayor a 0.');
      return;
    }

    const currentRemaining =
      rec.remainingAmount !== undefined
        ? rec.remainingAmount
        : rec.originalAmount !== undefined
        ? rec.originalAmount
        : rec.amount;

    if (numericAmount > currentRemaining) {
      if (!confirm(`El monto ($ ${numericAmount}) supera el saldo pendiente ($ ${currentRemaining}). ¿Deseas registrarlo de todas formas?`)) {
        return;
      }
    }

    const finalDate = date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString();
    payReceivable(id, numericAmount, finalDate, note.trim());
    router.push('/receivables');
  };

  if (!rec) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen p-4 text-white">
        <header className="flex items-center mb-6">
          <Link href="/receivables" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold">Cobro no encontrado</h1>
        </header>
        <p className="text-gray-400">El cobro no existe o fue eliminado.</p>
        <Link href="/receivables" className="inline-block mt-4 text-blue-400 font-bold hover:underline">
          Volver a A Cobrar
        </Link>
      </div>
    );
  }

  const remaining =
    rec.remainingAmount !== undefined
      ? rec.remainingAmount
      : rec.originalAmount !== undefined
      ? rec.originalAmount
      : rec.amount;

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen relative shadow-sm pb-10">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center shadow-sm border-b border-gray-700 sticky top-0 z-10">
        <Link href="/receivables" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">Registrar Pago Parcial</h1>
      </header>

      <div className="p-4 bg-gray-800 m-4 rounded-xl border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Deudor:</p>
            <p className="text-white font-bold text-base">{rec.debtor}</p>
            <p className="text-gray-400 text-xs mt-0.5">{rec.concept}</p>
          </div>
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <Coins size={20} />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
          <span className="text-gray-400 text-xs">Saldo Restante:</span>
          <span className="text-blue-400 text-xl font-black">{formatCurrency(remaining)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Monto de la entrega</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-lg"
            value={amount}
            onChange={(e) => setAmount(formatAmountInput(e.target.value))}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center gap-1.5">
            <Calendar size={15} className="text-blue-400" />
            Fecha de la entrega
          </label>
          <input
            type="date"
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:[color-scheme:dark]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center gap-1.5">
            <StickyNote size={15} className="text-blue-400" />
            Nota / Referencia (Ayudamemoria)
          </label>
          <input
            type="text"
            placeholder="Ej: Entrega en efectivo, transferencia..."
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold py-3 rounded-lg transition-colors mt-6 shadow-md text-base"
        >
          Registrar Pago
        </button>
      </form>
    </div>
  );
}