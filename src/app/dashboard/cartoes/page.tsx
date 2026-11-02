'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { MonthlySelector } from '@/components/layout/MonthlySelector';
import { DynamicIcon } from '@/components/ui/Icon';
import { getInvoicePeriodForPurchase, determineInvoiceStatus } from '@/lib/creditCardEngine';
import { 
  CreditCard as CardIcon, Plus, Trash2, Calendar, CheckCircle2, 
  AlertCircle, DollarSign, ArrowRight, ShieldCheck, PieChart, Layers 
} from 'lucide-react';

export default function CreditCardsPage() {
  const { 
    creditCards, cardPurchases, cardPayments, accounts, categories, 
    selectedYear, selectedMonth, addCreditCard, deleteCreditCard, addCreditCardPurchase, payInvoice 
  } = useFinance();

  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards[0]?.id || '');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isPayInvoiceOpen, setIsPayInvoiceOpen] = useState(false);

  // Add Card Form State
  const [cardName, setCardName] = useState('');
  const [cardIssuer, setCardIssuer] = useState('');
  const [last4, setLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('Mastercard Black');
  const [cardLimit, setCardLimit] = useState('');
  const [closingDay, setClosingDay] = useState(5);
  const [dueDay, setDueDay] = useState(12);

  // Add Purchase Form State
  const [purDesc, setPurDesc] = useState('');
  const [purAmount, setPurAmount] = useState('');
  const [purInstallments, setPurInstallments] = useState(1);
  const [purDate, setPurDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purCategory, setPurCategory] = useState('');

  // Pay Invoice Form State
  const [payAccount, setPayAccount] = useState(accounts[0]?.id || '');
  const [payAmountInput, setPayAmountInput] = useState('');

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateBR = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  const activeCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0];

  // Purchases for the selected card
  const cardPurchasesList = activeCard 
    ? cardPurchases.filter(p => p.credit_card_id === activeCard.id) 
    : [];

  // Filter purchases that fall into the selected month/year invoice according to closing day
  const currentInvoicePurchases = cardPurchasesList.filter(p => {
    if (!activeCard) return false;
    const invPeriod = getInvoicePeriodForPurchase(p.purchase_date, activeCard.closing_day, activeCard.due_day);
    return invPeriod.month === selectedMonth && invPeriod.year === selectedYear;
  });

  const invoiceTotalAmount = currentInvoicePurchases.reduce((acc, p) => acc + (Number(p.installment_amount) || 0), 0);

  // Payments for this invoice
  const invoicePayments = activeCard ? cardPayments.filter(pay => {
    return pay.invoice_id === `inv-${activeCard.id}-${selectedYear}-${selectedMonth}`;
  }) : [];

  const invoicePaidAmount = invoicePayments.reduce((acc, pay) => acc + (Number(pay.amount) || 0), 0);
  const invoiceRemainingAmount = Math.max(0, Math.round((invoiceTotalAmount - invoicePaidAmount) * 100) / 100);

  const invPeriod = activeCard 
    ? getInvoicePeriodForPurchase(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`, activeCard.closing_day, activeCard.due_day)
    : { closingDate: '', dueDate: '' };

  const invoiceStatus = determineInvoiceStatus(invoiceTotalAmount, invoicePaidAmount, invPeriod.dueDate);

  // Next invoices projection (next 4 months)
  const nextInvoicesProjection = [];
  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 1; i <= 4; i++) {
    const nextDate = new Date(selectedYear, selectedMonth - 1 + i, 1);
    const m = nextDate.getMonth() + 1;
    const y = nextDate.getFullYear();

    const monthPurchases = cardPurchasesList.filter(p => {
      if (!activeCard) return false;
      const period = getInvoicePeriodForPurchase(p.purchase_date, activeCard.closing_day, activeCard.due_day);
      return period.month === m && period.year === y;
    });

    const total = monthPurchases.reduce((acc, p) => acc + (Number(p.installment_amount) || 0), 0);
    nextInvoicesProjection.push({
      monthLabel: `${MONTH_NAMES[m - 1]}/${String(y).slice(-2)}`,
      total
    });
  }

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const lim = parseFloat(cardLimit.replace(',', '.'));
    if (!cardName.trim() || isNaN(lim) || lim <= 0) return;

    await addCreditCard({
      name: cardName.trim(),
      issuer: cardIssuer.trim() || 'Banco',
      last_four_digits: last4.trim() || '0000',
      brand: cardBrand,
      limit_amount: lim,
      closing_day: Number(closingDay),
      due_day: Number(dueDay),
      color: '#8b5cf6',
      is_active: true
    });

    setCardName('');
    setCardLimit('');
    setLast4('');
    setIsAddCardOpen(false);
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    const amt = parseFloat(purAmount.replace(',', '.'));
    if (!purDesc.trim() || isNaN(amt) || amt <= 0) return;

    await addCreditCardPurchase(
      activeCard.id,
      purDesc.trim(),
      amt,
      Number(purInstallments),
      purDate,
      purCategory || undefined
    );

    setPurDesc('');
    setPurAmount('');
    setPurInstallments(1);
    setIsAddPurchaseOpen(false);
  };

  const handlePayInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard || !payAccount) return;
    const val = parseFloat(payAmountInput.replace(',', '.')) || invoiceRemainingAmount;
    if (val <= 0) return;

    await payInvoice(
      activeCard.id,
      selectedMonth,
      selectedYear,
      payAccount,
      val,
      new Date().toISOString().split('T')[0]
    );

    setIsPayInvoiceOpen(false);
    setPayAmountInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Cartões de Crédito & Faturas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gestão completa de limites, compras parceladas e faturas</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddCardOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Cartão
          </button>
          <button
            onClick={() => setIsAddPurchaseOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Nova Compra no Cartão
          </button>
        </div>
      </div>

      <MonthlySelector />

      {/* Cards Slider / Cards Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creditCards.map(card => {
          const isSelected = activeCard?.id === card.id;

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`p-6 rounded-3xl cursor-pointer transition-all duration-200 relative overflow-hidden shadow-lg ${
                isSelected
                  ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white ring-2 ring-emerald-500 scale-[1.01]'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-medium opacity-70 block">{card.brand} •••• {card.last_four_digits}</span>
                  <h3 className="text-lg font-extrabold">{card.name}</h3>
                </div>
                <CardIcon className={`w-7 h-7 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
              </div>

              {/* Progress limit bar */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Limite Comprometido: {formatBRL(card.committed_limit || 0)}</span>
                  <span>{formatBRL(card.limit_amount)}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((card.committed_limit || 0) / card.limit_amount) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] opacity-80 pt-1">
                  <span>Disponível: <strong className="text-emerald-400">{formatBRL(card.available_limit || 0)}</strong></span>
                  <span>Fechamento: Dia {card.closing_day}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Card Invoice Dashboard */}
      {activeCard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Card (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Fatura de {selectedMonth}/{selectedYear}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      invoiceStatus === 'paid'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : invoiceStatus === 'partially_paid'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : invoiceStatus === 'overdue'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    }`}>
                      {invoiceStatus === 'paid' ? 'Paga' : invoiceStatus === 'partially_paid' ? 'Parcialmente Paga' : invoiceStatus === 'overdue' ? 'Vencida' : 'Aberta'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Fechamento em <strong>{formatDateBR(invPeriod.closingDate)}</strong> • Vencimento em <strong>{formatDateBR(invPeriod.dueDate)}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Total da Fatura</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{formatBRL(invoiceTotalAmount)}</span>
                  </div>

                  {invoiceRemainingAmount > 0 && (
                    <button
                      onClick={() => { setPayAmountInput(String(invoiceRemainingAmount)); setIsPayInvoiceOpen(true); }}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      Pagar Fatura
                    </button>
                  )}
                </div>
              </div>

              {/* Purchase Item List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compras nesta Fatura</h4>

                {currentInvoicePurchases.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    Nenhuma compra registrada nesta fatura.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentInvoicePurchases.map(pur => {
                      const category = categories.find(c => c.id === pur.category_id);

                      return (
                        <div key={pur.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                              style={{ backgroundColor: category?.color || '#64748b' }}
                            >
                              <DynamicIcon name={category?.icon || 'Tag'} size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {pur.description}
                              </p>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatDateBR(pur.purchase_date)} • {category?.name || 'Geral'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                              {formatBRL(pur.installment_amount)}
                            </span>
                            {pur.total_installments > 1 && (
                              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg">
                                {pur.installment_number}/{pur.total_installments} parcelas
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Next Invoices Projections */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Próximas Faturas Projetadas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compromissos futuros já lançados para o cartão {activeCard.name}
              </p>

              <div className="space-y-3 pt-2">
                {nextInvoicesProjection.map((inv, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{inv.monthLabel}</span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatBRL(inv.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Credit Card */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Novo Cartão de Crédito</h3>

            <form onSubmit={handleCreateCard} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank Violeta, Itaú Black"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Bandeira / Modelo</label>
                  <input
                    type="text"
                    placeholder="Mastercard, Visa..."
                    value={cardBrand}
                    onChange={e => setCardBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={last4}
                    onChange={e => setLast4(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Limite Total (R$)</label>
                <input
                  type="number"
                  placeholder="8000.00"
                  value={cardLimit}
                  onChange={e => setCardLimit(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Dia Fechamento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={closingDay}
                    onChange={e => setClosingDay(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={e => setDueDay(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Purchase */}
      {isAddPurchaseOpen && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nova Compra em {activeCard.name}</h3>

            <form onSubmit={handleCreatePurchase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Descrição da Compra</label>
                <input
                  type="text"
                  placeholder="Ex: Notebook Dell, Supermercado"
                  value={purDesc}
                  onChange={e => setPurDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="3600.00"
                    value={purAmount}
                    onChange={e => setPurAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Parcelamento</label>
                  <select
                    value={purInstallments}
                    onChange={e => setPurInstallments(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value={1}>À vista (1x)</option>
                    {[2,3,4,5,6,7,8,9,10,11,12,18,24].map(n => (
                      <option key={n} value={n}>{n}x parcelado</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Data da Compra</label>
                  <input
                    type="date"
                    value={purDate}
                    onChange={e => setPurDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Categoria</label>
                  <select
                    value={purCategory}
                    onChange={e => setPurCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {categories.filter(c => c.type === 'expense').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Registrar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pay Invoice */}
      {isPayInvoiceOpen && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pagar Fatura ({selectedMonth}/{selectedYear})</h3>

            <form onSubmit={handlePayInvoiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Conta Bancária de Pagamento</label>
                <select
                  value={payAccount}
                  onChange={e => setPayAccount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: {formatBRL(acc.current_balance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Valor do Pagamento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmountInput}
                  onChange={e => setPayAmountInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-lg"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayInvoiceOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
