'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export const EvolutionChart: React.FC = () => {
  const { transactions, selectedYear, selectedMonth } = useFinance();
  const [rangeMonths, setRangeMonths] = useState<number>(6);

  // Generate historical data points
  const chartData = [];
  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = rangeMonths - 1; i >= 0; i--) {
    const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    const monthLabel = `${MONTH_NAMES[m - 1]}/${String(y).slice(-2)}`;

    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.status === 'completed' && t.date && t.date.startsWith(monthKey)) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') income += amt;
        if (t.type === 'expense') expense += amt;
      }
    });

    chartData.push({
      month: monthLabel,
      Entradas: income,
      Saídas: expense,
      Resultado: income - expense
    });
  }

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Evolução Financeira Mensal</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Comparativo de entradas, saídas e resultado acumulado</p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start sm:self-auto">
          {[6, 12, 24].map(m => (
            <button
              key={m}
              onClick={() => setRangeMonths(m)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-colors ${
                rangeMonths === m
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {m} Meses
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tickLine={false} tickFormatter={formatBRL} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              formatter={(val: unknown) => [formatBRL(Number(val) || 0)]}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="Entradas" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Saídas" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
