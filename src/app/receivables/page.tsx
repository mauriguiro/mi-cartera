'use client';

import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Trash2, Edit, GripVertical, ArrowUpDown, Coins, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function ReceivablesPage() {
  const { receivables, reorderReceivables, markReceivableAsPaid, deleteReceivable } = useFinance();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderReceivables(result.source.index, result.destination.index, receivables);
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-950 min-h-screen relative flex flex-col shadow-sm">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-sm z-10 sticky top-0 border-b border-gray-700">
        <div className="flex items-center">
          <Link href="/" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
          <h1 className="text-lg font-bold">A Cobrar (Me deben)</h1>
        </div>
        {receivables.length > 1 && (
          <button
            type="button"
            onClick={() => setIsReordering(!isReordering)}
            className={clsx(
              "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors",
              isReordering
                ? "bg-blue-500/20 border-blue-500 text-blue-300"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white"
            )}
          >
            <ArrowUpDown size={13} />
            {isReordering ? 'Listo' : 'Ordenar'}
          </button>
        )}
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {receivables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
            <p className="text-lg font-medium">No hay cobros registrados</p>
            <p className="text-sm mt-1">Toca el botón + para añadir uno</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-receivables">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                  {receivables.map((rec, index) => {
                    const isExpanded = expandedId === rec.id;
                    const payments = Array.isArray(rec.payments) ? rec.payments : [];
                    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                    const origAmount = rec.originalAmount !== undefined ? rec.originalAmount : rec.amount;
                    const remainingAmount = rec.remainingAmount !== undefined ? rec.remainingAmount : Math.max(0, origAmount - totalPaid);
                    let runningBalance = origAmount;

                    return (
                      <Draggable key={rec.id} draggableId={rec.id} index={index} isDragDisabled={!isReordering}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border-gray-700 border rounded-lg overflow-hidden bg-gray-800 shadow-sm transition-colors"
                          >
                            <div 
                              className="flex items-center justify-between p-3 cursor-pointer"
                              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                            >
                              <div className="flex flex-1 items-center space-x-2 truncate">
                                {isReordering && (
                                  <div
                                    {...provided.dragHandleProps}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-400 p-1 -ml-1 cursor-grab active:cursor-grabbing shrink-0"
                                    title="Arrastrar para reordenar"
                                  >
                                    <GripVertical size={16} />
                                  </div>
                                )}
                                <div className="truncate">
                                  <span className={clsx("text-sm font-bold truncate block", rec.isPaid && "line-through text-gray-400")}>
                                    {rec.debtor}
                                  </span>
                                  {payments.length > 0 && !rec.isPaid && (
                                    <span className="text-[11px] text-gray-400 block truncate">
                                      Orig: {formatCurrency(origAmount)} · {payments.length} {payments.length === 1 ? 'entrega' : 'entregas'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 shrink-0">
                                <span className={clsx("text-sm font-bold", rec.isPaid ? "text-gray-400" : "text-blue-400")}>
                                  {formatCurrency(rec.isPaid ? 0 : remainingAmount)}
                                </span>
                                <input
                                  type="checkbox"
                                  className="appearance-none w-5 h-5 bg-gray-900 border-2 border-gray-600 rounded flex items-center justify-center checked:bg-blue-500 checked:border-blue-500 cursor-pointer relative after:content-['✓'] after:text-white after:text-xs after:font-bold after:hidden checked:after:block transition-colors"
                                  checked={rec.isPaid}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => markReceivableAsPaid(rec.id, e.target.checked)}
                                />
                                {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 bg-gray-950 border-t border-gray-800 text-sm">
                                <p className="text-gray-300 mb-1"><strong>Concepto:</strong> {rec.concept}</p>
                                <p className="text-gray-300 mb-1"><strong>Monto Original:</strong> {formatCurrency(origAmount)}</p>
                                
                                {payments.length > 0 && (
                                  <>
                                    <p className="text-gray-300 mb-1">
                                      <strong>Total Cobrado:</strong>{' '}
                                      <span className="text-green-400 font-bold">{formatCurrency(totalPaid)}</span>
                                    </p>
                                    <p className="text-gray-300 mb-1">
                                      <strong>Saldo Restante:</strong>{' '}
                                      <span className={clsx("font-bold", rec.isPaid ? "text-gray-400" : "text-blue-400")}>
                                        {formatCurrency(rec.isPaid ? 0 : remainingAmount)}
                                      </span>
                                    </p>
                                  </>
                                )}

                                <p className="text-gray-300 mb-2"><strong>Creado el:</strong> {format(new Date(rec.createdAt), 'dd/MM/yyyy')}</p>
                                {rec.dueDate && (
                                  <p className="text-gray-300 mb-2"><strong>Vencimiento:</strong> {format(new Date(rec.dueDate), 'dd/MM/yyyy')}</p>
                                )}

                                {payments.length > 0 && (
                                  <>
                                    <div className="h-px bg-gray-700 my-3" />
                                    <p className="font-bold mb-2 text-white">Historial de Entregas ({payments.length}):</p>
                                    <ul className="space-y-1.5">
                                      {payments.map((p, idx) => {
                                        runningBalance = Math.max(0, runningBalance - (Number(p.amount) || 0));
                                        return (
                                          <li key={p.id} className="text-xs bg-gray-900 px-2.5 py-2 rounded border border-gray-800 space-y-1">
                                            <div className="flex justify-between items-center">
                                              <div>
                                                <span className="font-semibold text-gray-300">#{idx + 1}</span>{' '}
                                                <span className="text-gray-400">
                                                  {p.date ? format(new Date(p.date), 'dd/MM/yyyy') : '-'}
                                                </span>
                                              </div>
                                              <div className="text-right">
                                                <span className="text-green-400 font-bold">+{formatCurrency(p.amount)}</span>
                                                <span className="text-gray-500 ml-2">(Resta: {formatCurrency(runningBalance)})</span>
                                              </div>
                                            </div>
                                            {p.note && (
                                              <div className="text-[11px] text-gray-300 bg-gray-950/80 px-2 py-1 rounded border border-gray-850 flex items-start gap-1">
                                                <StickyNote size={12} className="text-blue-400 shrink-0 mt-0.5" />
                                                <span className="italic break-words">{p.note}</span>
                                              </div>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </>
                                )}
                                
                                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-700">
                                  {!rec.isPaid && (
                                    <Link
                                      href={`/receivables/edit/${rec.id}?action=pay`}
                                      className="flex items-center text-blue-400 text-xs font-bold px-2.5 py-1 bg-blue-900/30 hover:bg-blue-900/50 rounded transition-colors"
                                    >
                                      <Coins size={14} className="mr-1" /> Pago Parcial
                                    </Link>
                                  )}
                                  <Link href={`/receivables/edit/${rec.id}`} className="text-orange-400 p-1 hover:bg-orange-900/30 rounded" title="Editar cobro">
                                    <Edit size={16} />
                                  </Link>
                                  <button onClick={() => deleteReceivable(rec.id)} className="text-red-400 p-1 hover:bg-red-900/30 rounded" title="Eliminar cobro">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </main>

      <div className="fixed bottom-6 right-6 lg:absolute lg:bottom-6 lg:right-6">
        <Link href="/receivables/add" className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform active:scale-95">
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
}