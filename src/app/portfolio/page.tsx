'use client';

import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { formatCurrency, formatUSD } from '@/utils/formatters';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  Banknote,
  FileSpreadsheet,
  Landmark,
  DollarSign,
  StickyNote,
  GripVertical,
  ArrowUpDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { PortfolioCategory } from '@/types';
import clsx from 'clsx';

const CATEGORY_META: Record<
  PortfolioCategory,
  { label: string; badgeClass: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  efectivo: {
    label: 'Efectivo',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
    Icon: Banknote,
  },
  cheque: {
    label: 'Cheque',
    badgeClass: 'bg-teal-950 text-teal-300 border-teal-700/60',
    Icon: FileSpreadsheet,
  },
  cuenta: {
    label: 'En Cuenta',
    badgeClass: 'bg-green-950 text-green-300 border-green-700/60',
    Icon: Landmark,
  },
  dolares: {
    label: 'Dólares',
    badgeClass: 'bg-lime-950 text-lime-300 border-lime-700/60',
    Icon: DollarSign,
  },
};

export default function PortfolioPage() {
  const { portfolio, totalPortfolio, totalPortfolioUSD, reorderPortfolio, deletePortfolioItem } = useFinance();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'todos' | PortfolioCategory>('todos');
  const [isReordering, setIsReordering] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalEfectivo = portfolio
    .filter((i) => i.category === 'efectivo')
    .reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalCheques = portfolio
    .filter((i) => i.category === 'cheque')
    .reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalCuenta = portfolio
    .filter((i) => i.category === 'cuenta')
    .reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalDolares = portfolio
    .filter((i) => i.category === 'dolares')
    .reduce((acc, i) => acc + (i.amount || 0), 0);

  const filteredList =
    filterCategory === 'todos'
      ? portfolio
      : portfolio.filter((item) => item.category === filterCategory);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || filterCategory !== 'todos') return;
    reorderPortfolio(result.source.index, result.destination.index, portfolio);
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-950 min-h-screen relative flex flex-col shadow-sm">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-sm z-10 sticky top-0 border-b border-gray-700">
        <div className="flex items-center">
          <Link href="/" className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-bold leading-tight">En Cartera</h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-black text-emerald-400">{formatCurrency(totalPortfolio)}</p>
              {totalPortfolioUSD > 0 && (
                <span className="text-xs font-black text-lime-400">
                  + {formatUSD(totalPortfolioUSD)}
                </span>
              )}
            </div>
          </div>
        </div>
        {portfolio.length > 1 && filterCategory === 'todos' && (
          <button
            type="button"
            onClick={() => setIsReordering(!isReordering)}
            className={clsx(
              "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors",
              isReordering
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white"
            )}
          >
            <ArrowUpDown size={13} />
            {isReordering ? 'Listo' : 'Ordenar'}
          </button>
        )}
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {/* Subtotales / Autosuma por tipo */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setFilterCategory(filterCategory === 'efectivo' ? 'todos' : 'efectivo')}
            className={clsx(
              'p-2.5 rounded-xl border text-left transition-all',
              filterCategory === 'efectivo'
                ? 'bg-emerald-900/40 border-emerald-500 shadow-sm'
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            )}
          >
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
              <Banknote size={14} />
              <span>Efectivo</span>
            </div>
            <p className="text-xs font-black text-white truncate">{formatCurrency(totalEfectivo)}</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory(filterCategory === 'cheque' ? 'todos' : 'cheque')}
            className={clsx(
              'p-2.5 rounded-xl border text-left transition-all',
              filterCategory === 'cheque'
                ? 'bg-emerald-900/40 border-emerald-500 shadow-sm'
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            )}
          >
            <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold mb-1">
              <FileSpreadsheet size={14} />
              <span>Cheques</span>
            </div>
            <p className="text-xs font-black text-white truncate">{formatCurrency(totalCheques)}</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory(filterCategory === 'cuenta' ? 'todos' : 'cuenta')}
            className={clsx(
              'p-2.5 rounded-xl border text-left transition-all',
              filterCategory === 'cuenta'
                ? 'bg-emerald-900/40 border-emerald-500 shadow-sm'
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            )}
          >
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold mb-1">
              <Landmark size={14} />
              <span>En Cuenta</span>
            </div>
            <p className="text-xs font-black text-white truncate">{formatCurrency(totalCuenta)}</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory(filterCategory === 'dolares' ? 'todos' : 'dolares')}
            className={clsx(
              'p-2.5 rounded-xl border text-left transition-all',
              filterCategory === 'dolares'
                ? 'bg-lime-900/40 border-lime-500 shadow-sm'
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            )}
          >
            <div className="flex items-center gap-1.5 text-lime-400 text-xs font-bold mb-1">
              <DollarSign size={14} />
              <span>Dólares</span>
            </div>
            <p className="text-xs font-black text-white truncate">{formatUSD(totalDolares)}</p>
          </button>
        </div>

        {filterCategory !== 'todos' && (
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-xs text-gray-400">
              Filtrando por: <strong className="text-emerald-400 uppercase">{CATEGORY_META[filterCategory].label}</strong>
            </span>
            <button
              type="button"
              onClick={() => setFilterCategory('todos')}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              Ver todos
            </button>
          </div>
        )}

        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-16">
            <p className="text-lg font-medium">No hay registros en cartera</p>
            <p className="text-sm mt-1 text-center">Toca el botón + para cargar efectivo, cheques, saldo en cuenta o dólares</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-portfolio">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
                  {filteredList.map((item, index) => {
                    const isExpanded = expandedId === item.id;
                    const meta = CATEGORY_META[item.category] || CATEGORY_META.efectivo;
                    const Icon = meta.Icon;
                    const isUSD = item.category === 'dolares';

                    return (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={!isReordering || filterCategory !== 'todos'}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border-gray-700 border rounded-lg overflow-hidden bg-gray-800 shadow-sm transition-colors"
                          >
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            >
                              <div className="flex flex-1 items-center space-x-2 min-w-0 pr-2">
                                {isReordering && filterCategory === 'todos' && (
                                  <div
                                    {...provided.dragHandleProps}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-emerald-400 p-1 -ml-1 cursor-grab active:cursor-grabbing shrink-0"
                                    title="Arrastrar para reordenar"
                                  >
                                    <GripVertical size={16} />
                                  </div>
                                )}
                                <span
                                  className={clsx(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border shrink-0',
                                    meta.badgeClass
                                  )}
                                >
                                  <Icon size={12} />
                                  {meta.label}
                                </span>
                                <div className="truncate">
                                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                                  {!isExpanded && item.notes && (
                                    <p className="text-xs text-gray-400 truncate">{item.notes}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2.5 shrink-0">
                                <span
                                  className={clsx(
                                    'text-sm font-bold',
                                    isUSD ? 'text-lime-400' : 'text-emerald-400'
                                  )}
                                >
                                  {isUSD ? formatUSD(item.amount) : formatCurrency(item.amount)}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp size={16} className="text-gray-500" />
                                ) : (
                                  <ChevronDown size={16} className="text-gray-500" />
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 bg-gray-950 border-t border-gray-800 text-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-400 text-xs">
                                    <strong>Tipo:</strong> {meta.label}
                                  </span>
                                  <span className="text-gray-400 text-xs">
                                    <strong>Creado el:</strong> {format(new Date(item.createdAt), 'dd/MM/yyyy')}
                                  </span>
                                </div>

                                <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-800">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                                    <StickyNote size={13} />
                                    <span>Anotaciones / Aclaraciones:</span>
                                  </div>
                                  {item.notes ? (
                                    <p className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed">
                                      {item.notes}
                                    </p>
                                  ) : (
                                    <p className="text-gray-500 text-xs italic">Sin anotaciones adicionales.</p>
                                  )}
                                </div>

                                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-700">
                                  <Link
                                    href={`/portfolio/edit/${item.id}`}
                                    className="text-orange-400 p-1 hover:bg-orange-900/30 rounded"
                                  >
                                    <Edit size={16} />
                                  </Link>
                                  <button
                                    onClick={() => deletePortfolioItem(item.id)}
                                    className="text-red-400 p-1 hover:bg-red-900/30 rounded"
                                  >
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
        <Link
          href={filterCategory !== 'todos' ? `/portfolio/add?category=${filterCategory}` : '/portfolio/add'}
          className="bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-500 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
}
