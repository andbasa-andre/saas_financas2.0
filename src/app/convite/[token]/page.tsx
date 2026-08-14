'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { getItem } from '@/lib/storage';
import { AccountInvite, FinancialAccount } from '@/types/finance';
import { Users, UserPlus, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { user, login, signup, acceptInviteToken } = useFinance();

  const [invite, setInvite] = useState<AccountInvite | null>(null);
  const [finAccount, setFinAccount] = useState<FinancialAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode: 'register' vs 'login'
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const allInvites = getItem<AccountInvite[]>('fin_account_invites', []);
    const foundInvite = allInvites.find(i => i.token === token && i.status === 'pending');

    if (!foundInvite) {
      setErrorMsg('Este convite é inválido, expirou ou já foi utilizado.');
      setLoading(false);
      return;
    }

    const allFinAccounts = getItem<FinancialAccount[]>('fin_family_accounts', []);
    const foundAccount = allFinAccounts.find(fa => fa.id === foundInvite.financial_account_id);

    setInvite(foundInvite);
    setFinAccount(foundAccount || {
      id: foundInvite.financial_account_id,
      name: 'Família Compartilhada',
      owner_id: foundInvite.created_by,
      created_at: foundInvite.created_at
    });
    setLoading(false);
  }, [token]);

  const handleAcceptLoggedIn = async () => {
    if (!token) return;
    const ok = await acceptInviteToken(token);
    if (ok) {
      setSuccessMsg('Convite aceito com sucesso! Redirecionando...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      setErrorMsg('Não foi possível aceitar este convite.');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }
      const signedUp = await signup(name.trim(), email.trim(), password);
      if (!signedUp) {
        setErrorMsg('Erro ao criar conta. Verifique os dados e tente novamente.');
        return;
      }
    } else {
      const loggedIn = await login(email.trim(), password);
      if (!loggedIn) {
        setErrorMsg('E-mail ou senha incorretos.');
        return;
      }
    }

    // After auth, accept invite automatically
    const accepted = await acceptInviteToken(token);
    if (accepted) {
      setSuccessMsg('Conta vinculada com sucesso! Redirecionando para a conta familiar...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      setErrorMsg('Conta criada, mas o convite expirou.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg p-6 sm:p-8 space-y-6">
        {/* Banner Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Você foi convidado!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Você foi convidado para participar da conta financeira familiar:
          </p>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 inline-block w-full">
            <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {finAccount?.name || 'Família Compartilhada'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transparência total e controle financeiro colaborativo
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* If user is already logged in */}
        {user ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs space-y-1">
              <span className="text-slate-500 block">Conectado atualmente como:</span>
              <strong className="text-slate-900 dark:text-white font-bold text-sm block">{user.name}</strong>
              <span className="text-slate-400">{user.email}</span>
            </div>

            <button
              onClick={handleAcceptLoggedIn}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Aceitar Convite e Entrar na Conta <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Form for new users (Register or Login) */
          <div className="space-y-4 pt-2">
            {/* Mode Switcher Pills */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 rounded-xl text-center transition-all ${
                  mode === 'register' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Criar Minha Conta
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-xl text-center transition-all ${
                  mode === 'login' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Já Tenho Conta (Entrar)
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {mode === 'register' && (
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Seu Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Jaqueline Silva"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-500 mb-1 font-medium">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-hidden"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Confirmar Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-hidden"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer pt-3"
              >
                {mode === 'register' ? 'Criar Conta e Aceitar Convite' : 'Entrar e Aceitar Convite'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
