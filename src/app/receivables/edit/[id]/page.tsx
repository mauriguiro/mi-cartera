'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coins, Calendar, StickyNote, PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { formatAmountInput, numberToFormattedInput, parseAmount, formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';

function EditReceivableContent() {
  const { receivables, updateReceivable, payReceivable, deleteReceivablePayment } = useFinance();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const payAmountInputRef = useRef<HTMLInputElement>(null);

  // General fields
  const [concept, setConcept] = useState('');
  const [debtor, setDebtor] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Partial payment fields
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [paySuccessMsg, setPaySuccessMsg] = useState('');
  const [payErrorMsg, setPayErrorMsg] = useState('');

  const rec = receivables.find((r) => r.id === id);

  useEffect(() => {
    if (rec) {
      setConcept(rec.concept || '');
      setDebtor(rec.debtor || '');
      const orig = rec.originalAmount !== undefined ? rec.originalAmount : rec.amount;
      setOriginalAmount(numberToFormattedInput(orig));
      setDueDate(rec.dueDate ? rec.dueDate.split('T')[0] : '');
    }
  }, [id, rec]);

  useEffect(() => {
    if (searchParams.get('action') === 'pay' && payAmountInputRef.current) {
      setTimeout(() => {
        payAmountInputRef.current?.focus();
        payAmountInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [searchParams]);

  if (!rec) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen p-4 text-white">
        <header className="flex items-center mb-6">
          <Link href="/receivables" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold">Cobro no encontrado</h1>
        </header>
        <p className="text-gray-400">El cobro solicitado no existe o fue eliminado.</p>
        <Link href="/receivables" className="inline-block mt-4 text-blue-400 font-bold hover:underline">
          Volver a A Cobrar
        </Link>
      </div>
    );
  }

  const payments = Array.isArray(rec.payments) ? rec.payments : [];
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const origAmountNum = rec.originalAmount !== undefined ? rec.originalAmount : rec.amount;
  const remainingAmount = rec.remainingAmount !== undefined ? rec.remainingAmount : Math.max(0, origAmountNum - totalPaid);

  // Handle registering a new partial payment
  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayErrorMsg('');
    const numericPay = parseAmount(payAmount);

    if (numericPay <= 0) {
      setPayErrorMsg('Ingresá un monto válido mayor a 0.');
      return;
    }

    // Format date with midday time to prevent UTC timezone shifts
    const finalDate = payDate ? new Date(payDate + 'T12:00:00').toISOString() : new Date().toISOString();

    payReceivable(id, numericPay, finalDate, payNote.trim());

    setPayAmount('');
    setPayNote('');
    setPaySuccessMsg(`¡Entrega de ${formatCurrency(numericPay)} registrada con éxito!`);
    setTimeout(() => {
      setPaySuccessMsg('');
    }, 4000);
  };

  // Handle general fields form submission
  const handleUpdateGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const numericOrig = parseAmount(originalAmount);
    if (!concept || !debtor || numericOrig <= 0) return;

    updateReceivable(id, {
      concept,
      debtor,
      originalAmount: numericOrig,
      dueDate: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : undefined,
    });
    router.push('/receivables');
  };

  const handleDeletePayment = (paymentId: string) => {
    if (confirm('¿Eliminar esta entrega registrada? Se recalculará el saldo restante.')) {
      deleteReceivablePayment(id, paymentId);
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen relative shadow-sm pb-16">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center shadow-sm border-b border-gray-700 sticky top-0 z-10">
        <Link href="/receivables" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold leading-tight">Editar Cobro</h1>
          <p className="text-xs text-gray-400">{rec.debtor}</p>
        </div>
      </header>

      <div className="p-4 space-y-5">
        {/* Summary Card */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deudor</p>
              <h2 className="text-base font-bold text-white">{rec.debtor}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{rec.concept}</p>
            </div>
            {rec.isPaid ? (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Saldado
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Pendiente
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-700 text-center">
            <div className="bg-gray-900/60 p-2 rounded-lg border border-gray-750">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Original</span>
              <span className="text-xs font-bold text-gray-200 block truncate">{formatCurrency(origAmountNum)}</span>
            </div>
            <div className="bg-gray-900/60 p-2 rounded-lg border border-gray-750">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Entregado</span>
              <span className="text-xs font-bold text-green-400 block truncate">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="bg-gray-900/60 p-2 rounded-lg border border-gray-750">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Resta Cobrar</span>
              <span className="text-xs font-bold text-blue-400 block truncate">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>

        {/* Section: Registrar Pago Parcial / Entrega */}
        <div className="bg-gray-800 rounded-xl p-4 border-2 border-blue-500/40 shadow-md">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
              <Coins size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Registrar Pago Parcial / Entrega</h3>
              <p className="text-[11px] text-gray-400">Anota una entrega de dinero recibida a cuenta</p>
            </div>
          </div>

          {paySuccessMsg && (
            <div className="mb-3 p-2.5 bg-green-950/80 border border-green-500/50 rounded-lg text-green-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <span>{paySuccessMsg}</span>
            </div>
          )}

          {payErrorMsg && (
            <div className="mb-3 p-2.5 bg-red-950/80 border border-red-500/50 rounded-lg text-red-300 text-xs">
              {payErrorMsg}
            </div>
          )}

          <form onSubmit={handleRegisterPayment} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Monto de la entrega</label>
              <div className="relative">
                <input
                  ref={payAmountInputRef}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-base"
                  value={payAmount}
                  onChange={(e) => setPayAmount(formatAmountInput(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1">
                  <Calendar size={13} className="text-blue-400" />
                  Fecha de la entrega
                </label>
                <input
                  type="date"
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:[color-scheme:dark]"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1">
                  <StickyNote size={13} className="text-blue-400" />
                  Nota / Referencia (Ayudamemoria)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Entrega en efectivo, transferencia banco..."
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md mt-2 text-sm"
            >
              <PlusCircle size={16} />
              Agregar Pago Parcial
            </button>
          </form>
        </div>

        {/* Section: Historial de Entregas Realizadas */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Historial de Entregas</span>
              <span className="text-xs font-normal text-gray-400">({payments.length})</span>
            </h3>
            {totalPaid > 0 && (
              <span className="text-xs font-bold text-green-400">
                Total: +{formatCurrency(totalPaid)}
              </span>
            )}
          </div>

          {payments.length === 0 ? (
            <p className="text-gray-500 text-xs italic py-2 text-center bg-gray-900/50 rounded-lg">
              No hay entregas parciales registradas aún.
            </p>
          ) : (
            <ul className="space-y-2">
              {payments.map((p, idx) => (
                <li
                  key={p.id}
                  className="p-3 bg-gray-900 rounded-lg border border-gray-700 text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400">#{idx + 1}</span>
                      <span className="text-gray-300 font-medium">
                        {p.date ? format(new Date(p.date), 'dd/MM/yyyy') : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-bold text-sm">+{formatCurrency(p.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(p.id)}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/40 rounded transition-colors"
                        title="Eliminar esta entrega"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {p.note && (
                    <div className="text-[11px] text-gray-300 bg-gray-950/70 p-2 rounded border border-gray-800 flex items-start gap-1.5">
                      <StickyNote size={12} className="text-blue-400 shrink-0 mt-0.5" />
                      <span className="italic break-words">{p.note}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section: Datos Principales del Cobro */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3">Datos Generales del Cobro</h3>

          <form onSubmit={handleUpdateGeneral} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Concepto</label>
              <input
                type="text"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Deudor (Quién debe)</label>
              <input
                type="text"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={debtor}
                onChange={(e) => setDebtor(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-300">Monto Original Total</label>
                <span className="text-[11px] text-gray-400">Monto total acordado</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(formatAmountInput(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Fecha de Vencimiento (opcional)</label>
              <input
                type="date"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:[color-scheme:dark]"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-700 hover:bg-gray-600 active:scale-[0.99] text-white font-bold py-2.5 rounded-lg transition-colors mt-2 text-sm"
            >
              Guardar Datos Generales
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditReceivablePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen p-4 text-white">
          Cargando...
        </div>
      }
    >
      <EditReceivableContent />
    </Suspense>
  );
}