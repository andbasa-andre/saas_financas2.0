'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { 
  Wallet, CheckCircle2, ArrowRight, ArrowLeft, Plus, 
  Landmark, CreditCard, Tag, PiggyBank, Receipt, ShieldCheck, X 
} from 'lucide-react';
import { DynamicIcon } from '@/components/ui/Icon';

export default function OnboardingPage() {
  const router = useRouter();
  const { 
    user, isLoading, categories, accounts, creditCards, addAccount, addCreditCard, 
    addTransaction, addAsset, addLiability, updateOnboardingStep, completeOnboarding 
  } = useFinance();

  const [step, setStep] = useState<number>(user?.onboarding_step || 1);

  // Proteção de rota do Onboarding
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.onboarding_completed === true) {
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Sync step changes with profile state
  const changeStep = (newStep: number) => {
    setStep(newStep);
    updateOnboardingStep(newStep);
  };

  // Step 2: Financial Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>(user?.financial_goals || []);
  const goalsOptions = [
    'Controlar meus gastos',
    'Organizar minhas contas',
    'Economizar mais',
    'Acompanhar minhas dívidas',
    'Acompanhar meu patrimônio',
    'Tudo isso'
  ];

  const toggleGoal = (goal: string) => {
    if (goal === 'Tudo isso') {
      if (selectedGoals.length === goalsOptions.length - 1) {
        setSelectedGoals([]);
      } else {
        setSelectedGoals(goalsOptions.filter(g => g !== 'Tudo isso'));
      }
      return;
    }
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  // Step 3: Accounts quick form
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'checking' | 'savings' | 'cash' | 'investment'>('checking');
  const [accBalance, setAccBalance] = useState('');
  const [addedAccountsCount, setAddedAccountsCount] = useState(0);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    const val = parseFloat(accBalance.replace(',', '.')) || 0;

    const colors: Record<string, string> = {
      checking: '#3b82f6',
      savings: '#10b981',
      cash: '#84cc16',
      investment: '#8b5cf6'
    };

    addAccount({
      name: accName.trim(),
      type: accType,
      initial_balance: val,
      color: colors[accType] || '#3b82f6',
      icon: 'Landmark',
      is_active: true
    });

    setAccName('');
    setAccBalance('');
    setAddedAccountsCount(prev => prev + 1);
  };

  // Step 4: Credit Cards
  const [usesCreditCard, setUsesCreditCard] = useState<boolean | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardDigits, setCardDigits] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [closingDay, setClosingDay] = useState('5');
  const [dueDay, setDueDay] = useState('12');
  const [cardBrand, setCardBrand] = useState('Mastercard');
  const [addedCardsCount, setAddedCardsCount] = useState(0);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    const lim = parseFloat(cardLimit.replace(',', '.')) || 1000;

    await addCreditCard({
      name: cardName.trim(),
      issuer: cardBrand,
      last_four_digits: cardDigits || '1234',
      brand: cardBrand,
      limit_amount: lim,
      closing_day: parseInt(closingDay) || 5,
      due_day: parseInt(dueDay) || 12,
      color: '#8b5cf6',
      is_active: true
    });

    setCardName('');
    setCardLimit('');
    setCardDigits('');
    setAddedCardsCount(prev => prev + 1);
  };

  // Step 6: Assets & Liabilities
  const [wantsPatrimony, setWantsPatrimony] = useState<boolean | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetVal, setAssetVal] = useState('');
  const [assetType, setAssetType] = useState<'vehicle' | 'real_estate' | 'investment' | 'other'>('vehicle');
  const [liabName, setLiabName] = useState('');
  const [liabVal, setLiabVal] = useState('');

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    addAsset({
      name: assetName.trim(),
      type: assetType,
      current_value: parseFloat(assetVal.replace(',', '.')) || 0
    });
    setAssetName('');
    setAssetVal('');
  };

  const handleAddLiab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabName.trim()) return;
    addLiability({
      name: liabName.trim(),
      type: 'financing',
      current_value: parseFloat(liabVal.replace(',', '.')) || 0
    });
    setLiabName('');
    setLiabVal('');
  };

  // Step 7: First Transaction Form
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txAccount, setTxAccount] = useState('');
  const [txDoneMsg, setTxDoneMsg] = useState(false);

  const handleAddFirstTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc.trim() || !txAmount) return;
    const val = parseFloat(txAmount.replace(',', '.')) || 0;

    addTransaction({
      account_id: txAccount || accounts[0]?.id,
      category_id: txCategory || categories[0]?.id,
      description: txDesc.trim(),
      amount: val,
      date: new Date().toISOString().split('T')[0],
      type: txType,
      status: 'completed',
      payment_method: 'pix'
    });

    setTxDoneMsg(true);
    setTimeout(() => {
      changeStep(8);
    }, 1000);
  };

  const handleFinishOnboarding = () => {
    completeOnboarding();
    router.push('/dashboard');
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Header Stepper Indicator (Material 3 Style) */}
      <div className="max-w-xl mx-auto w-full space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <span>Configuração Inicial</span>
          </div>
          <span>Etapa {step} de 8</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Wizard Content Card */}
      <div className="max-w-xl mx-auto w-full my-auto py-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">

          {/* ETAPA 1 — BOAS-VINDAS */}
          {step === 1 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <Wallet className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Vamos organizar sua vida financeira.
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Em menos de 2 minutos, você configurará seu espaço para controlar seus gastos, contas, cartões e patrimônio com total clareza.
                </p>
              </div>

              <button
                onClick={() => changeStep(2)}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Começar <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ETAPA 2 — OBJETIVO FINANCEIRO */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  O que você quer acompanhar?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selecione os objetivos principais (você pode alterar depois)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goalsOptions.map(goal => {
                  const isSelected = goal === 'Tudo isso' 
                    ? selectedGoals.length === goalsOptions.length - 1
                    : selectedGoals.includes(goal);

                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs' 
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{goal}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => changeStep(3)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Pular por enquanto
                </button>

                <button
                  onClick={() => changeStep(3)}
                  className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3 — CONTAS FINANCEIRAS */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Onde seu dinheiro está hoje?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cadastre suas contas com o saldo inicial de hoje
                </p>
              </div>

              {/* Account Quick Form */}
              <form onSubmit={handleAddAccount} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Nome da Conta</label>
                    <input
                      type="text"
                      placeholder="Ex: Itaú, Nubank, Dinheiro"
                      value={accName}
                      onChange={e => setAccName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipo de Conta</label>
                    <select
                      value={accType}
                      onChange={e => setAccType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="checking">Conta Corrente</option>
                      <option value="savings">Poupança</option>
                      <option value="cash">Dinheiro na Carteira</option>
                      <option value="investment">Investimentos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Saldo Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5200.00"
                    value={accBalance}
                    onChange={e => setAccBalance(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Adicionar Conta
                </button>
              </form>

              {/* Added Accounts List */}
              {accounts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contas Cadastradas ({accounts.length})</span>
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {accounts.map(acc => (
                      <div key={acc.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{acc.name}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(acc.initial_balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => changeStep(4)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Fazer depois
                </button>

                <button
                  onClick={() => changeStep(4)}
                  className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 4 — CARTÕES DE CRÉDITO */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Você utiliza cartão de crédito?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cadastre seus cartões para controlar limites e faturas futuras
                </p>
              </div>

              {usesCreditCard === null && (
                <div className="grid grid-cols-2 gap-4 py-4">
                  <button
                    onClick={() => setUsesCreditCard(true)}
                    className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 font-black text-slate-900 dark:text-white text-base text-center transition-all cursor-pointer"
                  >
                    Sim, utilizo
                  </button>
                  <button
                    onClick={() => { setUsesCreditCard(false); changeStep(5); }}
                    className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-400 font-bold text-slate-500 text-base text-center transition-all cursor-pointer"
                  >
                    Não utilizo
                  </button>
                </div>
              )}

              {usesCreditCard === true && (
                <>
                  <form onSubmit={handleAddCard} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Nome do Cartão</label>
                        <input
                          type="text"
                          placeholder="Ex: Nubank Violeta"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Últimos 4 dígitos</label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Ex: 1234"
                          value={cardDigits}
                          onChange={e => setCardDigits(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Limite Total (R$)</label>
                      <input
                        type="number"
                        placeholder="Ex: 8000"
                        value={cardLimit}
                        onChange={e => setCardLimit(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Dia Fechamento</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={closingDay}
                          onChange={e => setClosingDay(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-500 mb-1">Dia Vencimento</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={dueDay}
                          onChange={e => setDueDay(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Cartão
                    </button>
                  </form>

                  {creditCards.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cartões Cadastrados ({creditCards.length})</span>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {creditCards.map(c => (
                          <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{c.name} (•••• {c.last_four_digits})</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatBRL(c.limit_amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => changeStep(5)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Pular por enquanto
                </button>

                <button
                  onClick={() => changeStep(5)}
                  className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 5 — CATEGORIAS */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Já preparamos suas categorias.
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Você poderá personalizá-las depois conforme suas necessidades.
                </p>
              </div>

              <div className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                {categories.slice(0, 12).map(cat => (
                  <div key={cat.id} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: cat.color }}>
                      <DynamicIcon name={cat.icon} size={14} />
                    </div>
                    <span className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">{cat.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => changeStep(6)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Aceitar e Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 6 — PATRIMÔNIO */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Quer acompanhar seu patrimônio?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Além do dinheiro do dia a dia, você pode acompanhar quanto possui em bens (carro, imóvel, investimentos) e dívidas.
                </p>
              </div>

              {wantsPatrimony === null && (
                <div className="grid grid-cols-2 gap-4 py-4">
                  <button
                    onClick={() => setWantsPatrimony(true)}
                    className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 font-black text-slate-900 dark:text-white text-base text-center transition-all cursor-pointer"
                  >
                    Quero acompanhar
                  </button>
                  <button
                    onClick={() => { setWantsPatrimony(false); changeStep(7); }}
                    className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-400 font-bold text-slate-500 text-base text-center transition-all cursor-pointer"
                  >
                    Agora não
                  </button>
                </div>
              )}

              {wantsPatrimony === true && (
                <div className="space-y-4 text-xs">
                  {/* Asset Quick Form */}
                  <form onSubmit={handleAddAsset} className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Cadastrar Bem / Investimento</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Veículo Honda Civic"
                        value={assetName}
                        onChange={e => setAssetName(e.target.value)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                      <input
                        type="number"
                        placeholder="Valor R$"
                        value={assetVal}
                        onChange={e => setAssetVal(e.target.value)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold">
                      Salvar Bem
                    </button>
                  </form>

                  {/* Liability Quick Form */}
                  <form onSubmit={handleAddLiab} className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-2">
                    <span className="font-bold text-rose-700 dark:text-rose-400">Cadastrar Dívida / Financiamento</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Financiamento Carro"
                        value={liabName}
                        onChange={e => setLiabName(e.target.value)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                      <input
                        type="number"
                        placeholder="Valor Restante R$"
                        value={liabVal}
                        onChange={e => setLiabVal(e.target.value)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 rounded-xl bg-rose-600 text-white font-bold">
                      Salvar Dívida
                    </button>
                  </form>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => changeStep(7)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Pular por enquanto
                </button>

                <button
                  onClick={() => changeStep(7)}
                  className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 7 — PRIMEIRO LANÇAMENTO */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Vamos registrar seu primeiro lançamento.
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Adicione uma despesa ou receita simples para testar o sistema
                </p>
              </div>

              {txDoneMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-300 font-bold text-xs text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Lançamento registrado com sucesso!
                </div>
              ) : (
                <form onSubmit={handleAddFirstTransaction} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl font-bold">
                    <button
                      type="button"
                      onClick={() => setTxType('expense')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${txType === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      Saída / Paguei
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('income')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${txType === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      Entrada / Recebi
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Supermercado, Almoço, Salário"
                      value={txDesc}
                      onChange={e => setTxDesc(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 45.00"
                      value={txAmount}
                      onChange={e => setTxAmount(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                  >
                    Registrar Lançamento
                  </button>
                </form>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => changeStep(8)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Pular por enquanto
                </button>

                <button
                  onClick={() => changeStep(8)}
                  className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 8 — CONCLUSÃO */}
          {step === 8 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Tudo pronto.
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Seu espaço financeiro está configurado e pronto para o uso no dia a dia.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{accounts.length} conta(s) financeira(s) configurada(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{creditCards.length} cartão(ões) cadastrado(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Categorias padrão preparadas</span>
                </div>
              </div>

              <button
                onClick={handleFinishOnboarding}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Ver meu dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Navigation Footer for Stepper */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between text-xs font-semibold text-slate-400 pb-2">
        {step > 1 ? (
          <button
            onClick={() => changeStep(step - 1)}
            className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        ) : <div />}

        <span className="text-[11px] opacity-75">Configuração inicial rápida</span>
      </div>
    </div>
  );
}
