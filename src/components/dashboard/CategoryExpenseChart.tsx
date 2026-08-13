'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DynamicIcon } from '@/components/ui/Icon';

export const CategoryExpenseChart: React.FC = () => {
  const { transactions, categories, selectedYear, selectedMonth } = useFinance();

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthExpenses = transactions.filter(
    t => t.type === 'expense' && t.status === 'completed' && t.date && t.date.startsWith(monthStr)
  );

  const categoryTotals: Record<string, number> = {};
  let totalExpenseMonth = 0;

  monthExpenses.forEach(t => {
    const catId = t.category_id || 'outros';
    const amt = Number(t.amount) || 0;
    categoryTotals[catId] = (categoryTotals[catId] || 0) + amt;
    totalExpenseMonth += amt;
  });

  const chartData = Object.keys(categoryTotals).map(catId => {
    const category = categories.find(c => c.id === catId);
    const amount = categoryTotals[catId];
    const percentage = totalExpenseMonth > 0 ? ((amount / totalExpenseMonth) * 100).toFixed(1) : '0';

    return {
      id: catId,
      name: category ? category.name : 'Sem categoria',
      color: category ? category.color : '#94a3b8',
      icon: category ? category.icon : 'Tag',
      value: amount,
      percentage: `${percentage}%`
    };
  }).sort((a, b) => b.value - a.value);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Gastos por Categoria</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Distribuição de saídas no mês selecionado</p>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm italic">
          Nenhuma despesa realizada neste mês.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Pie Chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: unknown) => [formatBRL(Number(val) || 0)]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Category List */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {chartData.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    <DynamicIcon name={item.icon} size={14} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {formatBRL(item.value)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.percentage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
