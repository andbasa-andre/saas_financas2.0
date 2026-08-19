'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { getItem } from '@/lib/storage';
import { decodeInviteToken } from '@/lib/familyEngine';
import { AccountInvite, FinancialAccount } from '@/types/finance';
import { Users, UserPlus, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Lock, Mail, User } from 'lucide-react';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { user, login, signup, acceptInviteToken } = useFinance();

  const [finAccount, setFinAccount] = useState<FinancialAccount | null>(null);
  const [inviterName, setInviterName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode: 'register' vs 'login'
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Token de convite não encontrado.');
      setLoading(false);
      return;
    }

    // 1. Try decoding the stateless self-contained token
    const decoded = decodeInviteToken(token);
    if (decoded.isValid) {
      if (decoded.isExpired) {
        setErrorMsg('Este convite expirou (validade de 15 minutos). Peça ao administrador da conta para gerar um novo convite.');
        setLoading(false);
        return;
      }

      setFinAccount({
        id: decoded.accId!,
        name: decoded.accName!,
        owner_id: decoded.ownerId || '',
        created_at: new Date().toISOString()
      });

      if (decoded.ownerName) {
        setInviterName(decoded.ownerName);
      }

      if (decoded.invitedName) {
        setName(decoded.invitedName);
      }

      setLoading(false);
      return;
    }

    // 2. Fallback to legacy local invites (if on same device)
    const allInvites = getItem<AccountInvite[]>('fin_account_invites', []);
    const foundInvite = allInvites.find(i => i.token === token && i.status === 'pending');

    if (!foundInvite) {
      setErrorMsg('Este convite é inválido, expirou ou já foi utilizado.');
      setLoading(false);
      return;
    }

    const allFinAccounts = getItem<FinancialAccount[]>('fin_family_accounts', []);
    const foundAccount = allFinAccounts.find(fa => fa.id === foundInvite.financial_account_id);

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
    setIsSubmitting(true);
    const ok = await acceptInviteToken(token);
    if (ok) {
      setSuccessMsg('Convite aceito com sucesso! Redirecionando...');
      setTimeout(() => router.push('/dashboard'), 1200);
    } else {
      setErrorMsg('Não foi possível aceitar este convite. Ele pode ter expirado.');
      setIsSubmitting(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setErrorMsg('As senhas não coincidem.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
          setIsSubmitting(false);
          return;
        }

        const signedUp = await signup(name.trim(), email.trim(), password);
        if (!signedUp) {
          setErrorMsg('Erro ao criar conta. Verifique os dados e tente novamente.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const loggedIn = await login(email.trim(), password);
        if (!loggedIn) {
          setErrorMsg('E-mail ou senha incorretos.');
          setIsSubmitting(false);
          return;
        }
      }

      // After auth, accept invite automatically
      const accepted = await acceptInviteToken(token);
      if (accepted) {
        setSuccessMsg('Conta vinculada com sucesso! Redirecionando para a conta familiar...');
        setTimeout(() => router.push('/dashboard'), 1200);
      } else {
        setErrorMsg('Conta criada, mas o convite expirou.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('Ocorreu um erro no processamento do convite.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" />
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
            {inviterName ? `${inviterName} convidou você para` : 'Você foi convidado para'} participar da conta financeira:
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
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Conectando...' : 'Aceitar Convite e Entrar na Conta'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* If guest: Option to Register or Login */
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                Criar Minha Conta
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                Já tenho Conta
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Seu Nome</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Nome completo"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Processando...' : (mode === 'register' ? 'Criar Conta e Aceitar Convite' : 'Entrar e Aceitar Convite')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-slate-400 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Seus dados financeiros estarão 100% seguros</span>
        </div>
      </div>
    </div>
  );
}
