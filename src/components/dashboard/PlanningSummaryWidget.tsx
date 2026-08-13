'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Target, Sparkles, Calendar } from 'lucide-react';

export const PlanningSummaryWidget: React.FC = () => {
  const { summary } = useFinance();

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
      {/* Subtle decorative glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold tracking-wide">Planejamento & Teto Diário Sugerido</h3>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" /> Indicador Inteligente
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <span className="text-xs text-slate-400 font-medium block mb-1">Limite Médio Diário Sugerido</span>
          <p className="text-3xl font-black text-emerald-400 tracking-tight">
            {formatBRL(summary.dailySuggestedLimit)}
            <span className="text-xs text-slate-400 font-normal ml-1">/ dia</span>
          </p>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium block mb-1">Dias Restantes no Mês</span>
          <p className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            {summary.remainingDaysInMonth} dias
          </p>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium block mb-1">Saldo Projetado Final</span>
          <p className="text-2xl font-bold text-blue-400">
            {formatBRL(summary.projectedBalance)}
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed">
        Com base no seu saldo disponível de <strong>{formatBRL(summary.availableBalance)}</strong> e nos lançamentos previstos do mês, você pode gastar em média <strong>{formatBRL(summary.dailySuggestedLimit)} por dia</strong> nos próximos <strong>{summary.remainingDaysInMonth} dias</strong> sem comprometer o restante do seu mês.
      </div>
    </div>
  );
};
