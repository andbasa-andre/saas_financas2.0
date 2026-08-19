'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { DynamicIcon } from '@/components/ui/Icon';
import { Tag, Plus, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const { categories, addCategory, deleteCategory } = useFinance();

  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catColor, setCatColor] = useState('#3b82f6');
  const [catIcon, setCatIcon] = useState('Tag');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    addCategory({
      name: catName.trim(),
      type: catType,
      color: catColor,
      icon: catIcon,
      is_default: false
    });

    setCatName('');
  };

  const incomeCats = categories.filter(c => c.type === 'income');
  const expenseCats = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Categorias & Regras Automáticas</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Personalize suas categorias e melhore as sugestões do sistema</p>
      </div>

      {/* Add New Category Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Nova Categoria Personalizada
        </h3>

        <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Nome da categoria (ex: Petshop)"
            value={catName}
            onChange={e => setCatName(e.target.value)}
            className="sm:col-span-2 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            required
          />

          <select
            value={catType}
            onChange={e => setCatType(e.target.value as 'income' | 'expense')}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>

          <input
            type="color"
            value={catColor}
            onChange={e => setCatColor(e.target.value)}
            className="h-9 w-full rounded-xl cursor-pointer bg-transparent border-0"
          />

          <button type="submit" className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> Criar Categoria
          </button>
        </form>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Categorias de Despesa ({expenseCats.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {expenseCats.map(cat => (
              <div key={cat.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: cat.color }}>
                    <DynamicIcon name={cat.icon} size={14} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                </div>

                {!cat.is_default && (
                  <button onClick={() => deleteCategory(cat.id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Income */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Categorias de Receita ({incomeCats.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {incomeCats.map(cat => (
              <div key={cat.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: cat.color }}>
                    <DynamicIcon name={cat.icon} size={14} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                </div>

                {!cat.is_default && (
                  <button onClick={() => deleteCategory(cat.id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
