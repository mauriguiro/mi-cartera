'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Banknote, FileSpreadsheet, Landmark, Check } from 'lucide-react';
import { PortfolioCategory } from '@/types';
import { formatAmountInput, numberToFormattedInput, parseAmount } from '@/utils/formatters';
import clsx from 'clsx';

const QUICK_TITLES: Record<PortfolioCategory, string[]> = {
  efectivo: ['Efectivo en mano', 'Caja chica', 'Ahorro en efectivo'],
  cheque: ['Cheque físico', 'E-Cheq', 'Cheque de tercero'],
  cuenta: ['Mercado Pago', 'Ualá', 'Naranja X', 'Cuenta Bancaria'],
};

const QUICK_NOTE_CHIPS: Record<PortfolioCategory, string[]> = {
  efectivo: ['Disponible para usar', 'Reservado para pagos', 'Guardado en caja'],
  cheque: ['Fecha de cobro: ', 'Entregado por: ', 'Banco: ', 'N° Cheque: '],
  cuenta: ['Dinero disponible', 'Generando rendimientos', 'CBU / Alias: ', 'Recibido de: '],
};

export default function EditPortfolioPage() {
  const { portfolio, updatePortfolioItem } = useFinance();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [category, setCategory] = useState<PortfolioCategory>('efectivo');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const item = portfolio.find((i) => i.id === id);
    if (item) {
      setCategory(item.category || 'efectivo');
      setTitle(item.title);
      setAmount(numberToFormattedInput(item.amount));
      setNotes(item.notes || '');
    }
  }, [id, portfolio]);

  const appendNoteChip = (chip: string) => {
    setNotes((prev) => {
      if (!prev.trim()) return chip;
      return `${prev.trimEnd()}\n${chip}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseAmount(amount);
    if (!title || numericAmount <= 0) return;

    updatePortfolioItem(id, {
      category,
      title: title.trim(),
      amount: numericAmount,
      notes: notes.trim(),
    });
    router.push('/portfolio');
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen relative shadow-sm">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center shadow-sm border-b border-gray-700">
        <Link href="/portfolio" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">Editar Registro en Cartera</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        {/* Selector de Tipo */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Tipo de disponibilidad
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setCategory('efectivo')}
              className={clsx(
                'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 font-bold text-xs transition-all',
                category === 'efectivo'
                  ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
              )}
            >
              {category === 'efectivo' && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              <Banknote size={22} className="mb-1.5" />
              Efectivo
            </button>

            <button
              type="button"
              onClick={() => setCategory('cheque')}
              className={clsx(
                'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 font-bold text-xs transition-all',
                category === 'cheque'
                  ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
              )}
            >
              {category === 'cheque' && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              <FileSpreadsheet size={22} className="mb-1.5" />
              Cheque
            </button>

            <button
              type="button"
              onClick={() => setCategory('cuenta')}
              className={clsx(
                'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 font-bold text-xs transition-all',
                category === 'cuenta'
                  ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
              )}
            >
              {category === 'cuenta' && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              <Landmark size={22} className="mb-1.5" />
              En Cuenta
            </button>
          </div>
        </div>

        {/* Concepto / Identificador */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">
            Identificador / Referencia
          </label>
          <input
            type="text"
            className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_TITLES[category].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setTitle(suggestion)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Monto con separadores de miles */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">Monto Disponible</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
            value={amount}
            onChange={(e) => setAmount(formatAmountInput(e.target.value))}
            required
          />
        </div>

        {/* Anotaciones / Detalles o aclaraciones */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-1">
            Anotaciones (detalles o aclaraciones)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_NOTE_CHIPS[category].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => appendNoteChip(chip)}
                className="text-[11px] px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50 transition-colors"
              >
                + {chip.replace(/:\s*$/, '')}
              </button>
            ))}
          </div>
          <textarea
            rows={4}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded hover:bg-emerald-500 transition-colors mt-6 shadow-md"
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
