'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Account, Category, Transaction, Budget, Asset, Liability, 
  CreditCard, CreditCardInvoice, CreditCardPurchase, CreditCardPayment, 
  NetWorthSnapshot, Profile, FinancialSummary, FinancialAccount, 
  AccountMember, AccountInvite 
} from '@/types/finance';
import { syncAuthCookie } from '@/lib/storage';
import { calculateFinancialSummary, calculateAccountBalances } from '@/lib/calculations';
import { 
  calculateCardLimits, generateInstallmentPurchases, getInvoicePeriodForPurchase, determineInvoiceStatus 
} from '@/lib/creditCardEngine';
import { generateInviteToken, decodeInviteToken, createWhatsAppShareUrl } from '@/lib/familyEngine';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { capitalizeFirstLetter } from '@/lib/stringUtils';

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
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, pass: string) => Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;

  // Onboarding Methods
  updateOnboardingStep: (step: number, goals?: string[]) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  hideOnboardingChecklist: () => Promise<void>;

  // Family Account & Member methods
  createWhatsAppInvite: (phone: string, invitedName?: string) => Promise<string>;
  acceptInviteToken: (token: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<void>;
  leaveAccount: () => Promise<void>;
  updateFinancialAccountName: (newName: string) => Promise<void>;

  // CRUD methods
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addAccount: (acc: Omit<Account, 'id' | 'user_id'>) => Promise<void>;
  updateAccount: (id: string, acc: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  addCategory: (cat: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  setBudgetAmount: (categoryId: string, amount: number) => Promise<void>;
  
  addAsset: (asset: Omit<Asset, 'id' | 'user_id'>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  
  addLiability: (liability: Omit<Liability, 'id' | 'user_id'>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;

  // Credit Card Methods
  addCreditCard: (card: Omit<CreditCard, 'id' | 'user_id'>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addCreditCardPurchase: (
    cardId: string, 
    description: string, 
    totalAmount: number, 
    installments: number, 
    purchaseDate: string, 
    categoryId?: string
  ) => Promise<void>;
  payInvoice: (
    cardId: string, 
    month: number, 
    year: number, 
    accountId: string, 
    amount: number, 
    paymentDate: string
  ) => Promise<void>;
  
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

  // Carrega todos os dados do usuário a partir do Supabase
  const loadUserData = async (userId: string, userEmail?: string, userName?: string) => {
    if (!supabase) return;

    try {
      // 1. Perfil do Usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const resolvedName = profileData?.name || userName || userEmail?.split('@')[0] || 'Usuário';
      const userProfile: Profile = {
        id: userId,
        name: resolvedName,
        email: profileData?.email || userEmail || '',
        preferences: profileData?.preferences || { theme: 'system', currency: 'BRL' },
        onboarding_completed: profileData?.onboarding_completed ?? false,
        onboarding_step: profileData?.onboarding_step ?? 1,
        financial_goals: profileData?.financial_goals || [],
        show_onboarding_checklist: profileData?.show_onboarding_checklist ?? true,
        created_at: profileData?.created_at || new Date().toISOString()
      };
      setUser(userProfile);

      // 2. Conta Financeira Familiar / Workspace
      let finAccId: string | null = null;
      let activeFinAccount: FinancialAccount | null = null;

      const { data: memberRecords } = await supabase
        .from('account_members')
        .select('*, financial_accounts(*)')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberRecords && memberRecords.length > 0) {
        finAccId = memberRecords[0].financial_account_id;
        activeFinAccount = memberRecords[0].financial_accounts as unknown as FinancialAccount;
      }

      // Se não existir vínculo de conta financeira, busca ou cria uma
      if (!finAccId) {
        const { data: existingFin } = await supabase
          .from('financial_accounts')
          .select('*')
          .eq('owner_id', userId)
          .maybeSingle();

        if (existingFin) {
          finAccId = existingFin.id;
          activeFinAccount = existingFin;
        } else {
          const { data: newFin } = await supabase
            .from('financial_accounts')
            .insert({ name: 'Minhas Finanças', owner_id: userId })
            .select()
            .maybeSingle();

          if (newFin) {
            finAccId = newFin.id;
            activeFinAccount = newFin;
            await supabase
              .from('account_members')
              .insert({ financial_account_id: finAccId, user_id: userId, role: 'owner', status: 'active' });
          }
        }
      }

      if (activeFinAccount) {
        setCurrentAccount(activeFinAccount);
      }

      // 3. Membros e Convites
      if (finAccId) {
        const { data: members } = await supabase
          .from('account_members')
          .select('*')
          .eq('financial_account_id', finAccId)
          .eq('status', 'active');
        if (members) setAccountMembers(members);

        const { data: invites } = await supabase
          .from('account_invites')
          .select('*')
          .eq('financial_account_id', finAccId);
        if (invites) setAccountInvites(invites);
      }

      // 4. Carregar todas as tabelas financeiras online via Supabase
      const [
        accountsRes,
        categoriesRes,
        transactionsRes,
        budgetsRes,
        assetsRes,
        liabilitiesRes,
        cardsRes,
        purchasesRes,
        snapshotsRes
      ] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('budgets').select('*'),
        supabase.from('assets').select('*').order('created_at', { ascending: true }),
        supabase.from('liabilities').select('*').order('created_at', { ascending: true }),
        supabase.from('credit_cards').select('*').order('created_at', { ascending: true }),
        supabase.from('credit_card_purchases').select('*').order('created_at', { ascending: false }),
        supabase.from('net_worth_snapshots').select('*').order('snapshot_date', { ascending: true })
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (budgetsRes.data) setBudgets(budgetsRes.data);
      if (assetsRes.data) setAssets(assetsRes.data);
      if (liabilitiesRes.data) setLiabilities(liabilitiesRes.data);
      if (cardsRes.data) setCreditCards(cardsRes.data);
      if (purchasesRes.data) setCardPurchases(purchasesRes.data);
      if (snapshotsRes.data) setSnapshots(snapshotsRes.data);

    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
    }
  };

  // Inicializa sessão do Supabase Auth
  useEffect(() => {
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    async function init() {
      setIsLoading(true);

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            syncAuthCookie(true);
            await loadUserData(session.user.id, session.user.email, session.user.user_metadata?.name);
          } else {
            setUser(null);
            syncAuthCookie(false);
          }

          const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
              setUser(null);
              syncAuthCookie(false);
              setAccounts([]);
              setCategories([]);
              setTransactions([]);
              setBudgets([]);
              setAssets([]);
              setLiabilities([]);
              setCreditCards([]);
              setCardPurchases([]);
            } else if (event === 'SIGNED_IN' && session?.user) {
              syncAuthCookie(true);
              await loadUserData(session.user.id, session.user.email, session.user.user_metadata?.name);
            }
          });
          authListener = listener;
        } catch (err) {
          console.error('Erro ao verificar sessão Supabase:', err);
        }
      }

      setIsLoading(false);
    }

    init();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sincroniza tema dark/light
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

  const setPeriod = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Auth Methods 100% Online Supabase
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: 'Supabase não inicializado.' };
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass
      });

      if (error || !data.user) {
        if (error?.message?.toLowerCase().includes('email not confirmed')) {
          return { success: false, error: 'E-mail não confirmado. Por favor, acesse sua caixa de entrada e clique no link de ativação enviado pelo Supabase.' };
        }
        if (error?.message?.toLowerCase().includes('invalid login credentials')) {
          return { success: false, error: 'E-mail ou senha incorretos.' };
        }
        return { success: false, error: error?.message || 'Falha ao autenticar.' };
      }

      syncAuthCookie(true);
      await loadUserData(data.user.id, data.user.email, data.user.user_metadata?.name);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar login.';
      console.error('Exceção no login Supabase:', err);
      return { success: false, error: msg };
    }
  };

  const signup = async (name: string, email: string, pass: string): Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: 'Supabase não inicializado.' };
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = capitalizeFirstLetter(name);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            name: cleanName,
            onboarding_completed: false,
            onboarding_step: 1
          }
        }
      });

      if (error || !data.user) {
        if (error?.message?.toLowerCase().includes('already registered')) {
          return { success: false, error: 'Este e-mail já está cadastrado. Tente fazer login.' };
        }
        return { success: false, error: error?.message || 'Falha ao criar conta.' };
      }

      // Se não há sessão ativa imediatamente, o Supabase exige confirmação de e-mail
      if (!data.session) {
        return { success: true, needsEmailConfirmation: true };
      }

      syncAuthCookie(true);
      await loadUserData(data.user.id, data.user.email, cleanName);
      return { success: true, needsEmailConfirmation: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro no cadastro.';
      console.error('Exceção no cadastro Supabase:', err);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Erro ao sair:', err);
    } finally {
      setUser(null);
      syncAuthCookie(false);
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user || !supabase) return;
    const formattedData = {
      ...data,
      name: data.name ? capitalizeFirstLetter(data.name) : user.name
    };

    const { error } = await supabase
      .from('profiles')
      .update(formattedData)
      .eq('id', user.id);

    if (!error) {
      setUser(prev => prev ? { ...prev, ...formattedData } : null);
    }
  };

  // Onboarding Methods
  const updateOnboardingStep = async (step: number, goals?: string[]) => {
    if (!user || !supabase) return;
    const updatedGoals = goals || user.financial_goals;

    setUser(prev => prev ? { ...prev, onboarding_step: step, financial_goals: updatedGoals } : null);

    await supabase
      .from('profiles')
      .update({ onboarding_step: step, financial_goals: updatedGoals })
      .eq('id', user.id);
  };

  const completeOnboarding = async () => {
    if (!user || !supabase) return;

    setUser(prev => prev ? { ...prev, onboarding_completed: true, onboarding_step: 8, show_onboarding_checklist: true } : null);

    await supabase
      .from('profiles')
      .update({ onboarding_completed: true, onboarding_step: 8, show_onboarding_checklist: true })
      .eq('id', user.id);
  };

  const hideOnboardingChecklist = async () => {
    if (!user || !supabase) return;

    setUser(prev => prev ? { ...prev, show_onboarding_checklist: false } : null);

    await supabase
      .from('profiles')
      .update({ show_onboarding_checklist: false })
      .eq('id', user.id);
  };

  // Convites e Contas Compartilhadas via Supabase
  const createWhatsAppInvite = async (phone: string, invitedName?: string): Promise<string> => {
    if (!user || !currentAccount || !supabase) return '';

    const formattedInvitedName = invitedName ? capitalizeFirstLetter(invitedName) : undefined;
    const token = generateInviteToken({
      accId: currentAccount.id,
      accName: currentAccount.name,
      ownerId: user.id,
      ownerName: user.name,
      phone: phone,
      invitedName: formattedInvitedName,
      expiresInMinutes: 60 * 24 * 7 // 7 dias
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: newInvite } = await supabase
      .from('account_invites')
      .insert({
        token,
        financial_account_id: currentAccount.id,
        created_by: user.id,
        invited_name: formattedInvitedName,
        invited_phone: phone,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .maybeSingle();

    if (newInvite) {
      setAccountInvites(prev => [newInvite, ...prev]);
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://minhascontas-seven.vercel.app';
    const inviteUrl = `${origin}/convite/${token}`;

    return createWhatsAppShareUrl(phone, inviteUrl, currentAccount.name, formattedInvitedName);
  };

  const acceptInviteToken = async (token: string): Promise<boolean> => {
    if (!user || !supabase) return false;

    // Decodifica token
    const decoded = decodeInviteToken(token);
    let targetAccId = decoded.accId;

    if (!targetAccId) {
      const { data: invite } = await supabase
        .from('account_invites')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (!invite || new Date(invite.expires_at) < new Date()) {
        return false;
      }
      targetAccId = invite.financial_account_id;
    }

    if (!targetAccId) return false;

    // Associa usuário à conta familiar
    const { error } = await supabase
      .from('account_members')
      .insert({
        financial_account_id: targetAccId,
        user_id: user.id,
        role: 'member',
        status: 'active'
      });

    if (!error) {
      await supabase
        .from('account_invites')
        .update({ status: 'accepted', accepted_by: user.id })
        .eq('token', token);

      await loadUserData(user.id, user.email, user.name);
      return true;
    }

    return false;
  };

  const removeMember = async (memberId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('account_members').delete().eq('id', memberId);
    if (!error) {
      setAccountMembers(prev => prev.filter(m => m.id !== memberId));
    }
  };

  const leaveAccount = async () => {
    if (!user || !currentAccount || !supabase) return;
    await supabase
      .from('account_members')
      .delete()
      .eq('financial_account_id', currentAccount.id)
      .eq('user_id', user.id);

    await loadUserData(user.id, user.email, user.name);
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };

  const updateFinancialAccountName = async (newName: string) => {
    if (!currentAccount || !supabase) return;
    const formattedName = capitalizeFirstLetter(newName);

    const { error } = await supabase
      .from('financial_accounts')
      .update({ name: formattedName })
      .eq('id', currentAccount.id);

    if (!error) {
      setCurrentAccount(prev => prev ? { ...prev, name: formattedName } : null);
    }
  };

  // ==========================================
  // OPERAÇÕES FINANCEIRAS 100% ONLINE (SUPABASE)
  // ==========================================

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user || !supabase) return;

    const payload = {
      ...tx,
      user_id: user.id,
      financial_account_id: currentAccount?.id || null,
      description: capitalizeFirstLetter(tx.description),
      notes: tx.notes ? capitalizeFirstLetter(tx.notes) : null
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      setTransactions(prev => [data, ...prev]);
    } else if (error) {
      console.error('Erro ao adicionar transação no Supabase:', error.message);
    }
  };

  const updateTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    if (!supabase) return;

    const payload = {
      ...updatedFields,
      description: updatedFields.description !== undefined ? capitalizeFirstLetter(updatedFields.description) : undefined,
      notes: updatedFields.notes !== undefined ? (updatedFields.notes ? capitalizeFirstLetter(updatedFields.notes) : null) : undefined
    };

    const { error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id);

    if (!error) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addAccount = async (acc: Omit<Account, 'id' | 'user_id'>) => {
    if (!user || !supabase) return;

    const payload = {
      ...acc,
      user_id: user.id,
      financial_account_id: currentAccount?.id || null,
      name: capitalizeFirstLetter(acc.name),
      financial_institution: acc.financial_institution ? capitalizeFirstLetter(acc.financial_institution) : null
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      setAccounts(prev => [...prev, data]);
    }
  };

  const updateAccount = async (id: string, accFields: Partial<Account>) => {
    if (!supabase) return;

    const payload = {
      ...accFields,
      name: accFields.name !== undefined ? capitalizeFirstLetter(accFields.name) : undefined,
      financial_institution: accFields.financial_institution !== undefined ? (accFields.financial_institution ? capitalizeFirstLetter(accFields.financial_institution) : null) : undefined
    };

    const { error } = await supabase
      .from('accounts')
      .update(payload)
      .eq('id', id);

    if (!error) {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...payload } : a));
    }
  };

  const deleteAccount = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (!error) {
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  const addCategory = async (cat: Omit<Category, 'id' | 'user_id'>) => {
    if (!user || !supabase) return;

    const payload = {
      ...cat,
      user_id: user.id,
      financial_account_id: currentAccount?.id || null,
      name: capitalizeFirstLetter(cat.name)
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      setCategories(prev => [...prev, data]);
    }
  };

  const updateCategory = async (id: string, catFields: Partial<Category>) => {
    if (!supabase) return;

    const payload = {
      ...catFields,
      name: catFields.name !== undefined ? capitalizeFirstLetter(catFields.name) : undefined
    };

    const { error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id);

    if (!error) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
    }
  };

  const deleteCategory = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const setBudgetAmount = async (categoryId: string, amount: number) => {
    if (!user || !supabase) return;

    const existingBudget = budgets.find(
      b => b.category_id === categoryId && b.month === selectedMonth && b.year === selectedYear
    );

    if (existingBudget) {
      const { error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', existingBudget.id);

      if (!error) {
        setBudgets(prev => prev.map(b => b.id === existingBudget.id ? { ...b, amount } : b));
      }
    } else {
      const payload = {
        user_id: user.id,
        financial_account_id: currentAccount?.id || null,
        category_id: categoryId,
        month: selectedMonth,
        year: selectedYear,
        amount
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert(payload)
        .select()
        .maybeSingle();

      if (!error && data) {
        setBudgets(prev => [...prev, data]);
      }
    }
  };

  const addAsset = async (asset: Omit<Asset, 'id' | 'user_id'>) => {
    if (!user || !supabase) return;

    const payload = {
      ...asset,
      user_id: user.id,
      financial_account_id: currentAccount?.id || null,
      name: capitalizeFirstLetter(asset.name),
      notes: asset.notes ? capitalizeFirstLetter(asset.notes) : null
    };

    const { data, error } = await supabase
      .from('assets')
      .insert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      setAssets(prev => [...prev, data]);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (!error) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const addLiability = async (liability: Omit<Liability, 'id' | 'user_id'>) => {
    if (!user || !supabase) return;

    const payload = {
      ...liability,
      user_id: user.id,
      financial_account_id: currentAccount?.id || null,
      name: capitalizeFirstLetter(liability.name),
      notes: liability.notes ? capitalizeFirstLetter(liability.notes) : null
    };

    const { data, error } = await supabase
      .from('liabilities')
      .insert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      setLiabilities(prev => [...prev, data]);
    }
  };

  const deleteLiability = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('liabilities').delete().eq('id', id);
    if (!error) {
      setLiabilities(prev => prev.filter(l => l.id !== id));
    }
  };

  // Cartões de Crédito
  const addCreditCard = async (card: Omit<CreditCard, 'id' | 'user_id'>) => {
    if (!user || !supabase) return;

    const payload = {
      ...card,
      user_id: user.id,
      financial_account_id: currentAccount?.id || null,
      name: capitalizeFirstLetter(card.name),
      brand: card.brand || 'Mastercard',
      color: card.color || '#6366f1'
    };

    const { data, error } = await supabase
      .from('credit_cards')
      .insert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      setCreditCards(prev => [...prev, data]);
    }
  };

  const deleteCreditCard = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (!error) {
      setCreditCards(prev => prev.filter(c => c.id !== id));
    }
  };

  const addCreditCardPurchase = async (
    cardId: string,
    description: string,
    totalAmount: number,
    installments: number,
    purchaseDate: string,
    categoryId?: string
  ) => {
    if (!user || !supabase) return;

    const card = creditCards.find(c => c.id === cardId);
    if (!card) return;

    const formattedDesc = capitalizeFirstLetter(description);

    // 1. Salva compra geral
    const { data: purchaseData } = await supabase
      .from('credit_card_purchases')
      .insert({
        user_id: user.id,
        financial_account_id: currentAccount?.id || null,
        credit_card_id: cardId,
        category_id: categoryId || null,
        description: formattedDesc,
        total_amount: totalAmount,
        installments_count: installments,
        purchase_date: purchaseDate
      })
      .select()
      .maybeSingle();

    if (purchaseData) {
      setCardPurchases(prev => [purchaseData, ...prev]);
    }

    // 2. Gera as parcelas em transactions vinculadas ao cartão
    const generated = generateInstallmentPurchases(
      card,
      formattedDesc,
      totalAmount,
      installments,
      purchaseDate,
      categoryId,
      user.id
    );

    const transactionsPayload = generated.map((p, idx) => ({
      user_id: user.id,
      financial_account_id: currentAccount?.id || null,
      credit_card_id: cardId,
      category_id: categoryId || null,
      description: `${formattedDesc} (${idx + 1}/${installments})`,
      amount: p.amount,
      date: p.purchase_date,
      type: 'expense' as const,
      status: 'completed' as const,
      payment_method: 'credit_card',
      installment_number: idx + 1,
      total_installments: installments
    }));

    const { data: insertedTxs } = await supabase
      .from('transactions')
      .insert(transactionsPayload)
      .select();

    if (insertedTxs) {
      setTransactions(prev => [...insertedTxs, ...prev]);
    }
  };

  const payInvoice = async (
    cardId: string,
    month: number,
    year: number,
    accountId: string,
    amount: number,
    paymentDate: string
  ) => {
    if (!user || !supabase) return;

    // 1. Registra pagamento em credit_card_invoices
    await supabase
      .from('credit_card_invoices')
      .upsert({
        user_id: user.id,
        financial_account_id: currentAccount?.id || null,
        credit_card_id: cardId,
        month,
        year,
        closing_date: `${year}-${String(month).padStart(2, '0')}-01`,
        due_date: paymentDate,
        status: 'paid',
        paid_amount: amount
      });

    // 2. Debita da conta corrente selecionada
    await addTransaction({
      account_id: accountId,
      description: `Pagamento Fatura Cartão (${month}/${year})`,
      amount,
      date: paymentDate,
      type: 'expense',
      status: 'completed',
      payment_method: 'credit_card_payment',
      notes: 'Pagamento de fatura de cartão de crédito (fatura baixada online)'
    });
  };

  // Cálculos dinâmicos em memória (re-renderiza com dados do Supabase)
  const accountsWithBalances = calculateAccountBalances(accounts, transactions);

  const cardsWithCalculatedLimits = creditCards.map(card => {
    const cardPurchasesList = cardPurchases.filter(p => p.credit_card_id === card.id);
    const cardPaymentsList = cardPayments.filter(p => p.invoice_id?.startsWith(`inv-${card.id}`));
    const limits = calculateCardLimits(card, cardPurchasesList, cardPaymentsList);
    return {
      ...card,
      committed_limit: limits.committedLimit,
      available_limit: limits.availableLimit,
      used_limit: limits.committedLimit
    };
  });

  const totalCreditCommitted = cardsWithCalculatedLimits.reduce(
    (acc, card) => acc + (card.committed_limit || 0), 0
  );

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
      updateOnboardingStep,
      completeOnboarding,
      hideOnboardingChecklist,
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
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
}
