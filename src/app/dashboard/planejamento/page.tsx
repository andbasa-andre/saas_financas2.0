'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { MonthlySelector } from '@/components/layout/MonthlySelector';
import { PlanningSummaryWidget } from '@/components/dashboard/PlanningSummaryWidget';
import { DynamicIcon } from '@/components/ui/Icon';
import { AlertTriangle, CheckCircle2, Target, Plus, AlertCircle } from 'lucide-react';

export default function PlanningPage() {
  const { 
    categories, transactions, budgets, selectedYear, selectedMonth, setBudgetAmount 
  } = useFinance();

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newBudgetVal, setNewBudgetVal] = useState<string>('');

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Compute spent per category for selected month
  const categorySpent: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'expense' && t.status === 'completed' && t.date && t.date.startsWith(monthStr) && t.category_id) {
      categorySpent[t.category_id] = (categorySpent[t.category_id] || 0) + Number(t.amount);
    }
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSaveBudget = (catId: string) => {
    const val = parseFloat(newBudgetVal.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      setBudgetAmount(catId, val);
    }
    setEditingCatId(null);
    setNewBudgetVal('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Planejamento & Orçamento</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Defina teto de gastos por categoria e acompanhe seus limites</p>
      </div>

      <MonthlySelector />

      {/* Daily Suggested Limit Banner */}
      <PlanningSummaryWidget />

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Orçamento Mensal por Categoria
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map(cat => {
            const budgetObj = budgets.find(b => b.category_id === cat.id && b.month === selectedMonth && b.year === selectedYear);
            const budgetLimit = budgetObj ? budgetObj.amount : 0;
            const spent = categorySpent[cat.id] || 0;
            const percentage = budgetLimit > 0 ? Math.min(100, Math.round((spent / budgetLimit) * 100)) : 0;

            const is80 = percentage >= 80 && percentage < 100;
            const isOver = spent > budgetLimit && budgetLimit > 0;

            return (
              <div
                key={cat.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
                  isOver
                    ? 'border-rose-300 dark:border-rose-900/60 shadow-xs'
                    : is80
                    ? 'border-amber-300 dark:border-amber-900/60 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Gasto: <strong>{formatBRL(spent)}</strong> de {budgetLimit > 0 ? formatBRL(budgetLimit) : 'Sem teto'}
                      </p>
                    </div>
                  </div>

                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="R$"
                        value={newBudgetVal}
                        onChange={e => setNewBudgetVal(e.target.value)}
                        className="w-24 px-2 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveBudget(cat.id)}
                        className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-600 text-white"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingCatId(cat.id); setNewBudgetVal(budgetLimit > 0 ? String(budgetLimit) : ''); }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {budgetLimit > 0 ? 'Editar Teto' : '+ Definir Teto'}
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {budgetLimit > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-rose-500'
                            : is80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (spent / budgetLimit) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">{percentage}% utilizado</span>

                      {isOver && (
                        <span className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-3 h-3" /> Ultrapassado em {formatBRL(spent - budgetLimit)}
                        </span>
                      )}

                      {is80 && !isOver && (
                        <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" /> 80% do limite atingido
                        </span>
                      )}

                      {!is80 && !isOver && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Restam {formatBRL(budgetLimit - spent)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
