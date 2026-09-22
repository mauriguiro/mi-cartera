'use client';

import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Trash2, Edit, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Debt } from '@/types';
import clsx from 'clsx';

export default function DebtsPage() {
  const { debts, reorderDebts, toggleDebtPaid, deleteDebt } = useFinance();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fixedDebts = debts.filter(d => d.isFixed);
  const occasionalDebts = debts.filter(d => !d.isFixed);

  const onDragEnd = (result: DropResult, isFixed: boolean) => {
    if (!result.destination) return;
    const list = isFixed ? fixedDebts : occasionalDebts;
    reorderDebts(result.source.index, result.destination.index, list);
  };

  const DebtItem = ({ debt, index }: { debt: Debt; index: number }) => {
    const isExpanded = expandedId === debt.id;

    return (
      <Draggable draggableId={debt.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={clsx(
              "mb-2 border rounded-lg overflow-hidden bg-white shadow-sm transition-colors",
              !debt.isFixed && "bg-slate-50 border-slate-200"
            )}
          >
            <div 
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : debt.id)}
            >
              <div className="flex flex-1 items-center space-x-3 truncate">
                <span className={clsx("text-sm font-bold truncate", debt.isPaid && "line-through text-gray-400")}>
                  {debt.concept}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={clsx("text-sm font-bold", debt.isPaid ? "text-gray-400" : "text-red-600")}>
                  {formatCurrency(debt.isFixed ? debt.originalAmount : debt.remainingAmount)}
                </span>
                {debt.isFixed && (
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    checked={debt.isPaid}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => toggleDebtPaid(debt.id, e.target.checked)}
                  />
                )}
                {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm">
                <p className="text-gray-700 mb-1"><strong>Acreedor:</strong> {debt.creditor}</p>
                {!debt.isFixed && (
                  <p className="text-gray-700 mb-1"><strong>Monto Original:</strong> {formatCurrency(debt.originalAmount)}</p>
                )}
                <p className="text-gray-700 mb-3"><strong>Creado el:</strong> {format(new Date(debt.createdAt), 'dd/MM/yyyy')}</p>
                
                {!debt.isFixed && (
                  <>
                    <div className="h-px bg-gray-200 my-3" />
                    <p className="font-bold mb-2">Historial de Pagos:</p>
                    {debt.payments.length === 0 ? (
                      <p className="text-gray-500 text-xs italic">No hay pagos registrados aún.</p>
                    ) : (
                      <ul className="space-y-1">
                        {debt.payments.map(p => (
                          <li key={p.id} className="flex justify-between text-xs">
                            <span>{format(new Date(p.date), 'dd/MM/yyyy')}</span>
                            <span className="text-green-600 font-bold">-{formatCurrency(p.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-200">
                  {!debt.isFixed && !debt.isPaid && (
                    <Link href={`/debts/${debt.id}/pay`} className="flex items-center text-blue-600 text-xs font-bold px-2 py-1 bg-blue-50 rounded hover:bg-blue-100">
                      <CreditCard size={14} className="mr-1" /> Abonar
                    </Link>
                  )}
                  <Link href={`/debts/edit/${debt.id}`} className="text-orange-500 p-1 hover:bg-orange-50 rounded">
                    <Edit size={16} />
                  </Link>
                  <button onClick={() => deleteDebt(debt.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  const DebtSection = ({ title, list, isFixed }: { title: string; list: Debt[]; isFixed: boolean }) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">{title}</h3>
        <DragDropContext onDragEnd={(res) => onDragEnd(res, isFixed)}>
          <Droppable droppableId={`droppable-${isFixed ? 'fixed' : 'occasional'}`}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {list.map((debt, index) => (
                  <DebtItem key={debt.id} debt={debt} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-white min-h-screen relative flex flex-col shadow-sm">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center shadow-md z-10 sticky top-0">
        <Link href="/" className="mr-3 p-1 hover:bg-red-700 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">A Pagar (Deudas)</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p>No tienes deudas registradas 🎉</p>
          </div>
        ) : (
          <>
            <DebtSection title="Fijas" list={fixedDebts} isFixed={true} />
            <DebtSection title="Ocasionales" list={occasionalDebts} isFixed={false} />
          </>
        )}
      </main>

      <div className="fixed bottom-6 right-6 lg:absolute lg:bottom-6 lg:right-6">
        <Link href="/debts/add" className="bg-red-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-transform active:scale-95">
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
}
