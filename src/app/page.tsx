'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { 
  Wallet, ShieldCheck, Users, CreditCard, Target, Landmark, 
  ArrowRight, CheckCircle2, Sun, Moon, PiggyBank, HeartHandshake 
} from 'lucide-react';

export default function LandingPage() {
  const { user, isLoading, theme, toggleTheme } = useFinance();
  const router = useRouter();

  // If already logged in, redirect to dashboard
  if (!isLoading && user) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Finanças 2.0</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full ml-2">
              Para você e sua família
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Alternar Tema Claro / Escuro"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <Link
            href="/login"
            className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Entrar
          </Link>

          <Link
            href="/register"
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            Criar Conta Grátis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-8 py-14 sm:py-20 max-w-5xl mx-auto text-center space-y-8">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Nunca mais gaste mais do que você ganha.
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Esqueça planilhas complicadas e contas confusas. Organize o dinheiro da sua casa com facilidade, saiba exatamente quanto pode gastar hoje e durma com a mente tranquila.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            Começar Agora — É Grátis <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center"
          >
            Fazer Login
          </Link>
        </div>

        {/* Simple Promises */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 pt-4">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Grátis para começar</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Convide sua família pelo WhatsApp</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Seus dados seguros e protegidos</span>
        </div>
      </section>

      {/* Golden Rule Highlight Card */}
      <section className="px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xl shadow-emerald-600/20 space-y-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-200">A Regra de Ouro</span>
            <h2 className="text-xl sm:text-2xl font-black">"Gaste menos do que recebe e guarde a diferença."</h2>
            <p className="text-xs sm:text-sm text-emerald-100 opacity-90">
              O sistema calcula automaticamente o quanto sobrou no mês para você economizar sem sofrimento.
            </p>
          </div>
          <Link
            href="/register"
            className="px-6 py-3 rounded-2xl bg-white text-emerald-800 font-extrabold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-colors shrink-0"
          >
            Quero Organizar Minhas Contas
          </Link>
        </div>
      </section>

      {/* Feature Grid with simple concepts */}
      <section className="px-4 sm:px-8 py-16 bg-white dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80 mt-12">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Feito para facilitar a sua vida
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Respostas claras e sem enrolação para o seu dia a dia financeiro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contas da Casa Compartilhadas</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Convide seu parceiro ou parceira pelo WhatsApp. Todo mundo vê os mesmos lançamentos da casa com total clareza e sem segredos.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cartões e Faturas sob Controle</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Saiba exatamente quanto vai vir na próxima fatura, acompanhe as parcelas das compras e veja quanto limite ainda tem para usar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Limite do Dia</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Descubra qual o valor médio diário que você pode gastar hoje sem estourar o dinheiro que reservou para o restante do mês.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reserva e Bens</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Acompanhe o crescimento da sua poupança, investimentos e bens (como carro ou imóvel) descontando dívidas e financiamentos.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Entradas e Saídas Claras</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Saiba exatamente de onde veio seu dinheiro (salários, extras) e para onde ele foi (mercado, contas de água e luz, lazer).
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Segurança e Privacidade</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Seus dados financeiros são exclusivamente seus. Apenas você e as pessoas que você convidar têm acesso às informações.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="px-4 sm:px-8 py-20 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Pronto para ter paz com o seu dinheiro?
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Crie sua conta em menos de 1 minuto e comece a controlar suas finanças hoje mesmo.
        </p>

        <div className="pt-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/25 transition-all cursor-pointer"
          >
            Criar Minha Conta Grátis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 Finanças 2.0 — Controle Financeiro Pessoal e Familiar</p>
      </footer>
    </div>
  );
}
