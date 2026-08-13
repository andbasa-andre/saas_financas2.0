'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AccountType } from '@/types/finance';
import { DynamicIcon } from '@/components/ui/Icon';
import { CreditCard as CardIcon, Landmark, Plus, Trash2, ShieldCheck, Wallet } from 'lucide-react';

export default function AccountsPage() {
  const { accounts, creditCards, addAccount, deleteAccount } = useFinance();

  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('checking');
  const [initialBal, setInitialBal] = useState('');
  const [institution, setInstitution] = useState('');

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(initialBal.replace(',', '.')) || 0;
    if (!accName.trim()) return;

    addAccount({
      name: accName.trim(),
      type: accType,
      initial_balance: bal,
      color: accType === 'checking' ? '#0284c7' : accType === 'savings' ? '#10b981' : '#6366f1',
      icon: accType === 'checking' ? 'Landmark' : accType === 'savings' ? 'PiggyBank' : 'TrendingUp',
      is_active: true,
      financial_institution: institution || undefined
    });

    setAccName('');
    setInitialBal('');
    setInstitution('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Contas & Cartões de Crédito</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie suas contas bancárias e limites de cartão</p>
      </div>

      {/* Accounts List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Contas Financeiras
          </span>
        </h3>

        <form onSubmit={handleAddAccount} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Nome da Conta (ex: Itaú, Nubank)"
            value={accName}
            onChange={e => setAccName(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            required
          />
          <select
            value={accType}
            onChange={e => setAccType(e.target.value as AccountType)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="checking">Conta Corrente</option>
            <option value="savings">Poupança</option>
            <option value="investment">Investimento</option>
            <option value="cash">Dinheiro / Carteira</option>
          </select>
          <input
            type="number"
            placeholder="Saldo Inicial R$"
            value={initialBal}
            onChange={e => setInitialBal(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <button type="submit" className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> Adicionar Conta
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {accounts.map(acc => (
            <div key={acc.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: acc.color }}>
                    <DynamicIcon name={acc.icon} size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{acc.name}</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{acc.type}</span>
                  </div>
                </div>
                <button onClick={() => deleteAccount(acc.id)} className="text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-500">Saldo Atual:</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {formatBRL(acc.current_balance || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Cards Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CardIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Cartões de Crédito
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creditCards.map(card => (
            <div
              key={card.id}
              className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-300 font-medium block">{card.brand}</span>
                  <h4 className="text-lg font-bold">{card.name}</h4>
                </div>
                <CardIcon className="w-8 h-8 text-indigo-400 opacity-80" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="text-slate-400 block">Limite Total</span>
                  <span className="font-bold text-sm">{formatBRL(card.limit_amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fechamento / Vencimento</span>
                  <span className="font-bold text-sm">Dia {card.closing_day} / Dia {card.due_day}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
