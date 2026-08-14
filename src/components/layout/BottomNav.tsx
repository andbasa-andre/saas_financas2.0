'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { 
  LayoutDashboard, ArrowLeftRight, CreditCard, Target, Landmark, 
  PieChart, Building, Tag, Settings, Menu, X, Sun, Moon, LogOut 
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/lancamentos', label: 'Extrato', icon: ArrowLeftRight },
  { href: '/dashboard/cartoes', label: 'Cartões', icon: CreditCard },
  { href: '/dashboard/planejamento', label: 'Metas', icon: Target },
];

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
  { href: '/dashboard/lancamentos', label: 'Extrato de Lançamentos', icon: ArrowLeftRight },
  { href: '/dashboard/cartoes', label: 'Cartões de Crédito & Faturas', icon: CreditCard },
  { href: '/dashboard/planejamento', label: 'Planejamento & Orçamento', icon: Target },
  { href: '/dashboard/patrimonio', label: 'Patrimônio & Ativos', icon: Landmark },
  { href: '/dashboard/relatorios', label: 'Relatórios & DRE', icon: PieChart },
  { href: '/dashboard/contas', label: 'Contas Bancárias', icon: Building },
  { href: '/dashboard/categorias', label: 'Gerenciador de Categorias', icon: Tag },
  { href: '/dashboard/configuracoes', label: 'Configurações do Perfil', icon: Settings },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggleTheme, logout } = useFinance();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-2 flex items-center justify-around">
        {MAIN_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[11px] font-medium transition-all ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* "Mais" Button triggering full menu drawer */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[11px] font-medium transition-all ${
            isMoreOpen
              ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 text-slate-400" />
          <span>Mais</span>
        </button>
      </div>

      {/* Full Mobile Menu Sheet Drawer */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Menu Completo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Todos os módulos da sua conta</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of all 9 Menu items */}
            <div className="grid grid-cols-1 gap-1">
              {ALL_NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Additional Quick Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>{theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
              </button>

              <button
                onClick={() => { setIsMoreOpen(false); logout(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
