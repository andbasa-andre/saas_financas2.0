'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ArrowLeftRight, Target, Landmark, 
  PieChart, Tag, Building, Settings, ChevronRight, Pin, PinOff 
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { href: '/dashboard/planejamento', label: 'Planejamento', icon: Target },
  { href: '/dashboard/patrimonio', label: 'Patrimônio', icon: Landmark },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: PieChart },
  { href: '/dashboard/contas', label: 'Contas & Cartões', icon: Building },
  { href: '/dashboard/categorias', label: 'Categorias', icon: Tag },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  isPinned?: boolean;
  onTogglePin?: () => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isPinned = false, onTogglePin, isOpen = false }) => {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // The sidebar is expanded if it's pinned open OR currently hovered OR toggled via mobile/header button
  const expanded = isPinned || isHovered || isOpen;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`hidden lg:flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-4 shrink-0 transition-all duration-300 ease-in-out min-h-[calc(100vh-65px)] z-30 ${
        expanded ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header action / Pin button */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <span className={`text-xs font-bold text-slate-400 uppercase tracking-wider transition-opacity duration-200 ${
          expanded ? 'opacity-100' : 'opacity-0 hidden'
        }`}>
          Navegação
        </span>

        {onTogglePin && (
          <button
            onClick={onTogglePin}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ml-auto"
            title={isPinned ? 'Desafixar Menu' : 'Fixar Menu Expandido'}
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="space-y-1.5 flex-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`} />
              <span className={`whitespace-nowrap transition-all duration-300 ${
                expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden hidden'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-all duration-300 ${
        expanded ? 'opacity-100' : 'opacity-0 hidden'
      }`}>
        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Finanças 2.0</p>
        <p className="text-[11px]">Modo retrátil ativado</p>
      </div>
    </aside>
  );
};
