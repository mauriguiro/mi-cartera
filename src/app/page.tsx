'use client';

import Link from 'next/link';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/formatters';
import { Wallet, CreditCard, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function DashboardScreen() {
  const { netBalance, totalReceivables, totalDebt } = useFinance();

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-900 min-h-screen relative shadow-sm">
      <header className="bg-gray-800 text-white px-4 py-4 shadow-sm text-center border-b border-gray-700">
        <h1 className="text-xl font-black tracking-tight text-white">MiCartera</h1>
      </header>

      <main className="p-4 space-y-8 pb-20">
        {/* Balance Neto */}
        <div className="bg-gray-800 rounded-2xl p-6 text-center shadow-lg border border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-red-500"></div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Balance Neto</p>
          <p className={clsx("text-4xl font-black mb-1", netBalance >= 0 ? "text-white" : "text-red-400")}>
            {formatCurrency(netBalance)}
          </p>
          <p className="text-xs text-gray-500">Total a cobrar menos total a pagar</p>
        </div>

        {/* Accesos */}
        <div className="space-y-4">
          <Link href="/receivables" className="block">
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-2xl shadow-sm flex items-center hover:bg-gray-750 transition-colors">
              <div className="p-3 bg-blue-500/20 rounded-full shadow-inner mr-4">
                <Wallet className="text-blue-400" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-300 tracking-wide">A Cobrar</h2>
                <p className="text-2xl font-black text-blue-400 mt-1">{formatCurrency(totalReceivables)}</p>
              </div>
              <ChevronRight className="text-gray-600" />
            </div>
          </Link>

          <Link href="/debts" className="block">
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-2xl shadow-sm flex items-center hover:bg-gray-750 transition-colors">
              <div className="p-3 bg-red-500/20 rounded-full shadow-inner mr-4">
                <CreditCard className="text-red-400" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-300 tracking-wide">A Pagar</h2>
                <p className="text-2xl font-black text-red-400 mt-1">{formatCurrency(totalDebt)}</p>
              </div>
              <ChevronRight className="text-gray-600" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
