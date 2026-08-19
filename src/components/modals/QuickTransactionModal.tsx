'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, TransactionType, TransactionStatus } from '@/types/finance';
import { autoCategorizeDescription } from '@/lib/calculations';
import { capitalizeFirstLetter } from '@/lib/stringUtils';
import { DynamicIcon } from '@/components/ui/Icon';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Check, CreditCard, Tag, Edit3 } from 'lucide-react';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  transactionToEdit?: Transaction | null;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  transactionToEdit = null
}) => {
  const { accounts, creditCards, categories, addTransaction, updateTransaction, addCreditCardPurchase } = useFinance();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'credit_card'>('bank');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [installments, setInstallments] = useState(1);
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [isSuggested, setIsSuggested] = useState(false);

  // Sync state when editing or opening
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setType(transactionToEdit.type || 'expense');
        setDescription(transactionToEdit.description || '');
        setAmount(String(transactionToEdit.amount || ''));
        setCategoryId(transactionToEdit.category_id || '');
        setAccountId(transactionToEdit.account_id || (accounts[0]?.id || ''));
        setDestinationAccountId(transactionToEdit.destination_account_id || '');
        setDate(transactionToEdit.date || new Date().toISOString().split('T')[0]);
        setStatus(transactionToEdit.status || 'completed');
        setPaymentMethod('bank');
        setInstallments(1);
        setIsSuggested(false);
      } else {
        setType(defaultType);
        setDescription('');
        setAmount('');
        setCategoryId('');
        setPaymentMethod('bank');
        setAccountId(accounts[0]?.id || '');
        setCreditCardId(creditCards[0]?.id || '');
        setDestinationAccountId('');
        setInstallments(1);
        setStatus('completed');
        setIsSuggested(false);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);
      }
    }
  }, [isOpen, transactionToEdit, defaultType, accounts, creditCards]);

  // Real-time automatic category suggestion (only in creation mode)
  useEffect(() => {
    if (!transactionToEdit && description.length >= 3 && type !== 'transfer') {
      const suggestedCatId = autoCategorizeDescription(description, categories);
      if (suggestedCatId && !categoryId) {
        setCategoryId(suggestedCatId);
        setIsSuggested(true);
      }
    }
  }, [description, categories, type, transactionToEdit, categoryId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!description.trim()) return;

    const formattedDescription = capitalizeFirstLetter(description);

    if (transactionToEdit) {
      // Edit existing transaction
      updateTransaction(transactionToEdit.id, {
        type,
        description: formattedDescription,
        amount: numAmount,
        category_id: type !== 'transfer' ? categoryId : undefined,
        account_id: accountId,
        destination_account_id: type === 'transfer' ? destinationAccountId : undefined,
        date,
        status
      });
    } else {
      // Create new transaction or credit card purchase
      if (type === 'expense' && paymentMethod === 'credit_card') {
        if (!creditCardId) return;
        addCreditCardPurchase(
          creditCardId,
          formattedDescription,
          numAmount,
          installments,
          date,
          categoryId || undefined
        );
      } else {
        if (!accountId) return;
        addTransaction({
          account_id: accountId,
          destination_account_id: type === 'transfer' ? destinationAccountId : undefined,
          category_id: type !== 'transfer' ? categoryId : undefined,
          description: formattedDescription,
          amount: numAmount,
          date,
          type,
          status,
          payment_method: 'pix'
        });
      }
    }

    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));
  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
  const installmentVal = installments > 0 ? (parsedAmount / installments) : 0;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isEditing = !!transactionToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {isEditing && <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Editar Lançamento' : 'Nova Transação'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Type Selector Pills */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => { setType('expense'); setIsSuggested(false); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" /> Despesa
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setPaymentMethod('bank'); setIsSuggested(false); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Receita
            </button>
            <button
              type="button"
              onClick={() => { setType('transfer'); setPaymentMethod('bank'); setIsSuggested(false); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                type === 'transfer'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" /> Transferência
            </button>
          </div>

          {/* Payment Mode Selector for Expenses (Bank Account vs Credit Card) - only for new purchases */}
          {!isEditing && type === 'expense' && creditCards.length > 0 && (
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-all cursor-pointer ${
                  paymentMethod === 'bank'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Conta Bancária / Pix
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`flex-1 py-1.5 rounded-lg text-center font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'credit_card'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Cartão de Crédito
              </button>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valor Total (R$)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                autoFocus={!isEditing}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xl focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Description input with Auto-Capitalization */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Supermercado, Aluguel, Salário..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={() => setDescription(prev => capitalizeFirstLetter(prev))}
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
            />
          </div>

          {/* Category selection (if not transfer) */}
          {type !== 'transfer' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Categoria</label>
                {isSuggested && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Tag className="w-3 h-3" /> Categoria auto-selecionada
                  </span>
                )}
              </div>
              <select
                value={categoryId}
                onChange={e => { setCategoryId(e.target.value); setIsSuggested(false); }}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
              >
                <option value="">Selecione uma categoria...</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Credit Card Specific Inputs (If expense & credit_card selected) */}
          {!isEditing && type === 'expense' && paymentMethod === 'credit_card' ? (
            <div className="space-y-3 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cartão de Crédito</label>
                  <select
                    value={creditCardId}
                    onChange={e => setCreditCardId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold cursor-pointer"
                  >
                    {creditCards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.name} (•••• {card.last_four_digits})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Parcelamento</label>
                  <select
                    value={installments}
                    onChange={e => setInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold cursor-pointer"
                  >
                    <option value={1}>À vista (1x)</option>
                    {[2,3,4,5,6,7,8,9,10,11,12,18,24].map(n => (
                      <option key={n} value={n}>{n}x parcelado</option>
                    ))}
                  </select>
                </div>
              </div>

              {installments > 1 && parsedAmount > 0 && (
                <div className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl flex items-center justify-between">
                  <span>Valor por parcela:</span>
                  <span className="font-bold">{installments}x de {formatBRL(installmentVal)}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data da Compra</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          ) : (
            /* Accounts selection (Standard Bank Account flow) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {type === 'transfer' ? 'Conta de Origem' : 'Conta'}
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (R$ {acc.current_balance?.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {type === 'transfer' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Conta de Destino</label>
                  <select
                    value={destinationAccountId}
                    onChange={e => setDestinationAccountId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                  >
                    <option value="">Selecione o destino...</option>
                    {accounts.filter(a => a.id !== accountId).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (R$ {acc.current_balance?.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Status selector (Previsto vs Realizado) - shown for standard bank transactions */}
          {(isEditing || paymentMethod === 'bank') && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status da Transação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> Realizado (Já pago)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('planned')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    status === 'planned'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Previsto (A vencer)
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {isEditing ? 'Salvar Alterações' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
