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
import { getInvoicePeriodForPurchase, determineInvoiceStatus } from '@/lib/creditCardEngine';
import { ArrowRight, CheckCircle2, Clock, CreditCard as CardIcon } from 'lucide-react';

export default function DashboardPage() {
  const { 
    transactions, categories, accounts, creditCards, cardPurchases, cardPayments,
    selectedYear, selectedMonth, updateTransaction 
  } = useFinance();

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const recentTransactions = transactions
    .filter(t => t.date && t.date.startsWith(monthStr))
    .slice(0, 5);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateBR = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Top Controls: Monthly Selector */}
      <MonthlySelector />

      {/* Main 8 Key Indicators */}
      <SummaryCards />

      {/* Planning & Daily Suggested Limit Banner */}
      <PlanningSummaryWidget />

      {/* Credit Cards Current Invoice Summary Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm space-y-4 max-w-full overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CardIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              Fatura Atual dos Cartões ({selectedMonth}/{selectedYear})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Resumo de faturas, vencimentos e limites</p>
          </div>
          <Link
            href="/dashboard/cartoes"
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
          >
            Ver cartões <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditCards.map(card => {
            const cardPurchasesList = cardPurchases.filter(p => p.credit_card_id === card.id);
            const currentInvoicePurchases = cardPurchasesList.filter(p => {
              const invPeriod = getInvoicePeriodForPurchase(p.purchase_date, card.closing_day, card.due_day);
              return invPeriod.month === selectedMonth && invPeriod.year === selectedYear;
            });

            const invoiceTotal = currentInvoicePurchases.reduce((acc, p) => acc + (Number(p.installment_amount) || 0), 0);
            
            const invoicePayments = cardPayments.filter(pay => {
              return pay.invoice_id === `inv-${card.id}-${selectedYear}-${selectedMonth}`;
            });
            const paidAmount = invoicePayments.reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);

            const invPeriod = getInvoicePeriodForPurchase(
              `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`, 
              card.closing_day, 
              card.due_day
            );

            const status = determineInvoiceStatus(invoiceTotal, paidAmount, invPeriod.dueDate);

            return (
              <div key={card.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3 max-w-full">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{card.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">•••• {card.last_four_digits}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : status === 'partially_paid'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : status === 'overdue'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {status === 'paid' ? 'Paga' : status === 'partially_paid' ? 'Parcial' : status === 'overdue' ? 'Vencida' : 'Aberta'}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium block mb-0.5">Fatura Atual ({selectedMonth}/{selectedYear})</span>
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white block">{formatBRL(invoiceTotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Fechamento:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{formatDateBR(invPeriod.closingDate)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Vencimento:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{formatDateBR(invPeriod.dueDate)}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between text-[11px]">
                  <span>Limite Disponível:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{formatBRL(card.available_limit || 0)}</strong>
                </div>
              </div>
            );
          })}
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm space-y-4 max-w-full overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Últimos Lançamentos do Mês</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Atividades recentes da sua conta</p>
          </div>
          <Link
            href="/dashboard/lancamentos"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
          >
            Extrato completo <ArrowRight className="w-3.5 h-3.5" />
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
                <div key={tx.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: category?.color || '#64748b' }}
                    >
                      <DynamicIcon name={category?.icon || 'Tag'} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{formatDateBR(tx.date)}</span>
                        <span>•</span>
                        <span className="truncate max-w-[110px]">{account?.name || 'Conta'}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center gap-1 font-medium shrink-0 ${
                          tx.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {tx.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {tx.status === 'completed' ? 'Realizado' : 'Previsto'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100/80 dark:border-slate-800/60">
                    <span className={`text-xs sm:text-sm font-extrabold ${
                      tx.type === 'income'
                        ? 'text-teal-600 dark:text-teal-400'
                        : tx.type === 'expense'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} {formatBRL(tx.amount)}
                    </span>

                    {tx.status === 'planned' && (
                      <button
                        onClick={() => updateTransaction(tx.id, { status: 'completed' })}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
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
