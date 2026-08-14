'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Account, Category, Transaction, Budget, Asset, Liability, 
  CreditCard, CreditCardInvoice, CreditCardPurchase, CreditCardPayment, 
  NetWorthSnapshot, Profile, FinancialSummary, FinancialAccount, 
  AccountMember, AccountInvite 
} from '@/types/finance';
import { 
  getItem, setItem, getLocalUser, setLocalUser, initializeSeedData 
} from '@/lib/storage';
import { calculateFinancialSummary, calculateAccountBalances } from '@/lib/calculations';
import { 
  calculateCardLimits, generateInstallmentPurchases, getInvoicePeriodForPurchase, determineInvoiceStatus 
} from '@/lib/creditCardEngine';
import { generateSecureToken, createWhatsAppShareUrl } from '@/lib/familyEngine';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface FinanceContextType {
  user: Profile | null;
  currentAccount: FinancialAccount | null;
  accountMembers: AccountMember[];
  accountInvites: AccountInvite[];
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
  cardPurchases: CreditCardPurchase[];
  cardPayments: CreditCardPayment[];
  snapshots: NetWorthSnapshot[];

  summary: FinancialSummary;
  
  // Auth methods
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => void;

  // Family Account & Member methods
  createWhatsAppInvite: (phone: string, invitedName?: string) => string;
  acceptInviteToken: (token: string) => Promise<boolean>;
  removeMember: (memberId: string) => void;
  leaveAccount: () => void;
  updateFinancialAccountName: (newName: string) => void;

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

  // Credit Card Methods
  addCreditCard: (card: Omit<CreditCard, 'id' | 'user_id'>) => void;
  deleteCreditCard: (id: string) => void;
  addCreditCardPurchase: (
    cardId: string, 
    description: string, 
    totalAmount: number, 
    installments: number, 
    purchaseDate: string, 
    categoryId?: string
  ) => void;
  payInvoice: (
    cardId: string, 
    month: number, 
    year: number, 
    accountId: string, 
    amount: number, 
    paymentDate: string
  ) => void;
  
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [currentAccount, setCurrentAccount] = useState<FinancialAccount | null>(null);
  const [accountMembers, setAccountMembers] = useState<AccountMember[]>([]);
  const [accountInvites, setAccountInvites] = useState<AccountInvite[]>([]);
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
  const [cardPurchases, setCardPurchases] = useState<CreditCardPurchase[]>([]);
  const [cardPayments, setCardPayments] = useState<CreditCardPayment[]>([]);
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
    const allFinAccounts = getItem<FinancialAccount[]>('fin_family_accounts', []);
    const allMembers = getItem<AccountMember[]>('fin_account_members', []);
    const allInvites = getItem<AccountInvite[]>('fin_account_invites', []);

    // Find member record for user
    const memberRecord = allMembers.find(m => m.user_id === userId && m.status === 'active');
    const finAccId = memberRecord?.financial_account_id || allFinAccounts[0]?.id || 'fa-fam-123';

    const currentFinAccount = allFinAccounts.find(fa => fa.id === finAccId) || {
      id: finAccId,
      name: 'Família Silva',
      owner_id: userId,
      created_at: new Date().toISOString()
    };

    setCurrentAccount(currentFinAccount);

    const activeMembers = allMembers.filter(m => m.financial_account_id === finAccId && m.status === 'active');
    setAccountMembers(activeMembers);

    const activeInvites = allInvites.filter(i => i.financial_account_id === finAccId);
    setAccountInvites(activeInvites);

    // Load shared financial data for this financial_account_id
    const allAccounts = getItem<Account[]>('fin_accounts', []);
    const allCategories = getItem<Category[]>('fin_categories', []);
    const allTransactions = getItem<Transaction[]>('fin_transactions', []);
    const allBudgets = getItem<Budget[]>('fin_budgets', []);
    const allAssets = getItem<Asset[]>('fin_assets', []);
    const allLiabilities = getItem<Liability[]>('fin_liabilities', []);
    const allCards = getItem<CreditCard[]>('fin_credit_cards', []);
    const allPurchases = getItem<CreditCardPurchase[]>('fin_card_purchases', []);
    const allPayments = getItem<CreditCardPayment[]>('fin_card_payments', []);
    const allSnapshots = getItem<NetWorthSnapshot[]>('fin_snapshots', []);

    setAccounts(allAccounts.filter(a => a.financial_account_id === finAccId || a.user_id === userId));
    setCategories(allCategories.filter(c => c.financial_account_id === finAccId || c.user_id === userId));
    setTransactions(allTransactions.filter(t => t.financial_account_id === finAccId || t.user_id === userId));
    setBudgets(allBudgets.filter(b => b.financial_account_id === finAccId || b.user_id === userId));
    setAssets(allAssets.filter(a => a.financial_account_id === finAccId || a.user_id === userId));
    setLiabilities(allLiabilities.filter(l => l.financial_account_id === finAccId || l.user_id === userId));
    setCreditCards(allCards.filter(c => c.financial_account_id === finAccId || c.user_id === userId));
    setCardPurchases(allPurchases.filter(p => p.financial_account_id === finAccId || p.user_id === userId));
    setCardPayments(allPayments.filter(pay => pay.financial_account_id === finAccId || pay.user_id === userId));
    setSnapshots(allSnapshots.filter(s => s.financial_account_id === finAccId || s.user_id === userId));
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
      const newUserId = `user-${Date.now()}`;
      const mockProfile: Profile = {
        id: newUserId,
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
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const updateProfile = (data: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    setLocalUser(updated);
  };

  // WhatsApp Invite creation
  const createWhatsAppInvite = (phone: string, invitedName?: string): string => {
    if (!user || !currentAccount) return '';

    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    const newInvite: AccountInvite = {
      id: `inv-${Date.now()}`,
      token,
      financial_account_id: currentAccount.id,
      created_by: user.id,
      invited_name: invitedName,
      invited_phone: phone,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    };

    const allInvites = getItem<AccountInvite[]>('fin_account_invites', []);
    const updatedInvites = [newInvite, ...allInvites];
    setItem('fin_account_invites', updatedInvites);
    setAccountInvites(updatedInvites.filter(i => i.financial_account_id === currentAccount.id));

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://saasfinancas20.vercel.app';
    const inviteUrl = `${origin}/convite/${token}`;

    return createWhatsAppShareUrl(phone, inviteUrl, currentAccount.name, invitedName);
  };

  const acceptInviteToken = async (token: string): Promise<boolean> => {
    if (!user) return false;
    const allInvites = getItem<AccountInvite[]>('fin_account_invites', []);
    const invite = allInvites.find(i => i.token === token && i.status === 'pending');

    if (!invite) return false;

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      return false;
    }

    // Mark invite as accepted
    const updatedInvites = allInvites.map(i => 
      i.token === token ? { ...i, status: 'accepted' as const, accepted_by: user.id } : i
    );
    setItem('fin_account_invites', updatedInvites);

    // Bind user to financial account as member
    const allMembers = getItem<AccountMember[]>('fin_account_members', []);
    const alreadyMember = allMembers.some(m => m.financial_account_id === invite.financial_account_id && m.user_id === user.id);

    if (!alreadyMember) {
      const newMember: AccountMember = {
        id: `mem-${Date.now()}`,
        financial_account_id: invite.financial_account_id,
        user_id: user.id,
        role: 'member',
        status: 'active',
        user_name: user.name,
        user_email: user.email,
        created_at: new Date().toISOString()
      };
      setItem('fin_account_members', [...allMembers, newMember]);
    }

    loadUserData(user.id);
    return true;
  };

  const removeMember = (memberId: string) => {
    if (!user || !currentAccount) return;
    const allMembers = getItem<AccountMember[]>('fin_account_members', []);
    const updatedMembers = allMembers.filter(m => m.id !== memberId);
    setItem('fin_account_members', updatedMembers);
    setAccountMembers(updatedMembers.filter(m => m.financial_account_id === currentAccount.id));
  };

  const leaveAccount = () => {
    if (!user || !currentAccount) return;
    const allMembers = getItem<AccountMember[]>('fin_account_members', []);
    const updatedMembers = allMembers.filter(m => !(m.financial_account_id === currentAccount.id && m.user_id === user.id));
    setItem('fin_account_members', updatedMembers);
    loadUserData(user.id);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const updateFinancialAccountName = (newName: string) => {
    if (!currentAccount) return;
    const allFinAccounts = getItem<FinancialAccount[]>('fin_family_accounts', []);
    const updated = allFinAccounts.map(fa => fa.id === currentAccount.id ? { ...fa, name: newName } : fa);
    setItem('fin_family_accounts', updated);
    setCurrentAccount(prev => prev ? { ...prev, name: newName } : null);
  };

  // CRUD Implementations
  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user || !currentAccount) return;
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      user_id: user.id,
      financial_account_id: currentAccount.id,
      created_by: user.id,
      created_by_name: user.name,
      created_at: new Date().toISOString()
    };
    const all = getItem<Transaction[]>('fin_transactions', []);
    const updatedAll = [newTx, ...all];
    setItem('fin_transactions', updatedAll);
    setTransactions(updatedAll.filter(t => t.financial_account_id === currentAccount.id));
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    if (!user || !currentAccount) return;
    const all = getItem<Transaction[]>('fin_transactions', []);
    const updatedAll = all.map(t => (t.id === id ? { ...t, ...updatedFields } : t));
    setItem('fin_transactions', updatedAll);
    setTransactions(updatedAll.filter(t => t.financial_account_id === currentAccount.id));
  };

  const deleteTransaction = (id: string) => {
    if (!user || !currentAccount) return;
    const all = getItem<Transaction[]>('fin_transactions', []);
    const updatedAll = all.filter(t => t.id !== id);
    setItem('fin_transactions', updatedAll);
    setTransactions(updatedAll.filter(t => t.financial_account_id === currentAccount.id));
  };

  const addAccount = (acc: Omit<Account, 'id' | 'user_id'>) => {
    if (!user || !currentAccount) return;
    const newAcc: Account = {
      ...acc,
      id: `acc-${Date.now()}`,
      user_id: user.id,
      financial_account_id: currentAccount.id,
      created_by: user.id
    };
    const all = getItem<Account[]>('fin_accounts', []);
    const updatedAll = [...all, newAcc];
    setItem('fin_accounts', updatedAll);
    setAccounts(updatedAll.filter(a => a.financial_account_id === currentAccount.id));
  };

  const updateAccount = (id: string, accFields: Partial<Account>) => {
    if (!user || !currentAccount) return;
    const all = getItem<Account[]>('fin_accounts', []);
    const updatedAll = all.map(a => (a.id === id ? { ...a, ...accFields } : a));
    setItem('fin_accounts', updatedAll);
    setAccounts(updatedAll.filter(a => a.financial_account_id === currentAccount.id));
  };

  const deleteAccount = (id: string) => {
    if (!user || !currentAccount) return;
    const all = getItem<Account[]>('fin_accounts', []);
    const updatedAll = all.filter(a => a.id !== id);
    setItem('fin_accounts', updatedAll);
    setAccounts(updatedAll.filter(a => a.financial_account_id === currentAccount.id));
  };

  const addCategory = (cat: Omit<Category, 'id' | 'user_id'>) => {
    if (!user || !currentAccount) return;
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      user_id: user.id,
      financial_account_id: currentAccount.id
    };
    const all = getItem<Category[]>('fin_categories', []);
    const updatedAll = [...all, newCat];
    setItem('fin_categories', updatedAll);
    setCategories(updatedAll.filter(c => c.financial_account_id === currentAccount.id));
  };

  const updateCategory = (id: string, catFields: Partial<Category>) => {
    if (!user || !currentAccount) return;
    const all = getItem<Category[]>('fin_categories', []);
    const updatedAll = all.map(c => (c.id === id ? { ...c, ...catFields } : c));
    setItem('fin_categories', updatedAll);
    setCategories(updatedAll.filter(c => c.financial_account_id === currentAccount.id));
  };

  const deleteCategory = (id: string) => {
    if (!user || !currentAccount) return;
    const all = getItem<Category[]>('fin_categories', []);
    const updatedAll = all.filter(c => c.id !== id);
    setItem('fin_categories', updatedAll);
    setCategories(updatedAll.filter(c => c.financial_account_id === currentAccount.id));
  };

  const setBudgetAmount = (categoryId: string, amount: number) => {
    if (!user || !currentAccount) return;
    const all = getItem<Budget[]>('fin_budgets', []);
    const existingIdx = all.findIndex(
      b => (b.financial_account_id === currentAccount.id || b.user_id === user.id) && b.category_id === categoryId && b.month === selectedMonth && b.year === selectedYear
    );

    let updatedAll: Budget[];
    if (existingIdx >= 0) {
      updatedAll = all.map((b, idx) => (idx === existingIdx ? { ...b, amount } : b));
    } else {
      const newB: Budget = {
        id: `b-${Date.now()}`,
        user_id: user.id,
        financial_account_id: currentAccount.id,
        category_id: categoryId,
        month: selectedMonth,
        year: selectedYear,
        amount
      };
      updatedAll = [...all, newB];
    }
    setItem('fin_budgets', updatedAll);
    setBudgets(updatedAll.filter(b => b.financial_account_id === currentAccount.id));
  };

  const addAsset = (asset: Omit<Asset, 'id' | 'user_id'>) => {
    if (!user || !currentAccount) return;
    const newAsset: Asset = { ...asset, id: `asset-${Date.now()}`, user_id: user.id, financial_account_id: currentAccount.id, created_by: user.id };
    const all = getItem<Asset[]>('fin_assets', []);
    const updatedAll = [...all, newAsset];
    setItem('fin_assets', updatedAll);
    setAssets(updatedAll.filter(a => a.financial_account_id === currentAccount.id));
  };

  const deleteAsset = (id: string) => {
    if (!user || !currentAccount) return;
    const all = getItem<Asset[]>('fin_assets', []);
    const updatedAll = all.filter(a => a.id !== id);
    setItem('fin_assets', updatedAll);
    setAssets(updatedAll.filter(a => a.financial_account_id === currentAccount.id));
  };

  const addLiability = (liability: Omit<Liability, 'id' | 'user_id'>) => {
    if (!user || !currentAccount) return;
    const newLiab: Liability = { ...liability, id: `liab-${Date.now()}`, user_id: user.id, financial_account_id: currentAccount.id, created_by: user.id };
    const all = getItem<Liability[]>('fin_liabilities', []);
    const updatedAll = [...all, newLiab];
    setItem('fin_liabilities', updatedAll);
    setLiabilities(updatedAll.filter(l => l.financial_account_id === currentAccount.id));
  };

  const deleteLiability = (id: string) => {
    if (!user || !currentAccount) return;
    const all = getItem<Liability[]>('fin_liabilities', []);
    const updatedAll = all.filter(l => l.id !== id);
    setItem('fin_liabilities', updatedAll);
    setLiabilities(updatedAll.filter(l => l.financial_account_id === currentAccount.id));
  };

  // Credit Card Methods
  const addCreditCard = (card: Omit<CreditCard, 'id' | 'user_id'>) => {
    if (!user || !currentAccount) return;
    const newCard: CreditCard = {
      ...card,
      id: `card-${Date.now()}`,
      user_id: user.id,
      financial_account_id: currentAccount.id,
      created_by: user.id
    };
    const all = getItem<CreditCard[]>('fin_credit_cards', []);
    const updatedAll = [...all, newCard];
    setItem('fin_credit_cards', updatedAll);
    setCreditCards(updatedAll.filter(c => c.financial_account_id === currentAccount.id));
  };

  const deleteCreditCard = (id: string) => {
    if (!user || !currentAccount) return;
    const all = getItem<CreditCard[]>('fin_credit_cards', []);
    const updatedAll = all.filter(c => c.id !== id);
    setItem('fin_credit_cards', updatedAll);
    setCreditCards(updatedAll.filter(c => c.financial_account_id === currentAccount.id));
  };

  const addCreditCardPurchase = (
    cardId: string,
    description: string,
    totalAmount: number,
    installments: number,
    purchaseDate: string,
    categoryId?: string
  ) => {
    if (!user || !currentAccount) return;
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return;

    const generated = generateInstallmentPurchases(
      card,
      description,
      totalAmount,
      installments,
      purchaseDate,
      categoryId,
      user.id
    );

    const fullPurchases: CreditCardPurchase[] = generated.map((p, idx) => ({
      ...p,
      id: `pur-${Date.now()}-${idx + 1}`,
      financial_account_id: currentAccount.id,
      created_by: user.id,
      created_by_name: user.name
    }));

    const allPurchases = getItem<CreditCardPurchase[]>('fin_card_purchases', []);
    const updatedPurchases = [...fullPurchases, ...allPurchases];
    setItem('fin_card_purchases', updatedPurchases);
    setCardPurchases(updatedPurchases.filter(p => p.financial_account_id === currentAccount.id));
  };

  const payInvoice = (
    cardId: string,
    month: number,
    year: number,
    accountId: string,
    amount: number,
    paymentDate: string
  ) => {
    if (!user || !currentAccount) return;
    const newPayment: CreditCardPayment = {
      id: `pay-${Date.now()}`,
      user_id: user.id,
      financial_account_id: currentAccount.id,
      created_by: user.id,
      invoice_id: `inv-${cardId}-${year}-${month}`,
      account_id: accountId,
      amount,
      payment_date: paymentDate
    };

    const allPayments = getItem<CreditCardPayment[]>('fin_card_payments', []);
    const updatedPayments = [newPayment, ...allPayments];
    setItem('fin_card_payments', updatedPayments);
    setCardPayments(updatedPayments.filter(p => p.financial_account_id === currentAccount.id));

    // Register invoice payment transaction in transactions to deduct checking account balance ONLY
    addTransaction({
      account_id: accountId,
      description: `Pagamento Fatura Cartão (${month}/${year})`,
      amount,
      date: paymentDate,
      type: 'expense',
      status: 'completed',
      payment_method: 'credit_card_payment',
      notes: 'Pagamento de fatura de cartão de crédito (não contabilizado em categorias para evitar duplicação)'
    });
  };

  // Re-calculate accounts with balances
  const accountsWithBalances = calculateAccountBalances(accounts, transactions);

  // Credit Card limit calculations
  const cardsWithCalculatedLimits = creditCards.map(card => {
    const cardPurchasesList = cardPurchases.filter(p => p.credit_card_id === card.id);
    const cardPaymentsList = cardPayments.filter(p => {
      return p.invoice_id.startsWith(`inv-${card.id}`);
    });

    const limits = calculateCardLimits(card, cardPurchasesList, cardPaymentsList);
    return {
      ...card,
      committed_limit: limits.committedLimit,
      available_limit: limits.availableLimit,
      used_limit: limits.committedLimit
    };
  });

  // Calculate total credit committed to include in liabilities for Net Worth
  const totalCreditCommitted = cardsWithCalculatedLimits.reduce(
    (acc, card) => acc + (card.committed_limit || 0), 0
  );

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
      currentAccount,
      accountMembers,
      accountInvites,
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
      creditCards: cardsWithCalculatedLimits,
      cardPurchases,
      cardPayments,
      snapshots,
      summary: {
        ...summary,
        totalCreditCommitted
      },
      login,
      signup,
      logout,
      updateProfile,
      createWhatsAppInvite,
      acceptInviteToken,
      removeMember,
      leaveAccount,
      updateFinancialAccountName,
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
      addCreditCard,
      deleteCreditCard,
      addCreditCardPurchase,
      payInvoice,
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
