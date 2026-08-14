'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { MonthlySelector } from '@/components/layout/MonthlySelector';
import { Download, PieChart, TrendingUp, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const { transactions, categories, selectedYear, selectedMonth, summary } = useFinance();

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(monthStr));

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const exportCSV = () => {
    const headers = ['Data', 'Descrição', 'Tipo', 'Status', 'Categoria', 'Valor (R$)'];
    const rows = monthTransactions.map(t => {
      const cat = categories.find(c => c.id === t.category_id)?.name || 'Sem categoria';
      return [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.type,
        t.status,
        `"${cat.replace(/"/g, '""')}"`,
        t.amount.toFixed(2)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `extrato_financeiro_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Relatórios & Exportação</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Veja o resumo do seu dinheiro e baixe sua planilha em CSV</p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" /> Baixar Planilha CSV
        </button>
      </div>

      <MonthlySelector />

      {/* Financial Statement Summary Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Resumo de Entradas e Saídas do Mês
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <div className="py-3 flex justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Tudo o que você recebeu (Receitas)</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">{formatBRL(summary.monthIncomeCompleted)}</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Tudo o que você pagou (Despesas)</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">- {formatBRL(summary.monthExpenseCompleted)}</span>
          </div>
          <div className="py-3 flex justify-between text-base font-black border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-900 dark:text-white">Sobra do Mês (O que sobrou para guardar)</span>
            <span className={summary.monthResultCompleted >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}>
              {formatBRL(summary.monthResultCompleted)}
            </span>
          </div>
          <div className="py-3 flex justify-between text-xs text-slate-500">
            <span>Ainda para receber neste mês</span>
            <span>+ {formatBRL(summary.monthIncomePlanned)}</span>
          </div>
          <div className="py-3 flex justify-between text-xs text-slate-500">
            <span>Ainda para pagar neste mês</span>
            <span>- {formatBRL(summary.monthExpensePlanned)}</span>
          </div>
          <div className="py-3 flex justify-between text-sm font-bold text-emerald-700 dark:text-emerald-400">
            <span>Dinheiro estimado no final do mês</span>
            <span>{formatBRL(summary.projectedBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
