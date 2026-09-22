'use client';

import Link from 'next/link';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/formatters';
import { Wallet, CreditCard, ChevronRight } from 'lucide-react';

export default function DashboardScreen() {
  const { netBalance, totalReceivables, totalDebt } = useFinance();

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-white min-h-screen relative shadow-sm">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">MiCartera</h1>
      </header>

      <main className="p-4 space-y-8 pb-20">
        <div className="flex justify-center mt-4">
          <div className="px-4 py-2 bg-gray-100 rounded-full border border-gray-200 flex items-center shadow-sm">
            <span className="text-gray-500 text-xs font-medium mr-2">Balance Neto:</span>
            <span className={`text-sm font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/receivables" className="block">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl shadow-sm flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-500 rounded-full shadow-inner mr-4">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-800 tracking-wide">A Cobrar</h2>
                <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(totalReceivables)}</p>
              </div>
              <ChevronRight className="text-gray-400" />
            </div>
          </Link>

          <Link href="/debts" className="block">
            <div className="p-4 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-2xl shadow-sm flex items-center hover:shadow-md transition-shadow">
              <div className="p-3 bg-red-500 rounded-full shadow-inner mr-4">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-800 tracking-wide">A Pagar</h2>
                <p className="text-2xl font-black text-red-600 mt-1">{formatCurrency(totalDebt)}</p>
              </div>
              <ChevronRight className="text-gray-400" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
