'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { MonthlySelector } from '@/components/layout/MonthlySelector';
import { DynamicIcon } from '@/components/ui/Icon';
import { 
  Search, Filter, Plus, CheckCircle2, Clock, 
  Trash2, Copy, Edit3, ArrowDownRight, ArrowUpRight, ArrowLeftRight 
} from 'lucide-react';
import { QuickTransactionModal } from '@/components/modals/QuickTransactionModal';

export default function TransactionsPage() {
  const { 
    transactions, categories, accounts, selectedYear, selectedMonth, 
    updateTransaction, deleteTransaction, addTransaction 
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const filteredTransactions = transactions.filter(t => {
    if (!t.date || !t.date.startsWith(monthStr)) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'all' && t.category_id !== filterCategory) return false;
    if (filterAccount !== 'all' && t.account_id !== filterAccount && t.destination_account_id !== filterAccount) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(term);
      const catName = categories.find(c => c.id === t.category_id)?.name.toLowerCase() || '';
      return matchDesc || catName.includes(term);
    }
    return true;
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleDuplicate = (tx: typeof transactions[0]) => {
    addTransaction({
      account_id: tx.account_id,
      destination_account_id: tx.destination_account_id,
      category_id: tx.category_id,
      description: `${tx.description} (Cópia)`,
      amount: tx.amount,
      date: tx.date,
      type: tx.type,
      status: tx.status,
      payment_method: tx.payment_method,
      notes: tx.notes
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Extrato de Lançamentos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie todas as suas entradas, saídas e transferências</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nova Transação
        </button>
      </div>

      <MonthlySelector />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-hidden"
            >
              <option value="all">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
              <option value="transfer">Transferências</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-hidden"
            >
              <option value="all">Todos os status</option>
              <option value="completed">Realizados</option>
              <option value="planned">Previstos</option>
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-hidden"
            >
              <option value="all">Todas categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm italic">
            Nenhum lançamento encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Lançamento</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Conta</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredTransactions.map(tx => {
                  const category = categories.find(c => c.id === tx.category_id);
                  const account = accounts.find(a => a.id === tx.account_id);
                  const destAccount = accounts.find(a => a.id === tx.destination_account_id);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: category?.color || '#64748b' }}
                          >
                            {tx.type === 'transfer' ? (
                              <ArrowLeftRight className="w-4 h-4" />
                            ) : (
                              <DynamicIcon name={category?.icon || 'Tag'} size={16} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {tx.description}
                            </p>
                            {tx.type === 'transfer' && (
                              <span className="text-[11px] text-slate-400">
                                {account?.name} → {destAccount?.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {category ? category.name : 'Transferência'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {account?.name || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {tx.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => updateTransaction(tx.id, {
                            status: tx.status === 'completed' ? 'planned' : 'completed'
                          })}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                            tx.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {tx.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {tx.status === 'completed' ? 'Realizado' : 'Previsto'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-black text-sm ${
                          tx.type === 'income'
                            ? 'text-teal-600 dark:text-teal-400'
                            : tx.type === 'expense'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} {formatBRL(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDuplicate(tx)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Duplicar Lançamento"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QuickTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
