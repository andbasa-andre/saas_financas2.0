'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Account, Category, Transaction, Budget, Asset, Liability, 
  CreditCard, CreditCardInvoice, CreditCardPurchase, CreditCardPayment, 
  NetWorthSnapshot, Profile, FinancialSummary, FinancialAccount, 
  AccountMember, AccountInvite 
} from '@/types/finance';
import { 
  getItem, setItem, getLocalUser, setLocalUser, 
  saveUserProfileToRegistry, getUserProfileFromRegistry, 
  initializeSeedData, initializeNewUser, 
  DEFAULT_USER_ID, DEFAULT_FINANCIAL_ACCOUNT_ID 
} from '@/lib/storage';
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
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => void;

  // Onboarding Methods
  updateOnboardingStep: (step: number, goals?: string[]) => void;
  completeOnboarding: () => void;
  hideOnboardingChecklist: () => void;

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

  // Initialize Auth & Data Listener
  useEffect(() => {
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    async function init() {
      setIsLoading(true);
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const registered = getUserProfileFromRegistry(session.user.id) || getUserProfileFromRegistry(session.user.email || '');
          const isCompleted = session.user.user_metadata?.onboarding_completed === true || registered?.onboarding_completed === true;
          const currentStep = session.user.user_metadata?.onboarding_step ?? registered?.onboarding_step ?? (isCompleted ? 8 : 1);

          const profile: Profile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || registered?.name || session.user.email?.split('@')[0] || 'Usuário',
            email: session.user.email || '',
            preferences: { theme: 'system', currency: 'BRL' },
            onboarding_completed: isCompleted,
            onboarding_step: currentStep,
            financial_goals: session.user.user_metadata?.financial_goals || registered?.financial_goals || [],
            show_onboarding_checklist: registered?.show_onboarding_checklist ?? true,
            created_at: session.user.created_at
          };
          setUser(profile);
          setLocalUser(profile);
          loadUserData(profile.id, profile.name, profile.email);
        } else {
          setUser(null);
          setLocalUser(null);
        }

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            setLocalUser(null);
          } else if (event === 'SIGNED_IN' && session?.user) {
            const registered = getUserProfileFromRegistry(session.user.id) || getUserProfileFromRegistry(session.user.email || '');
            const isCompleted = session.user.user_metadata?.onboarding_completed === true || registered?.onboarding_completed === true;
            const profile: Profile = {
              id: session.user.id,
              name: session.user.user_metadata?.name || registered?.name || session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              preferences: { theme: 'system', currency: 'BRL' },
              onboarding_completed: isCompleted,
              onboarding_step: session.user.user_metadata?.onboarding_step ?? (isCompleted ? 8 : 1),
              financial_goals: session.user.user_metadata?.financial_goals || registered?.financial_goals || [],
              show_onboarding_checklist: registered?.show_onboarding_checklist ?? true,
              created_at: session.user.created_at
            };
            setUser(profile);
            setLocalUser(profile);
            loadUserData(profile.id, profile.name, profile.email);
          }
        });
        authListener = listener;
      } else {
        const localU = getLocalUser();
        if (localU) {
          setUser(localU);
          loadUserData(localU.id, localU.name, localU.email);
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    init();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
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

  const loadUserData = (userId: string, userName?: string, userEmail?: string) => {
    let allFinAccounts = getItem<FinancialAccount[]>('fin_family_accounts', []);
    let allMembers = getItem<AccountMember[]>('fin_account_members', []);
    const allInvites = getItem<AccountInvite[]>('fin_account_invites', []);

    // Find active membership record for this specific user
    let memberRecord = allMembers.find(m => m.user_id === userId && m.status === 'active');
    let finAccId = memberRecord?.financial_account_id;

    // If user has no membership yet
    if (!finAccId) {
      if (userId === DEFAULT_USER_ID) {
        initializeSeedData(DEFAULT_USER_ID);
        finAccId = DEFAULT_FINANCIAL_ACCOUNT_ID;
      } else {
        finAccId = initializeNewUser(userId, userName || 'Usuário', userEmail || '');
      }
      allFinAccounts = getItem<FinancialAccount[]>('fin_family_accounts', []);
      allMembers = getItem<AccountMember[]>('fin_account_members', []);
      memberRecord = allMembers.find(m => m.user_id === userId && m.status === 'active');
    }

    const currentFinAccount = allFinAccounts.find(fa => fa.id === finAccId) || {
      id: finAccId,
      name: 'Minha Conta Financeira',
      owner_id: userId,
      created_at: new Date().toISOString()
    };

    setCurrentAccount(currentFinAccount);

    const activeMembers = allMembers.filter(m => m.financial_account_id === finAccId && m.status === 'active');
    setAccountMembers(activeMembers);

    const activeInvites = allInvites.filter(i => i.financial_account_id === finAccId);
    setAccountInvites(activeInvites);

    // Load financial data STRICTLY for this financial_account_id
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

    setAccounts(allAccounts.filter(a => a.financial_account_id === finAccId));
    setCategories(allCategories.filter(c => c.financial_account_id === finAccId));
    setTransactions(allTransactions.filter(t => t.financial_account_id === finAccId));
    setBudgets(allBudgets.filter(b => b.financial_account_id === finAccId));
    setAssets(allAssets.filter(a => a.financial_account_id === finAccId));
    setLiabilities(allLiabilities.filter(l => l.financial_account_id === finAccId));
    setCreditCards(allCards.filter(c => c.financial_account_id === finAccId));
    setCardPurchases(allPurchases.filter(p => p.financial_account_id === finAccId));
    setCardPayments(allPayments.filter(pay => pay.financial_account_id === finAccId));
    setSnapshots(allSnapshots.filter(s => s.financial_account_id === finAccId));
  };

  const setPeriod = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Auth Functions
  const login = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
      if (error || !data.user) return false;

      const registered = getUserProfileFromRegistry(data.user.id) || getUserProfileFromRegistry(cleanEmail);
      const isCompleted = data.user.user_metadata?.onboarding_completed === true || registered?.onboarding_completed === true;
      const currentStep = data.user.user_metadata?.onboarding_step ?? registered?.onboarding_step ?? (isCompleted ? 8 : 1);

      const profile: Profile = {
        id: data.user.id,
        name: data.user.user_metadata?.name || registered?.name || cleanEmail.split('@')[0] || 'Usuário',
        email: data.user.email || cleanEmail,
        preferences: { theme: 'system', currency: 'BRL' },
        onboarding_completed: isCompleted,
        onboarding_step: currentStep,
        financial_goals: data.user.user_metadata?.financial_goals || registered?.financial_goals || [],
        show_onboarding_checklist: registered?.show_onboarding_checklist ?? true,
        created_at: data.user.created_at
      };
      setUser(profile);
      setLocalUser(profile);
      loadUserData(profile.id, profile.name, profile.email);
      return true;
    } else {
      // Local development or offline mode
      const registered = getUserProfileFromRegistry(cleanEmail);

      let profile: Profile;
      if (registered) {
        profile = registered;
      } else if (cleanEmail === 'carlos@exemplo.com' || cleanEmail === 'demo') {
        profile = {
          id: DEFAULT_USER_ID,
          name: 'Carlos Silva',
          email: 'carlos@exemplo.com',
          preferences: { theme: 'system', currency: 'BRL' },
          onboarding_completed: true,
          onboarding_step: 8,
          show_onboarding_checklist: true,
          created_at: new Date().toISOString()
        };
      } else {
        const newUserId = `user-${Date.now()}`;
        profile = {
          id: newUserId,
          name: capitalizeFirstLetter(cleanEmail.split('@')[0]) || 'Usuário',
          email: cleanEmail,
          preferences: { theme: 'system', currency: 'BRL' },
          onboarding_completed: false,
          onboarding_step: 1,
          show_onboarding_checklist: true,
          created_at: new Date().toISOString()
        };
      }

      setUser(profile);
      setLocalUser(profile);
      loadUserData(profile.id, profile.name, profile.email);
      return true;
    }
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = capitalizeFirstLetter(name);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { data: { name: cleanName, onboarding_completed: false, onboarding_step: 1 } }
      });
      if (error || !data.user) return false;
      const profile: Profile = {
        id: data.user.id,
        name: cleanName,
        email: cleanEmail,
        preferences: { theme: 'system', currency: 'BRL' },
        onboarding_completed: false,
        onboarding_step: 1,
        show_onboarding_checklist: true,
        created_at: data.user.created_at
      };
      setUser(profile);
      setLocalUser(profile);
      loadUserData(profile.id, profile.name, profile.email);
      return true;
    } else {
      const newUserId = `user-${Date.now()}`;
      const profile: Profile = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        preferences: { theme: 'system', currency: 'BRL' },
        onboarding_completed: false,
        onboarding_step: 1,
        show_onboarding_checklist: true,
        created_at: new Date().toISOString()
      };
      setUser(profile);
      setLocalUser(profile);
      loadUserData(profile.id, profile.name, profile.email);
      return true;
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setLocalUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fin_current_user');
        // Clear supabase auth tokens if stored in localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        window.location.replace('/');
      }
    }
  };

  const updateProfile = (data: Partial<Profile>) => {
    if (!user) return;
    const formattedData = {
      ...data,
      name: data.name ? capitalizeFirstLetter(data.name) : user.name
    };
    const updated = { ...user, ...formattedData };
    setUser(updated);
    setLocalUser(updated);
  };

  // Onboarding Methods
  const updateOnboardingStep = (step: number, goals?: string[]) => {
    if (!user) return;
    const updated: Profile = {
      ...user,
      onboarding_step: step,
      financial_goals: goals || user.financial_goals
    };
    setUser(updated);
    setLocalUser(updated);

    if (isSupabaseConfigured && supabase) {
      supabase.auth.updateUser({
        data: { onboarding_step: step, financial_goals: goals || user.financial_goals }
      });
    }
  };

  const completeOnboarding = () => {
    if (!user) return;
    const updated: Profile = {
      ...user,
      onboarding_completed: true,
      onboarding_step: 8,
      show_onboarding_checklist: true
    };
    setUser(updated);
    setLocalUser(updated);

    if (isSupabaseConfigured && supabase) {
      supabase.auth.updateUser({
        data: { onboarding_completed: true, onboarding_step: 8 }
      });
    }
  };

  const hideOnboardingChecklist = () => {
    if (!user) return;
    const updated: Profile = {
      ...user,
      show_onboarding_checklist: false
    };
    setUser(updated);
    setLocalUser(updated);
  };

  // WhatsApp Invite creation with stateless URL-safe token
  const createWhatsAppInvite = (phone: string, invitedName?: string): string => {
    if (!user || !currentAccount) return '';

    const formattedInvitedName = invitedName ? capitalizeFirstLetter(invitedName) : undefined;
    const token = generateInviteToken({
      accId: currentAccount.id,
      accName: currentAccount.name,
      ownerId: user.id,
      ownerName: user.name,
      phone: phone,
      invitedName: formattedInvitedName,
      expiresInDays: 30
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const newInvite: AccountInvite = {
      id: `inv-${Date.now()}`,
      token,
      financial_account_id: currentAccount.id,
      created_by: user.id,
      invited_name: formattedInvitedName,
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

    return createWhatsAppShareUrl(phone, inviteUrl, currentAccount.name, formattedInvitedName);
  };

  const acceptInviteToken = async (token: string): Promise<boolean> => {
    if (!user) return false;

    // 1. Try decoding stateless self-contained token first
    const decoded = decodeInviteToken(token);
    if (decoded.isValid) {
      if (decoded.isExpired) {
        return false;
      }

      const targetAccId = decoded.accId!;
      const targetAccName = decoded.accName!;
      const targetOwnerId = decoded.ownerId || user.id;

      // Ensure the financial account exists in storage
      const allFinAccounts = getItem<FinancialAccount[]>('fin_family_accounts', []);
      const existingAcc = allFinAccounts.find(fa => fa.id === targetAccId);
      if (!existingAcc) {
        const newAcc: FinancialAccount = {
          id: targetAccId,
          name: targetAccName,
          owner_id: targetOwnerId,
          created_at: new Date().toISOString()
        };
        setItem('fin_family_accounts', [...allFinAccounts, newAcc]);
      }

      // Bind user to financial account as member
      const allMembers = getItem<AccountMember[]>('fin_account_members', []);
      const alreadyMember = allMembers.some(m => m.financial_account_id === targetAccId && m.user_id === user.id);

      if (!alreadyMember) {
        const newMember: AccountMember = {
          id: `mem-${Date.now()}`,
          financial_account_id: targetAccId,
          user_id: user.id,
          role: 'member',
          status: 'active',
          user_name: user.name,
          user_email: user.email,
          created_at: new Date().toISOString()
        };
        setItem('fin_account_members', [...allMembers, newMember]);
      }

      loadUserData(user.id, user.name, user.email);
      return true;
    }

    // 2. Fallback to legacy local storage invites
    const allInvites = getItem<AccountInvite[]>('fin_account_invites', []);
    const invite = allInvites.find(i => i.token === token && i.status === 'pending');

    if (!invite) return false;

    if (new Date(invite.expires_at) < new Date()) {
      return false;
    }

    const updatedInvites = allInvites.map(i => 
      i.token === token ? { ...i, status: 'accepted' as const, accepted_by: user.id } : i
    );
    setItem('fin_account_invites', updatedInvites);

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

    loadUserData(user.id, user.name, user.email);
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
    loadUserData(user.id, user.name, user.email);
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };

  const updateFinancialAccountName = (newName: string) => {
    if (!currentAccount) return;
    const formattedName = capitalizeFirstLetter(newName);
    const allFinAccounts = getItem<FinancialAccount[]>('fin_family_accounts', []);
    const updated = allFinAccounts.map(fa => fa.id === currentAccount.id ? { ...fa, name: formattedName } : fa);
    setItem('fin_family_accounts', updated);
    setCurrentAccount(prev => prev ? { ...prev, name: formattedName } : null);
  };

  // CRUD Implementations with auto-capitalization of text descriptions & names
  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user || !currentAccount) return;
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      user_id: user.id,
      financial_account_id: currentAccount.id,
      created_by: user.id,
      created_by_name: user.name,
      description: capitalizeFirstLetter(tx.description),
      notes: tx.notes ? capitalizeFirstLetter(tx.notes) : undefined,
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
    const updatedAll = all.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updatedFields,
          description: updatedFields.description !== undefined ? capitalizeFirstLetter(updatedFields.description) : t.description,
          notes: updatedFields.notes !== undefined ? (updatedFields.notes ? capitalizeFirstLetter(updatedFields.notes) : undefined) : t.notes
        };
      }
      return t;
    });
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
      created_by: user.id,
      name: capitalizeFirstLetter(acc.name),
      financial_institution: acc.financial_institution ? capitalizeFirstLetter(acc.financial_institution) : undefined
    };
    const all = getItem<Account[]>('fin_accounts', []);
    const updatedAll = [...all, newAcc];
    setItem('fin_accounts', updatedAll);
    setAccounts(updatedAll.filter(a => a.financial_account_id === currentAccount.id));
  };

  const updateAccount = (id: string, accFields: Partial<Account>) => {
    if (!user || !currentAccount) return;
    const all = getItem<Account[]>('fin_accounts', []);
    const updatedAll = all.map(a => {
      if (a.id === id) {
        return {
          ...a,
          ...accFields,
          name: accFields.name !== undefined ? capitalizeFirstLetter(accFields.name) : a.name,
          financial_institution: accFields.financial_institution !== undefined ? (accFields.financial_institution ? capitalizeFirstLetter(accFields.financial_institution) : undefined) : a.financial_institution
        };
      }
      return a;
    });
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
      financial_account_id: currentAccount.id,
      name: capitalizeFirstLetter(cat.name)
    };
    const all = getItem<Category[]>('fin_categories', []);
    const updatedAll = [...all, newCat];
    setItem('fin_categories', updatedAll);
    setCategories(updatedAll.filter(c => c.financial_account_id === currentAccount.id));
  };

  const updateCategory = (id: string, catFields: Partial<Category>) => {
    if (!user || !currentAccount) return;
    const all = getItem<Category[]>('fin_categories', []);
    const updatedAll = all.map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...catFields,
          name: catFields.name !== undefined ? capitalizeFirstLetter(catFields.name) : c.name
        };
      }
      return c;
    });
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
      b => b.financial_account_id === currentAccount.id && b.category_id === categoryId && b.month === selectedMonth && b.year === selectedYear
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
    const newAsset: Asset = { 
      ...asset, 
      id: `asset-${Date.now()}`, 
      user_id: user.id, 
      financial_account_id: currentAccount.id, 
      created_by: user.id,
      name: capitalizeFirstLetter(asset.name),
      notes: asset.notes ? capitalizeFirstLetter(asset.notes) : undefined
    };
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
    const newLiab: Liability = { 
      ...liability, 
      id: `liab-${Date.now()}`, 
      user_id: user.id, 
      financial_account_id: currentAccount.id, 
      created_by: user.id,
      name: capitalizeFirstLetter(liability.name),
      notes: liability.notes ? capitalizeFirstLetter(liability.notes) : undefined
    };
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
      created_by: user.id,
      name: capitalizeFirstLetter(card.name),
      issuer: card.issuer ? capitalizeFirstLetter(card.issuer) : (card.brand ? capitalizeFirstLetter(card.brand) : 'Cartão')
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

    const formattedDesc = capitalizeFirstLetter(description);

    const generated = generateInstallmentPurchases(
      card,
      formattedDesc,
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
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
