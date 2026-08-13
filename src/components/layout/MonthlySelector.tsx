'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MonthlySelector: React.FC = () => {
  const { selectedYear, selectedMonth, setPeriod } = useFinance();

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setPeriod(selectedYear - 1, 12);
    } else {
      setPeriod(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setPeriod(selectedYear + 1, 1);
    } else {
      setPeriod(selectedYear, selectedMonth + 1);
    }
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    setPeriod(now.getFullYear(), now.getMonth() + 1);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-sm">
      {/* Month Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-[170px] justify-center text-slate-900 dark:text-white font-semibold text-lg">
          <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Próximo Mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Shortcuts */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
        <button
          onClick={handleSetCurrentMonth}
          className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          Este mês
        </button>
        <button
          onClick={() => {
            const now = new Date();
            let m = now.getMonth();
            let y = now.getFullYear();
            if (m === 0) { m = 12; y--; }
            setPeriod(y, m);
          }}
          className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          Mês anterior
        </button>
        <button
          onClick={() => {
            const now = new Date();
            let m = now.getMonth() + 2;
            let y = now.getFullYear();
            if (m === 13) { m = 1; y++; }
            setPeriod(y, m);
          }}
          className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          Próximo mês
        </button>
      </div>
    </div>
  );
};
