'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { QuickTransactionModal } from '@/components/modals/QuickTransactionModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarPinned(prev => !prev);
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white pb-16 lg:pb-0">
      <Header
        onOpenQuickModal={() => setIsQuickModalOpen(true)}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar
          isPinned={isSidebarPinned}
          onTogglePin={() => setIsSidebarPinned(prev => !prev)}
          isOpen={isSidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden transition-all duration-300">
          {children}
        </main>
      </div>

      <BottomNav />

      <QuickTransactionModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
      />
    </div>
  );
}
