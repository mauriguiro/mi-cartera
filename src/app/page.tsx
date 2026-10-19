'use client';

import Link from 'next/link';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatUSD } from '@/utils/formatters';
import { Wallet, CreditCard, Banknote, ChevronRight, LogOut } from 'lucide-react';
import clsx from 'clsx';

import Image from 'next/image';

export default function DashboardScreen() {
  const { netBalance, totalReceivables, totalDebt, totalPortfolio, totalPortfolioUSD, currentUser, logout } = useFinance();

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-950 min-h-screen relative shadow-sm flex flex-col">
      <header className="bg-gray-800 text-white px-4 py-3.5 shadow-sm flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md">
            <Image src="/icon.png" alt="MiCartera Icon" width={36} height={36} className="object-cover" priority />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-tight">MiCartera</h1>
            {currentUser && (
              <p className="text-[11px] text-gray-400 font-medium leading-tight">
                {currentUser.fullName} <span className="text-emerald-400">(@{currentUser.username})</span>
              </p>
            )}
          </div>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-red-400 bg-gray-900 hover:bg-gray-950 border border-gray-700 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        )}
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
          <Link href="/portfolio" className="block">
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-2xl shadow-sm flex items-center hover:bg-gray-750 transition-colors">
              <div className="p-3 bg-emerald-500/20 rounded-full shadow-inner mr-4">
                <Banknote className="text-emerald-400" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-300 tracking-wide">En Cartera</h2>
                <div className="flex flex-wrap items-baseline gap-2 mt-1">
                  <p className="text-2xl font-black text-emerald-400">{formatCurrency(totalPortfolio)}</p>
                  {totalPortfolioUSD > 0 && (
                    <span className="text-xs font-black text-lime-300 bg-lime-950/70 border border-lime-700/60 px-2 py-0.5 rounded-lg">
                      + {formatUSD(totalPortfolioUSD)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="text-gray-600 shrink-0" />
            </div>
          </Link>

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

      <footer className="mt-auto py-4 text-center">
        <span className="text-[11px] font-medium text-gray-600">MiCartera v0.3.4</span>
      </footer>
    </div>
  );
}
