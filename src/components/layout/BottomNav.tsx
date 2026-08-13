'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Target, Landmark, PieChart } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/lancamentos', label: 'Extrato', icon: ArrowLeftRight },
  { href: '/dashboard/planejamento', label: 'Metas', icon: Target },
  { href: '/dashboard/patrimonio', label: 'Patrimônio', icon: Landmark },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: PieChart },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-2 flex items-center justify-around">
      {MOBILE_NAV_ITEMS.map(item => {
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
    </div>
  );
};
