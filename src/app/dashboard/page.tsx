'use client';

import React from 'react';
import Link from 'next/link';
import { useFinance } from '@/context/FinanceContext';
import { MonthlySelector } from '@/components/layout/MonthlySelector';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { CategoryExpenseChart } from '@/components/dashboard/CategoryExpenseChart';
import { PlanningSummaryWidget } from '@/components/dashboard/PlanningSummaryWidget';
import { DynamicIcon } from '@/components/ui/Icon';
import { ArrowRight, CheckCircle2, Clock, CreditCard as CardIcon } from 'lucide-react';

export default function DashboardPage() {
  const { 
    transactions, categories, accounts, creditCards, 
    selectedYear, selectedMonth, updateTransaction 
  } = useFinance();

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const recentTransactions = transactions
    .filter(t => t.date && t.date.startsWith(monthStr))
    .slice(0, 5);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Monthly Selector */}
      <MonthlySelector />

      {/* Main 8 Key Indicators */}
      <SummaryCards />

      {/* Planning & Daily Suggested Limit Banner */}
      <PlanningSummaryWidget />

      {/* Credit Cards Summary Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CardIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Cartões de Crédito
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Limites e obrigações de faturas</p>
          </div>
          <Link
            href="/dashboard/cartoes"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Gerenciar faturas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {creditCards.map(card => (
            <div key={card.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{card.name}</h4>
                  <span className="text-[10px] text-slate-400">Vencimento Dia {card.due_day}</span>
                </div>
                <CardIcon className="w-5 h-5 text-indigo-500" />
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Comprometido:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{formatBRL(card.committed_limit || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Disponível:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(card.available_limit || 0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EvolutionChart />
        </div>
        <div>
          <CategoryExpenseChart />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Últimos Lançamentos do Mês</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Atividades recentes da sua conta</p>
          </div>
          <Link
            href="/dashboard/lancamentos"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Ver extrato completo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm italic">
            Nenhum lançamento registrado neste mês. Clique em "+ Nova Transação" para começar.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map(tx => {
              const category = categories.find(c => c.id === tx.category_id);
              const account = accounts.find(a => a.id === tx.account_id);

              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: category?.color || '#64748b' }}
                    >
                      <DynamicIcon name={category?.icon || 'Tag'} size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{account?.name || 'Conta'}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          tx.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {tx.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {tx.status === 'completed' ? 'Realizado' : 'Previsto'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className={`text-sm font-extrabold block ${
                        tx.type === 'income'
                          ? 'text-teal-600 dark:text-teal-400'
                          : tx.type === 'expense'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} {formatBRL(tx.amount)}
                      </span>
                    </div>

                    {tx.status === 'planned' && (
                      <button
                        onClick={() => updateTransaction(tx.id, { status: 'completed' })}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors shrink-0"
                        title="Marcar como realizado"
                      >
                        Pagar / Receber
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
