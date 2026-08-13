'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AssetType, LiabilityType } from '@/types/finance';
import { Landmark, TrendingUp, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const NetWorthPage = () => {
  const { 
    accounts, assets, liabilities, snapshots, summary, 
    addAsset, deleteAsset, addLiability, deleteLiability 
  } = useFinance();

  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('investment');
  const [assetVal, setAssetVal] = useState('');

  const [liabName, setLiabName] = useState('');
  const [liabType, setLiabType] = useState<LiabilityType>('financing');
  const [liabVal, setLiabVal] = useState('');

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(assetVal.replace(',', '.'));
    if (!assetName.trim() || isNaN(val) || val <= 0) return;

    addAsset({
      name: assetName.trim(),
      type: assetType,
      current_value: val
    });

    setAssetName('');
    setAssetVal('');
  };

  const handleAddLiability = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(liabVal.replace(',', '.'));
    if (!liabName.trim() || isNaN(val) || val <= 0) return;

    addLiability({
      name: liabName.trim(),
      type: liabType,
      current_value: val
    });

    setLiabName('');
    setLiabVal('');
  };

  const totalOtherAssets = assets.reduce((acc, a) => acc + Number(a.current_value), 0);
  const totalAssets = summary.availableBalance + totalOtherAssets;
  const totalLiabilities = liabilities.reduce((acc, l) => acc + Number(l.current_value), 0);

  // Line chart data for historical evolution
  const historicalData = snapshots.map(s => ({
    date: s.snapshot_date.slice(0, 7),
    Patrimônio: s.net_worth,
    Ativos: s.total_assets,
    Passivos: s.total_liabilities
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Patrimônio Líquido</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Visão consolidada de todos os seus bens e obrigações</p>
      </div>

      {/* Net Worth Summary Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Seu Patrimônio Líquido Hoje</span>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatBRL(summary.netWorth)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs text-emerald-300 font-medium block">Total de Ativos</span>
              <span className="text-lg font-bold text-emerald-400">{formatBRL(totalAssets)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <span className="text-xs text-rose-300 font-medium block">Total de Passivos (Dívidas)</span>
              <span className="text-lg font-bold text-rose-400">{formatBRL(totalLiabilities)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Evolution Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Evolução Histórica do Patrimônio</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Acompanhe se seu patrimônio está efetivamente crescendo mês a mês</p>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="date" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tickLine={false} tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                formatter={(val: unknown) => [formatBRL(Number(val) || 0)]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="Patrimônio" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Ativos" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assets and Liabilities Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assets Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Bens & Ativos Cadastrados</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatBRL(totalOtherAssets)}</span>
          </h3>

          <form onSubmit={handleAddAsset} className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Veículo, Imóvel..."
              value={assetName}
              onChange={e => setAssetName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Valor R$"
              value={assetVal}
              onChange={e => setAssetVal(e.target.value)}
              className="w-24 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              required
            />
            <button type="submit" className="p-2 rounded-xl bg-emerald-600 text-white font-bold">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="py-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Saldos em Contas Bancárias</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(summary.availableBalance)}</span>
            </div>
            {assets.map(a => (
              <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">{a.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{formatBRL(a.current_value)}</span>
                  <button onClick={() => deleteAsset(a.id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Passivos & Dívidas</span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{formatBRL(totalLiabilities)}</span>
          </h3>

          <form onSubmit={handleAddLiability} className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Financiamento, Empréstimo..."
              value={liabName}
              onChange={e => setLiabName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Valor R$"
              value={liabVal}
              onChange={e => setLiabVal(e.target.value)}
              className="w-24 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              required
            />
            <button type="submit" className="p-2 rounded-xl bg-rose-600 text-white font-bold">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {liabilities.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs italic">
                Nenhum passivo ou dívida cadastrada. Parabéns!
              </div>
            ) : (
              liabilities.map(l => (
                <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{l.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{formatBRL(l.current_value)}</span>
                    <button onClick={() => deleteLiability(l.id)} className="text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthPage;
