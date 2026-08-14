'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Plus, Sun, Moon, LogOut, Wallet, Users } from 'lucide-react';

interface HeaderProps {
  onOpenQuickModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickModal }) => {
  const { user, currentAccount, accountMembers, theme, toggleTheme, logout } = useFinance();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between">
      {/* Brand & Financial Account Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
          <Wallet className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {currentAccount?.name || 'Família Silva'}
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              <Users className="w-3 h-3" />
              {accountMembers.length} {accountMembers.length === 1 ? 'membro' : 'membros'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Olá, {user?.name.split(' ')[0] || 'Usuário'}! Controle financeiro colaborativo
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Transaction Button */}
        <button
          onClick={onOpenQuickModal}
          className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-[0.97] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Transação</span>
          <span className="sm:hidden">Nova</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Alternar Tema Claro / Escuro"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User logout button */}
        <button
          onClick={logout}
          className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
          title="Sair da Conta"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
