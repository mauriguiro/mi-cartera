'use client';

import Link from 'next/link';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/utils/formatters';
import { Wallet, CreditCard, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

import Image from 'next/image';

export default function DashboardScreen() {
  const { netBalance, totalReceivables, totalDebt } = useFinance();

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-950 min-h-screen relative shadow-sm flex flex-col">
      <header className="bg-gray-800 text-white px-4 py-4 shadow-sm flex items-center justify-center gap-2.5 border-b border-gray-700">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gray-900 border border-gray-700 shadow-inner">
          <Image src="/icon.svg" alt="MiCartera Icon" width={28} height={28} />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">MiCartera</h1>
      </header>

      <main className="p-4 space-y-8 pb-20">
        {/* Balance Neto */}
        <div className="flex justify-center mt-2">
          <div className="px-4 py-2 bg-gray-800 rounded-full border border-gray-700 flex items-center shadow-sm">
            <span className="text-gray-400 text-xs font-medium mr-2">Balance Neto:</span>
            <span className={clsx("text-sm font-bold", netBalance >= 0 ? "text-green-400" : "text-red-400")}>
              {formatCurrency(netBalance)}
            </span>
          </div>
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
