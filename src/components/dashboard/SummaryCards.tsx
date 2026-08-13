'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, Scale, 
  Clock, CalendarCheck, ShieldCheck, Landmark 
} from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const { summary } = useFinance();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Saldo Disponível */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saldo Disponível</span>
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {formatCurrency(summary.availableBalance)}
        </p>
        <span className="inline-block mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-lg">
          Contas ativas
        </span>
      </div>

      {/* 2. Entradas (Realizadas) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Entradas (Realizadas)</span>
          <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
          + {formatCurrency(summary.monthIncomeCompleted)}
        </p>
        <span className="inline-block mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Receita efetivada
        </span>
      </div>

      {/* 3. Saídas (Realizadas) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saídas (Realizadas)</span>
          <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
          - {formatCurrency(summary.monthExpenseCompleted)}
        </p>
        <span className="inline-block mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Despesas pagas
        </span>
      </div>

      {/* 4. Resultado do Período */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resultado do Mês</span>
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
            summary.monthResultCompleted >= 0
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
          }`}>
            <Scale className="w-5 h-5" />
          </div>
        </div>
        <p className={`text-2xl font-black tracking-tight ${
          summary.monthResultCompleted >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
        }`}>
          {summary.monthResultCompleted >= 0 ? '+' : ''}{formatCurrency(summary.monthResultCompleted)}
        </p>
        <span className="inline-block mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Entradas − Saídas
        </span>
      </div>

      {/* 5. Entradas Previstas */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-4 rounded-3xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Entradas Previstas</span>
          <Clock className="w-4 h-4 text-teal-500" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
          + {formatCurrency(summary.monthIncomePlanned)}
        </p>
      </div>

      {/* 6. Saídas Previstas */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-4 rounded-3xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saídas Previstas</span>
          <Clock className="w-4 h-4 text-rose-500" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
          - {formatCurrency(summary.monthExpensePlanned)}
        </p>
      </div>

      {/* 7. Saldo Projetado */}
      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-4 rounded-3xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Saldo Projetado no Fim do Mês</span>
          <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
          {formatCurrency(summary.projectedBalance)}
        </p>
      </div>

      {/* 8. Patrimônio Líquido */}
      <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 p-4 rounded-3xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">Patrimônio Líquido</span>
          <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
          {formatCurrency(summary.netWorth)}
        </p>
      </div>
    </div>
  );
};
