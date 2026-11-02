'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { 
  User, Users, UserPlus, ShieldCheck, Sun, Moon, MessageSquare, 
  Trash2, LogOut, Check, Share2, Phone, Edit2 
} from 'lucide-react';

export default function SettingsPage() {
  const { 
    user, currentAccount, accountMembers, updateProfile, theme, toggleTheme,
    createWhatsAppInvite, removeMember, leaveAccount, updateFinancialAccountName
  } = useFinance();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savedMsg, setSavedMsg] = useState(false);

  // Family Account Edit State
  const [isEditingAccName, setIsEditingAccName] = useState(false);
  const [accName, setAccName] = useState(currentAccount?.name || 'Família Silva');

  // WhatsApp Invite State
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  const isOwner = currentAccount?.owner_id === user?.id || accountMembers.find(m => m.user_id === user?.id)?.role === 'owner';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleSaveAccName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    updateFinancialAccountName(accName.trim());
    setIsEditingAccName(false);
  };

  const handleSendWhatsAppInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone.trim()) return;

    const waUrl = await createWhatsAppInvite(invitePhone.trim(), inviteName.trim() || undefined);
    if (waUrl) {
      window.open(waUrl, '_blank');
      setInviteMsg('Convite gerado com sucesso! Abrindo o WhatsApp...');
      setInviteName('');
      setInvitePhone('');
      setTimeout(() => setInviteMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Configurações da Conta & Membros</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie sua conta familiar compartilhada, membros e preferências</p>
      </div>

      {/* Financial Account & Family Members Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              {isEditingAccName ? (
                <form onSubmit={handleSaveAccName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={accName}
                    onChange={e => setAccName(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <button type="submit" className="p-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                    Salvar
                  </button>
                </form>
              ) : (
                <>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {currentAccount?.name || 'Família Silva'}
                  </h3>
                  {isOwner && (
                    <button
                      onClick={() => setIsEditingAccName(true)}
                      className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Editar nome da conta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Conta financeira compartilhada • Transparência total entre {accountMembers.length} membros
            </p>
          </div>

          {!isOwner && (
            <button
              onClick={leaveAccount}
              className="px-3.5 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sair desta conta
            </button>
          )}
        </div>

        {/* Member List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membros Participantes</h4>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {accountMembers.map(mem => (
              <div key={mem.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {mem.user_name?.slice(0, 2).toUpperCase() || 'US'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {mem.user_name || 'Usuário'}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        mem.role === 'owner'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {mem.role === 'owner' ? 'Proprietário' : 'Membro'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{mem.user_email}</p>
                  </div>
                </div>

                {isOwner && mem.role !== 'owner' && (
                  <button
                    onClick={() => removeMember(mem.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                    title="Remover membro da conta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Invite Generator Form */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Convidar nova pessoa via WhatsApp
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gere um link seguro de convite (válido por 15 minutos) e envie diretamente pelo WhatsApp para seu cônjuge ou familiar.
          </p>

          {inviteMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              {inviteMsg}
            </div>
          )}

          <form onSubmit={handleSendWhatsAppInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <input
              type="text"
              placeholder="Nome da pessoa (opcional)"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="WhatsApp: (XX) XXXXX-XXXX"
              value={invitePhone}
              onChange={e => setInvitePhone(e.target.value)}
              required
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" /> Convidar no WhatsApp
            </button>
          </form>
        </div>
      </div>

      {/* User Profile Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Perfil do Usuário
        </h3>

        {savedMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            Perfil atualizado com sucesso!
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Salvar Alterações
          </button>
        </form>
      </div>

      {/* Theme Preference */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-slate-600" />}
            Tema Visual da Aplicação
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Alterne entre os modos claro e escuro para maior conforto visual.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? 'Modo Escuro (Ativo)' : 'Modo Claro (Ativo)'}
        </button>
      </div>
    </div>
  );
}
