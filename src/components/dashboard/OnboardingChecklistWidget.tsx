'use client';

import React from 'react';
import Link from 'next/link';
import { useFinance } from '@/context/FinanceContext';
import { CheckCircle2, Circle, X, ListChecks, ArrowRight } from 'lucide-react';

export const OnboardingChecklistWidget: React.FC = () => {
  const { 
    user, accounts, creditCards, transactions, budgets, 
    assets, liabilities, hideOnboardingChecklist 
  } = useFinance();

  if (!user || user.show_onboarding_checklist === false) {
    return null;
  }

  const items = [
    { label: 'Criou sua conta', completed: true },
    { label: 'Adicionou uma conta bancária/dinheiro', completed: accounts.length > 0, href: '/dashboard/contas' },
    { label: 'Adicionou um cartão de crédito', completed: creditCards.length > 0, href: '/dashboard/cartoes' },
    { label: 'Registrou o primeiro lançamento', completed: transactions.length > 0, href: '/dashboard/lancamentos' },
    { label: 'Definiu o primeiro orçamento', completed: budgets.length > 0, href: '/dashboard/planejamento' },
    { label: 'Configurou seu patrimônio (bens/dívidas)', completed: (assets.length > 0 || liabilities.length > 0), href: '/dashboard/patrimonio' }
  ];

  const completedCount = items.filter(i => i.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  // If 100% completed, hide widget automatically
  if (percentage === 100) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-indigo-600/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-indigo-950/40 border border-emerald-500/20 dark:border-emerald-800/40 p-5 rounded-3xl space-y-4 shadow-sm relative">
      <button
        onClick={hideOnboardingChecklist}
        className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Ocultar checklist de configuração"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-emerald-600/20">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Seu financeiro está {percentage}% configurado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conclua os passos recomendados para aproveitar o sistema ao máximo
            </p>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="w-full sm:w-36 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {items.map((item, idx) => (
          <div 
            key={idx}
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
              item.completed 
                ? 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-500 line-through opacity-80' 
                : 'bg-white dark:bg-slate-900 border-emerald-500/30 text-slate-900 dark:text-white shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
              <span className="truncate">{item.label}</span>
            </div>

            {!item.completed && item.href && (
              <Link 
                href={item.href}
                className="p-1 text-emerald-600 dark:text-emerald-400 hover:translate-x-0.5 transition-transform"
                title="Configurar agora"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
