'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Account, Category, Transaction, Budget, Asset, Liability, 
  CreditCard, NetWorthSnapshot, Profile, FinancialSummary 
} from '@/types/finance';
import { 
  getItem, setItem, getLocalUser, setLocalUser, initializeSeedData 
} from '@/lib/storage';
import { calculateFinancialSummary, calculateAccountBalances } from '@/lib/calculations';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface FinanceContextType {
  user: Profile | null;
  isLoading: boolean;
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setPeriod: (year: number, month: number) => void;
  
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  assets: Asset[];
  liabilities: Liability[];
  creditCards: CreditCard[];
  snapshots: NetWorthSnapshot[];

  summary: FinancialSummary;
  
  // Auth methods
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => void;

  // CRUD methods
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  addAccount: (acc: Omit<Account, 'id' | 'user_id'>) => void;
  updateAccount: (id: string, acc: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addCategory: (cat: Omit<Category, 'id' | 'user_id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  setBudgetAmount: (categoryId: string, amount: number) => void;
  
  addAsset: (asset: Omit<Asset, 'id' | 'user_id'>) => void;
  deleteAsset: (id: string) => void;
  
  addLiability: (liability: Omit<Liability, 'id' | 'user_id'>) => void;
  deleteLiability: (id: string) => void;
  
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);

  // Initialize Auth & Data
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile: Profile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'Usuário',
            email: session.user.email || '',
            preferences: { theme: 'system', currency: 'BRL' },
            created_at: session.user.created_at
          };
          setUser(profile);
          loadUserData(profile.id);
        } else {
          // Fallback local user if logged in locally
          const localU = getLocalUser();
          setUser(localU);
          if (localU) {
            initializeSeedData(localU.id);
            loadUserData(localU.id);
          }
        }
      } else {
        const localU = getLocalUser();
        setUser(localU);
        if (localU) {
          initializeSeedData(localU.id);
          loadUserData(localU.id);
        }
      }
      setIsLoading(false);
    }
    init();
  }, []);

  // Sync html theme class
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const loadUserData = (userId: string) => {
    const allAccounts = getItem<Account[]>('fin_accounts', []);
    const allCategories = getItem<Category[]>('fin_categories', []);
    const allTransactions = getItem<Transaction[]>('fin_transactions', []);
    const allBudgets = getItem<Budget[]>('fin_budgets', []);
    const allAssets = getItem<Asset[]>('fin_assets', []);
    const allLiabilities = getItem<Liability[]>('fin_liabilities', []);
    const allCards = getItem<CreditCard[]>('fin_credit_cards', []);
    const allSnapshots = getItem<NetWorthSnapshot[]>('fin_snapshots', []);

    setAccounts(allAccounts.filter(a => a.user_id === userId));
    setCategories(allCategories.filter(c => c.user_id === userId));
    setTransactions(allTransactions.filter(t => t.user_id === userId));
    setBudgets(allBudgets.filter(b => b.user_id === userId));
    setAssets(allAssets.filter(a => a.user_id === userId));
    setLiabilities(allLiabilities.filter(l => l.user_id === userId));
    setCreditCards(allCards.filter(c => c.user_id === userId));
    setSnapshots(allSnapshots.filter(s => s.user_id === userId));
  };

  const setPeriod = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Auth Functions
  const login = async (email: string, pass: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error || !data.user) return false;
      const profile: Profile = {
        id: data.user.id,
        name: data.user.user_metadata?.name || 'Usuário',
        email: data.user.email || '',
        preferences: { theme: 'system', currency: 'BRL' },
        created_at: data.user.created_at
      };
      setUser(profile);
      loadUserData(profile.id);
      return true;
    } else {
      // Local auth simulation
      const mockProfile: Profile = {
        id: 'demo-user-123',
        name: email.split('@')[0] || 'Usuário',
        email: email,
        preferences: { theme: 'system', currency: 'BRL' },
        created_at: new Date().toISOString()
      };
      setLocalUser(mockProfile);
      setUser(mockProfile);
      initializeSeedData(mockProfile.id);
      loadUserData(mockProfile.id);
      return true;
    }
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { name } }
      });
      if (error || !data.user) return false;
      const profile: Profile = {
        id: data.user.id,
        name,
        email,
        preferences: { theme: 'system', currency: 'BRL' },
        created_at: data.user.created_at
      };
      setUser(profile);
      loadUserData(profile.id);
      return true;
    } else {
      const mockProfile: Profile = {
        id: `user-${Date.now()}`,
        name,
        email,
        preferences: { theme: 'system', currency: 'BRL' },
        created_at: new Date().toISOString()
      };
      setLocalUser(mockProfile);
      setUser(mockProfile);
      initializeSeedData(mockProfile.id);
      loadUserData(mockProfile.id);
      return true;
    }
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
    setLocalUser(null);
    setUser(null);
  };

  const updateProfile = (data: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    setLocalUser(updated);
  };

  // CRUD Implementations
  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user) return;
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      user_id: user.id,
      created_at: new Date().toISOString()
    };
    const all = getItem<Transaction[]>('fin_transactions', []);
    const updatedAll = [newTx, ...all];
    setItem('fin_transactions', updatedAll);
    setTransactions(updatedAll.filter(t => t.user_id === user.id));
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    if (!user) return;
    const all = getItem<Transaction[]>('fin_transactions', []);
    const updatedAll = all.map(t => (t.id === id ? { ...t, ...updatedFields } : t));
    setItem('fin_transactions', updatedAll);
    setTransactions(updatedAll.filter(t => t.user_id === user.id));
  };

  const deleteTransaction = (id: string) => {
    if (!user) return;
    const all = getItem<Transaction[]>('fin_transactions', []);
    const updatedAll = all.filter(t => t.id !== id);
    setItem('fin_transactions', updatedAll);
    setTransactions(updatedAll.filter(t => t.user_id === user.id));
  };

  const addAccount = (acc: Omit<Account, 'id' | 'user_id'>) => {
    if (!user) return;
    const newAcc: Account = {
      ...acc,
      id: `acc-${Date.now()}`,
      user_id: user.id
    };
    const all = getItem<Account[]>('fin_accounts', []);
    const updatedAll = [...all, newAcc];
    setItem('fin_accounts', updatedAll);
    setAccounts(updatedAll.filter(a => a.user_id === user.id));
  };

  const updateAccount = (id: string, accFields: Partial<Account>) => {
    if (!user) return;
    const all = getItem<Account[]>('fin_accounts', []);
    const updatedAll = all.map(a => (a.id === id ? { ...a, ...accFields } : a));
    setItem('fin_accounts', updatedAll);
    setAccounts(updatedAll.filter(a => a.user_id === user.id));
  };

  const deleteAccount = (id: string) => {
    if (!user) return;
    const all = getItem<Account[]>('fin_accounts', []);
    const updatedAll = all.filter(a => a.id !== id);
    setItem('fin_accounts', updatedAll);
    setAccounts(updatedAll.filter(a => a.user_id === user.id));
  };

  const addCategory = (cat: Omit<Category, 'id' | 'user_id'>) => {
    if (!user) return;
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      user_id: user.id
    };
    const all = getItem<Category[]>('fin_categories', []);
    const updatedAll = [...all, newCat];
    setItem('fin_categories', updatedAll);
    setCategories(updatedAll.filter(c => c.user_id === user.id));
  };

  const updateCategory = (id: string, catFields: Partial<Category>) => {
    if (!user) return;
    const all = getItem<Category[]>('fin_categories', []);
    const updatedAll = all.map(c => (c.id === id ? { ...c, ...catFields } : c));
    setItem('fin_categories', updatedAll);
    setCategories(updatedAll.filter(c => c.user_id === user.id));
  };

  const deleteCategory = (id: string) => {
    if (!user) return;
    const all = getItem<Category[]>('fin_categories', []);
    const updatedAll = all.filter(c => c.id !== id);
    setItem('fin_categories', updatedAll);
    setCategories(updatedAll.filter(c => c.user_id === user.id));
  };

  const setBudgetAmount = (categoryId: string, amount: number) => {
    if (!user) return;
    const all = getItem<Budget[]>('fin_budgets', []);
    const existingIdx = all.findIndex(
      b => b.user_id === user.id && b.category_id === categoryId && b.month === selectedMonth && b.year === selectedYear
    );

    let updatedAll: Budget[];
    if (existingIdx >= 0) {
      updatedAll = all.map((b, idx) => (idx === existingIdx ? { ...b, amount } : b));
    } else {
      const newB: Budget = {
        id: `b-${Date.now()}`,
        user_id: user.id,
        category_id: categoryId,
        month: selectedMonth,
        year: selectedYear,
        amount
      };
      updatedAll = [...all, newB];
    }
    setItem('fin_budgets', updatedAll);
    setBudgets(updatedAll.filter(b => b.user_id === user.id));
  };

  const addAsset = (asset: Omit<Asset, 'id' | 'user_id'>) => {
    if (!user) return;
    const newAsset: Asset = { ...asset, id: `asset-${Date.now()}`, user_id: user.id };
    const all = getItem<Asset[]>('fin_assets', []);
    const updatedAll = [...all, newAsset];
    setItem('fin_assets', updatedAll);
    setAssets(updatedAll.filter(a => a.user_id === user.id));
  };

  const deleteAsset = (id: string) => {
    if (!user) return;
    const all = getItem<Asset[]>('fin_assets', []);
    const updatedAll = all.filter(a => a.id !== id);
    setItem('fin_assets', updatedAll);
    setAssets(updatedAll.filter(a => a.user_id === user.id));
  };

  const addLiability = (liability: Omit<Liability, 'id' | 'user_id'>) => {
    if (!user) return;
    const newLiab: Liability = { ...liability, id: `liab-${Date.now()}`, user_id: user.id };
    const all = getItem<Liability[]>('fin_liabilities', []);
    const updatedAll = [...all, newLiab];
    setItem('fin_liabilities', updatedAll);
    setLiabilities(updatedAll.filter(l => l.user_id === user.id));
  };

  const deleteLiability = (id: string) => {
    if (!user) return;
    const all = getItem<Liability[]>('fin_liabilities', []);
    const updatedAll = all.filter(l => l.id !== id);
    setItem('fin_liabilities', updatedAll);
    setLiabilities(updatedAll.filter(l => l.user_id === user.id));
  };

  // Re-calculate accounts with balances
  const accountsWithBalances = calculateAccountBalances(accounts, transactions);

  // Financial summary
  const summary = calculateFinancialSummary(
    accounts,
    transactions,
    assets,
    liabilities,
    selectedYear,
    selectedMonth
  );

  return (
    <FinanceContext.Provider value={{
      user,
      isLoading,
      selectedYear,
      selectedMonth,
      setSelectedYear,
      setSelectedMonth,
      setPeriod,
      accounts: accountsWithBalances,
      categories,
      transactions,
      budgets,
      assets,
      liabilities,
      creditCards,
      snapshots,
      summary,
      login,
      signup,
      logout,
      updateProfile,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudgetAmount,
      addAsset,
      deleteAsset,
      addLiability,
      deleteLiability,
      theme,
      toggleTheme
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
