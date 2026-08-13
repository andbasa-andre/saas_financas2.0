'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { User, Settings, ShieldCheck, Sun, Moon, MessageSquare, Download, Upload } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile, theme, toggleTheme } = useFinance();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Configurações & Perfil</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie seus dados pessoais, segurança e dados</p>
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
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
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
          className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? 'Modo Escuro (Ativo)' : 'Modo Claro (Ativo)'}
        </button>
      </div>

      {/* WhatsApp Integration Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Integração com WhatsApp (Preparado para Produção)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Sua conta está preparada para integração com o assistente de WhatsApp via webhook seguro (`/api/whatsapp/webhook`). Lançamentos por mensagem de texto ("Gastei 87 no mercado hoje") serão processados com confirmação prévia e isolamento absoluto por `user_id`.
        </p>
      </div>
    </div>
  );
}
