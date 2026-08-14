'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { 
  Wallet, ShieldCheck, Users, CreditCard, Target, Landmark, 
  ArrowRight, CheckCircle2, Sun, Moon, Sparkles, PieChart, Lock 
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
              Pessoal & Familiar
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
      <section className="px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs">
          <Users className="w-4 h-4" />
          <span>Nova Funcionalidade: Contas Familiares Compartilhadas com WhatsApp</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
          O controle financeiro pessoal e familiar que você sempre quis.
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Substitua planilhas complexas por uma ferramenta rápida, bonita e transparente. Saiba exatamente quanto tem hoje, quanto vai gastar e quanto pode usar por dia sem comprometer seu mês.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
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
            Já tenho uma conta
          </Link>
        </div>

        {/* Badges checklist */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 pt-4">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sem cartões de crédito exigidos</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Supabase RLS 100% Seguro</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Convites instantâneos no WhatsApp</span>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-4 sm:px-8 py-16 bg-white dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Tudo o que você precisa para dominar suas finanças
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Desenvolvido com foco em velocidade, transparência total e simplicidade de uso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conta Familiar Compartilhada</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Compartilhe o acesso financeiro com seu cônjuge com transparência total. Todos os membros enxergam as mesmas contas, cartões e lançamentos sem dados escondidos.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gestão de Cartões & Faturas</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Controle compras parceladas em até 24x, limite comprometido vs. disponível, faturas abertas e liquidação sem duplicação de despesas no extrato.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Teto Diário Sugerido</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Saiba exatamente qual o valor médio diário que você pode gastar nos dias restantes do mês sem estourar seu orçamento planejado.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Patrimônio Líquido em Tempo Real</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Acompanhe o cálculo contínuo de Ativos (contas, veículos, investimentos) menos Passivos (financiamentos e obrigações de cartão) com gráficos evolutivos.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Relatórios & DRE Financeiro</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Visualização clara de saídas por categoria, receitas, resultado mensal e exportação de relatórios em CSV com um único clique.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacidade & Isolamento RLS</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Arquitetura PostgreSQL com Supabase Row Level Security (RLS). Nenhuma pessoa fora da sua conta consegue acessar seus dados financeiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="px-4 sm:px-8 py-20 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Pronto para organizar suas finanças de forma simples?
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Crie sua conta agora mesmo e convide sua família em menos de 2 minutos.
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
        <p>© 2026 Finanças 2.0 — Controle Financeiro Pessoal & Familiar Multi-usuário</p>
      </footer>
    </div>
  );
}
