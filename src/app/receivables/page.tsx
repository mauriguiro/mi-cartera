'use client';

import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Receivable } from '@/types';
import clsx from 'clsx';

export default function ReceivablesPage() {
  const { receivables, reorderReceivables, markReceivableAsPaid, deleteReceivable } = useFinance();
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    <div className="flex-1 w-full max-w-md mx-auto bg-white min-h-screen relative flex flex-col shadow-sm">
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center shadow-md z-10 sticky top-0">
        <Link href="/" className="mr-3 p-1 hover:bg-blue-700 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold">A Cobrar (Me deben)</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {receivables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p>No tienes cuentas por cobrar.</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="receivables-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {receivables.map((rec, index) => {
                    const isExpanded = expandedId === rec.id;
                    return (
                      <Draggable key={rec.id} draggableId={rec.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="border rounded-lg overflow-hidden bg-white shadow-sm transition-colors"
                          >
                            <div 
                              className="flex items-center justify-between p-3 cursor-pointer"
                              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                            >
                              <div className="flex flex-1 items-center space-x-3 truncate">
                                <span className={clsx("text-sm font-bold truncate", rec.isPaid && "line-through text-gray-400")}>
                                  {rec.debtor}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={clsx("text-sm font-bold", rec.isPaid ? "text-gray-400" : "text-blue-600")}>
                                  {formatCurrency(rec.amount)}
                                </span>
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  checked={rec.isPaid}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => markReceivableAsPaid(rec.id, e.target.checked)}
                                />
                                {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm">
                                <p className="text-gray-700 mb-1"><strong>Concepto:</strong> {rec.concept}</p>
                                <p className="text-gray-700 mb-3"><strong>Creado el:</strong> {format(new Date(rec.createdAt), 'dd/MM/yyyy')}</p>
                                
                                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-200">
                                  <Link href={`/receivables/edit/${rec.id}`} className="text-orange-500 p-1 hover:bg-orange-50 rounded">
                                    <Edit size={16} />
                                  </Link>
                                  <button onClick={() => deleteReceivable(rec.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
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
