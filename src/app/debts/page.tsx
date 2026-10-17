'use client';

import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Trash2, Edit, CreditCard, Share2, FileDown, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Debt } from '@/types';
import { generateAndShareDebtPDF } from '@/utils/pdfReport';
import clsx from 'clsx';

export default function DebtsPage() {
  const { debts, reorderDebts, toggleDebtPaid, deleteDebt } = useFinance();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const fixedDebts = debts.filter(d => d.isFixed);
  const occasionalDebts = debts.filter(d => !d.isFixed);

  const onDragEnd = (result: DropResult, isFixed: boolean) => {
    if (!result.destination) return;
    const list = isFixed ? fixedDebts : occasionalDebts;
    reorderDebts(result.source.index, result.destination.index, list);
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-950 min-h-screen relative flex flex-col shadow-sm">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center shadow-sm z-10 sticky top-0 border-b border-gray-700">
        <Link href="/" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">A Pagar (Deudas)</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
            <p className="text-lg font-medium">No hay deudas registradas</p>
            <p className="text-sm mt-1">Toca el botón + para añadir una</p>
          </div>
        ) : (
          <>
            {fixedDebts.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-end mb-4 px-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">Fijas</h3>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Restante este mes</p>
                    <p className="text-sm font-bold text-red-400">
                      {formatCurrency(fixedDebts.filter(d => !d.isPaid).reduce((acc, d) => acc + d.originalAmount, 0))}
                    </p>
                  </div>
                </div>
                <DragDropContext onDragEnd={(res) => onDragEnd(res, true)}>
                  <Droppable droppableId="droppable-fixed">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                        {fixedDebts.map((debt, index) => {
                          const isExpanded = expandedId === debt.id;
                          return (
                            <Draggable key={debt.id} draggableId={debt.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={clsx(
                                    "rounded-lg overflow-hidden shadow-sm transition-colors",
                                    debt.isFixed ? "bg-gray-900" : "bg-gray-800 border border-gray-700"
                                  )}
                                >
                                  <div 
                                    className="flex items-center justify-between p-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : debt.id)}
                                  >
                                    <div className="flex flex-1 items-center space-x-2 truncate">
                                      <div
                                        {...provided.dragHandleProps}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-gray-600 hover:text-gray-400 p-1 -ml-1 cursor-grab active:cursor-grabbing shrink-0"
                                        title="Mantener para reordenar"
                                      >
                                        <GripVertical size={15} />
                                      </div>
                                      <span className={clsx("text-sm font-bold truncate", debt.isPaid && "line-through text-gray-400")}>
                                        {debt.concept}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <span className={clsx("text-sm font-bold", debt.isPaid ? "text-gray-400" : "text-red-400")}>
                                        {formatCurrency(debt.isFixed ? debt.originalAmount : debt.remainingAmount)}
                                      </span>
                                      {debt.isFixed && (
                                        <input
                                          type="checkbox"
                                          className="appearance-none w-5 h-5 bg-gray-900 border-2 border-gray-600 rounded flex items-center justify-center checked:bg-gray-700 checked:border-gray-500 cursor-pointer relative after:content-['✓'] after:text-gray-300 after:text-xs after:font-bold after:hidden checked:after:block transition-colors"
                                          checked={debt.isPaid}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => toggleDebtPaid(debt.id, e.target.checked)}
                                        />
                                      )}
                                      {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="p-4 bg-gray-950 border-t border-gray-800 text-sm">
                                      <p className="text-gray-300 mb-1"><strong>Acreedor:</strong> {debt.creditor}</p>
                                      {!debt.isFixed && (
                                        <p className="text-gray-300 mb-1"><strong>Monto Original:</strong> {formatCurrency(debt.originalAmount)}</p>
                                      )}
                                      <p className="text-gray-300 mb-3"><strong>Creado el:</strong> {format(new Date(debt.createdAt), 'dd/MM/yyyy')}</p>
                                      
                                      {!debt.isFixed && (
                                        <>
                                          <div className="h-px bg-gray-700 my-3" />
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

                                      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-700">
                                        {!debt.isFixed && !debt.isPaid && (
                                          <Link href={`/debts/${debt.id}/pay`} className="flex items-center text-blue-400 text-xs font-bold px-2 py-1 bg-blue-900/30 rounded hover:bg-blue-900/50">
                                            <CreditCard size={14} className="mr-1" /> Abonar
                                          </Link>
                                        )}
                                        <Link href={`/debts/edit/${debt.id}`} className="text-orange-400 p-1 hover:bg-orange-900/30 rounded">
                                          <Edit size={16} />
                                        </Link>
                                        <button onClick={() => deleteDebt(debt.id)} className="text-red-400 p-1 hover:bg-red-900/30 rounded">
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
              </div>
            )}

            {occasionalDebts.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-end mb-4 px-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">Ocasionales</h3>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total restante</p>
                    <p className="text-sm font-bold text-red-400">
                      {formatCurrency(occasionalDebts.filter(d => !d.isPaid).reduce((acc, d) => acc + (d.remainingAmount !== undefined ? d.remainingAmount : d.originalAmount), 0))}
                    </p>
                  </div>
                </div>
                <DragDropContext onDragEnd={(res) => onDragEnd(res, false)}>
                  <Droppable droppableId="droppable-occasional">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                        {occasionalDebts.map((debt, index) => {
                          const isExpanded = expandedId === debt.id;
                          const totalPaid = debt.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                          let runningBalance = debt.originalAmount;

                          return (
                            <Draggable key={debt.id} draggableId={debt.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={clsx(
                                    "rounded-lg overflow-hidden shadow-sm transition-colors border",
                                    debt.isFixed ? "bg-gray-900 border-transparent" : "bg-gray-800 border-gray-700"
                                  )}
                                >
                                  <div 
                                    className="flex items-center justify-between p-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : debt.id)}
                                  >
                                    <div className="flex flex-1 items-center space-x-2 truncate">
                                      <div
                                        {...provided.dragHandleProps}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-gray-600 hover:text-gray-400 p-1 -ml-1 cursor-grab active:cursor-grabbing shrink-0"
                                        title="Mantener para reordenar"
                                      >
                                        <GripVertical size={15} />
                                      </div>
                                      <span className={clsx("text-sm font-bold truncate", debt.isPaid && "line-through text-gray-400")}>
                                        {debt.concept}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <span className={clsx("text-sm font-bold", debt.isPaid ? "text-gray-400" : "text-red-400")}>
                                        {formatCurrency(debt.isFixed ? debt.originalAmount : debt.remainingAmount)}
                                      </span>
                                      {debt.isFixed && (
                                        <input
                                          type="checkbox"
                                          className="appearance-none w-5 h-5 bg-gray-900 border-2 border-gray-600 rounded flex items-center justify-center checked:bg-gray-700 checked:border-gray-500 cursor-pointer relative after:content-['✓'] after:text-gray-300 after:text-xs after:font-bold after:hidden checked:after:block transition-colors"
                                          checked={debt.isPaid}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => toggleDebtPaid(debt.id, e.target.checked)}
                                        />
                                      )}
                                      {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="p-4 bg-gray-950 border-t border-gray-800 text-sm">
                                      <p className="text-gray-300 mb-1"><strong>Acreedor:</strong> {debt.creditor}</p>
                                      {!debt.isFixed && (
                                        <>
                                          <p className="text-gray-300 mb-1"><strong>Monto Original:</strong> {formatCurrency(debt.originalAmount)}</p>
                                          <p className="text-gray-300 mb-1">
                                            <strong>Total Entregado:</strong>{' '}
                                            <span className="text-green-400 font-bold">{formatCurrency(totalPaid)}</span>
                                          </p>
                                          <p className="text-gray-300 mb-1">
                                            <strong>Saldo Restante:</strong>{' '}
                                            <span className="text-red-400 font-bold">{formatCurrency(debt.remainingAmount)}</span>
                                          </p>
                                        </>
                                      )}
                                      <p className="text-gray-300 mb-3"><strong>Creado el:</strong> {format(new Date(debt.createdAt), 'dd/MM/yyyy')}</p>
                                      
                                      {!debt.isFixed && (
                                        <>
                                          <div className="h-px bg-gray-700 my-3" />
                                          <p className="font-bold mb-2">Historial de Entregas ({debt.payments.length}):</p>
                                          {debt.payments.length === 0 ? (
                                            <p className="text-gray-500 text-xs italic">No hay entregas registradas aún.</p>
                                          ) : (
                                            <ul className="space-y-1.5">
                                              {debt.payments.map((p, idx) => {
                                                runningBalance = Math.max(0, runningBalance - (Number(p.amount) || 0));
                                                return (
                                                  <li key={p.id} className="flex justify-between items-center text-xs bg-gray-900/80 px-2.5 py-1.5 rounded border border-gray-800">
                                                    <div>
                                                      <span className="font-semibold text-gray-300">#{idx + 1}</span>{' '}
                                                      <span className="text-gray-400">{format(new Date(p.date), 'dd/MM/yyyy')}</span>
                                                    </div>
                                                    <div className="text-right">
                                                      <span className="text-green-400 font-bold">-{formatCurrency(p.amount)}</span>
                                                      <span className="text-gray-500 ml-2">(Resta: {formatCurrency(runningBalance)})</span>
                                                    </div>
                                                  </li>
                                                );
                                              })}
                                            </ul>
                                          )}
                                        </>
                                      )}

                                      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-700">
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => generateAndShareDebtPDF(debt, 'share')}
                                            className="flex items-center text-emerald-400 text-xs font-bold px-2.5 py-1.5 bg-emerald-900/30 border border-emerald-800/50 rounded hover:bg-emerald-900/50 transition-colors"
                                            title="Compartir o descargar reporte en PDF"
                                          >
                                            <Share2 size={14} className="mr-1.5" /> Compartir PDF
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => generateAndShareDebtPDF(debt, 'download')}
                                            className="flex items-center text-gray-300 text-xs font-semibold px-2 py-1.5 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors"
                                            title="Descargar archivo PDF"
                                          >
                                            <FileDown size={14} />
                                          </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {!debt.isFixed && !debt.isPaid && (
                                            <Link href={`/debts/${debt.id}/pay`} className="flex items-center text-blue-400 text-xs font-bold px-2.5 py-1.5 bg-blue-900/30 rounded hover:bg-blue-900/50">
                                              <CreditCard size={14} className="mr-1" /> Abonar
                                            </Link>
                                          )}
                                          <Link href={`/debts/edit/${debt.id}`} className="text-orange-400 p-1.5 hover:bg-orange-900/30 rounded">
                                            <Edit size={16} />
                                          </Link>
                                          <button onClick={() => deleteDebt(debt.id)} className="text-red-400 p-1.5 hover:bg-red-900/30 rounded">
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
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
              </div>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-6 right-6 lg:absolute lg:bottom-6 lg:right-6">
        <Link href="/debts/add" className="bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-transform active:scale-95">
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
}
