import { 
  Account, Category, Transaction, Budget, Asset, Liability, 
  CreditCard, CreditCardInvoice, CreditCardPurchase, CreditCardPayment, 
  NetWorthSnapshot, Profile, FinancialAccount, AccountMember, AccountInvite 
} from '@/types/finance';

export const STORAGE_KEYS = {
  CURRENT_USER: 'fin_current_user',
  PROFILES: 'fin_profiles',
  ACCOUNTS: 'fin_accounts',
  CATEGORIES: 'fin_categories',
  TRANSACTIONS: 'fin_transactions',
  BUDGETS: 'fin_budgets',
  ASSETS: 'fin_assets',
  LIABILITIES: 'fin_liabilities',
  CREDIT_CARDS: 'fin_credit_cards',
  CREDIT_CARD_INVOICES: 'fin_card_invoices',
  CREDIT_CARD_PURCHASES: 'fin_card_purchases',
  CREDIT_CARD_PAYMENTS: 'fin_card_payments',
  NET_WORTH_SNAPSHOTS: 'fin_snapshots',
  FINANCIAL_ACCOUNTS: 'fin_family_accounts',
  ACCOUNT_MEMBERS: 'fin_account_members',
  ACCOUNT_INVITES: 'fin_account_invites',
  AUTH_CREDENTIALS: 'fin_auth_credentials'
};

export const DEFAULT_USER_ID = 'demo-user-123';
export const DEFAULT_FINANCIAL_ACCOUNT_ID = 'fa-fam-123';

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id'>[] = [
  // Income
  { name: 'Salário', icon: 'Briefcase', color: '#10b981', type: 'income', is_default: true },
  { name: 'Freelance', icon: 'Laptop', color: '#06b6d4', type: 'income', is_default: true },
  { name: 'Rendimentos', icon: 'TrendingUp', color: '#8b5cf6', type: 'income', is_default: true },
  { name: 'Reembolso', icon: 'Receipt', color: '#64748b', type: 'income', is_default: true },
  { name: 'Outras Receitas', icon: 'PlusCircle', color: '#94a3b8', type: 'income', is_default: true },
  
  // Expense
  { name: 'Supermercado', icon: 'ShoppingCart', color: '#ef4444', type: 'expense', is_default: true },
  { name: 'Restaurante & Delivery', icon: 'Utensils', color: '#f97316', type: 'expense', is_default: true },
  { name: 'Moradia & Aluguel', icon: 'Home', color: '#eab308', type: 'expense', is_default: true },
  { name: 'Energia & Água', icon: 'Zap', color: '#84cc16', type: 'expense', is_default: true },
  { name: 'Internet & Telefone', icon: 'Wifi', color: '#06b6d4', type: 'expense', is_default: true },
  { name: 'Combustível & Transporte', icon: 'Car', color: '#3b82f6', type: 'expense', is_default: true },
  { name: 'Saúde & Farmácia', icon: 'HeartPulse', color: '#ec4899', type: 'expense', is_default: true },
  { name: 'Educação & Cursos', icon: 'GraduationCap', color: '#a855f7', type: 'expense', is_default: true },
  { name: 'Lazer & Viagens', icon: 'Compass', color: '#14b8a6', type: 'expense', is_default: true },
  { name: 'Assinaturas & Streaming', icon: 'Tv', color: '#6366f1', type: 'expense', is_default: true },
  { name: 'Compras & Vestuário', icon: 'ShoppingBag', color: '#d946ef', type: 'expense', is_default: true },
  { name: 'Tarifas & Impostos', icon: 'Landmark', color: '#64748b', type: 'expense', is_default: true },
  { name: 'Outras Despesas', icon: 'MinusCircle', color: '#94a3b8', type: 'expense', is_default: true }
];

export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

// Sync cookie for Next.js middleware and route protection
export function syncAuthCookie(isAuthenticated: boolean): void {
  if (typeof document === 'undefined') return;
  if (isAuthenticated) {
    document.cookie = `fin_auth_session=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } else {
    document.cookie = 'fin_auth_session=; path=/; max-age=0; SameSite=Lax';
  }
}

// User Profile & Authentication persistence
export function getLocalUser(): Profile | null {
  return getItem<Profile | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setLocalUser(profile: Profile | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, profile);
  syncAuthCookie(Boolean(profile));
  if (profile) {
    saveUserProfileToRegistry(profile);
  }
}

export function saveUserProfileToRegistry(profile: Profile): void {
  const profiles = getItem<Record<string, Profile>>(STORAGE_KEYS.PROFILES, {});
  profiles[profile.id] = profile;
  if (profile.email) {
    profiles[profile.email.toLowerCase()] = profile;
  }
  setItem(STORAGE_KEYS.PROFILES, profiles);
}

export function getUserProfileFromRegistry(idOrEmail: string): Profile | null {
  const profiles = getItem<Record<string, Profile>>(STORAGE_KEYS.PROFILES, {});
  return profiles[idOrEmail] || profiles[idOrEmail.toLowerCase()] || null;
}

// Credentials for local / contingency offline authentication
export function saveAuthCredential(email: string, passwordHash: string, userId: string): void {
  const credentials = getItem<Record<string, { passwordHash: string; userId: string }>>(STORAGE_KEYS.AUTH_CREDENTIALS, {});
  credentials[email.toLowerCase().trim()] = { passwordHash, userId };
  setItem(STORAGE_KEYS.AUTH_CREDENTIALS, credentials);
}

export function getAuthCredential(email: string): { passwordHash: string; userId: string } | null {
  const credentials = getItem<Record<string, { passwordHash: string; userId: string }>>(STORAGE_KEYS.AUTH_CREDENTIALS, {});
  return credentials[email.toLowerCase().trim()] || null;
}

// Initialize a brand new clean workspace for a new user
export function initializeNewUser(userId: string, userName: string, userEmail: string): string {
  if (typeof window === 'undefined') return `fa-${userId}`;

  const allMembers = getItem<AccountMember[]>(STORAGE_KEYS.ACCOUNT_MEMBERS, []);
  const existingMember = allMembers.find(m => m.user_id === userId && m.status === 'active');

  if (existingMember) {
    return existingMember.financial_account_id;
  }

  const allFinAccounts = getItem<FinancialAccount[]>(STORAGE_KEYS.FINANCIAL_ACCOUNTS, []);
  const newFinAccId = `fa-${userId}`;

  const newAccount: FinancialAccount = {
    id: newFinAccId,
    name: 'Minha Conta Financeira',
    owner_id: userId,
    created_at: new Date().toISOString()
  };

  const newMember: AccountMember = {
    id: `mem-${userId}`,
    financial_account_id: newFinAccId,
    user_id: userId,
    role: 'owner',
    status: 'active',
    user_name: userName,
    user_email: userEmail,
    created_at: new Date().toISOString()
  };

  setItem(STORAGE_KEYS.FINANCIAL_ACCOUNTS, [...allFinAccounts, newAccount]);
  setItem(STORAGE_KEYS.ACCOUNT_MEMBERS, [...allMembers, newMember]);

  // Create default categories for this user's financial account ONLY
  const existingCategories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  const userCategories: Category[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
    ...cat,
    id: `cat-${userId}-${idx + 1}`,
    user_id: userId,
    financial_account_id: newFinAccId,
    created_at: new Date().toISOString()
  }));
  setItem(STORAGE_KEYS.CATEGORIES, [...existingCategories, ...userCategories]);

  return newFinAccId;
}

// Seed initial data ONLY for the Demo user (carlos@exemplo.com / demo-user-123)
export function initializeSeedData(userId: string = DEFAULT_USER_ID) {
  if (typeof window === 'undefined') return;
  if (userId !== DEFAULT_USER_ID) return; // Strict guard: ONLY seed for demo user

  const existingFinAccounts = getItem<FinancialAccount[]>(STORAGE_KEYS.FINANCIAL_ACCOUNTS, []);
  let demoAccount = existingFinAccounts.find(fa => fa.id === DEFAULT_FINANCIAL_ACCOUNT_ID);

  if (!demoAccount) {
    demoAccount = {
      id: DEFAULT_FINANCIAL_ACCOUNT_ID,
      name: 'Família Silva',
      owner_id: DEFAULT_USER_ID,
      created_at: new Date().toISOString()
    };
    setItem(STORAGE_KEYS.FINANCIAL_ACCOUNTS, [...existingFinAccounts, demoAccount]);
  }

  const finAccId = DEFAULT_FINANCIAL_ACCOUNT_ID;

  // Account Members
  const existingMembers = getItem<AccountMember[]>(STORAGE_KEYS.ACCOUNT_MEMBERS, []);
  let userMembers = existingMembers.filter(m => m.financial_account_id === finAccId);

  if (userMembers.length === 0) {
    userMembers = [
      {
        id: `mem-${DEFAULT_USER_ID}-1`,
        financial_account_id: finAccId,
        user_id: DEFAULT_USER_ID,
        role: 'owner',
        status: 'active',
        user_name: 'Carlos Silva',
        user_email: 'carlos@exemplo.com',
        created_at: new Date().toISOString()
      },
      {
        id: `mem-wife-2`,
        financial_account_id: finAccId,
        user_id: 'user-wife-456',
        role: 'member',
        status: 'active',
        user_name: 'Jaqueline Silva',
        user_email: 'jaqueline@exemplo.com',
        created_at: new Date().toISOString()
      }
    ];
    setItem(STORAGE_KEYS.ACCOUNT_MEMBERS, [...existingMembers, ...userMembers]);
  }

  // Categories
  const existingCategories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  let userCategories = existingCategories.filter(c => c.financial_account_id === finAccId);

  if (userCategories.length === 0) {
    userCategories = DEFAULT_CATEGORIES.map((cat, idx) => ({
      ...cat,
      id: `cat-${DEFAULT_USER_ID}-${idx + 1}`,
      user_id: DEFAULT_USER_ID,
      financial_account_id: finAccId,
      created_at: new Date().toISOString()
    }));
    setItem(STORAGE_KEYS.CATEGORIES, [...existingCategories, ...userCategories]);
  }

  // Accounts
  const existingAccounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
  let userAccounts = existingAccounts.filter(a => a.financial_account_id === finAccId);

  if (userAccounts.length === 0) {
    userAccounts = [
      {
        id: `acc-${DEFAULT_USER_ID}-1`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Conta Corrente (Itaú)',
        type: 'checking',
        initial_balance: 5200.00,
        color: '#f97316',
        icon: 'Landmark',
        is_active: true,
        financial_institution: 'Itaú'
      },
      {
        id: `acc-${DEFAULT_USER_ID}-2`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Reserva de Emergência',
        type: 'savings',
        initial_balance: 18500.00,
        color: '#10b981',
        icon: 'PiggyBank',
        is_active: true,
        financial_institution: 'Nubank'
      },
      {
        id: `acc-${DEFAULT_USER_ID}-3`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Investimentos XP',
        type: 'investment',
        initial_balance: 34000.00,
        color: '#6366f1',
        icon: 'TrendingUp',
        is_active: true,
        financial_institution: 'XP Investimentos'
      },
      {
        id: `acc-${DEFAULT_USER_ID}-4`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Carteira (Dinheiro)',
        type: 'cash',
        initial_balance: 350.00,
        color: '#84cc16',
        icon: 'Wallet',
        is_active: true
      }
    ];
    setItem(STORAGE_KEYS.ACCOUNTS, [...existingAccounts, ...userAccounts]);
  }

  // Credit Cards
  const existingCards = getItem<CreditCard[]>(STORAGE_KEYS.CREDIT_CARDS, []);
  let userCards = existingCards.filter(c => c.financial_account_id === finAccId);

  if (userCards.length === 0) {
    userCards = [
      {
        id: `card-${DEFAULT_USER_ID}-1`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Nubank Violeta',
        issuer: 'Nubank',
        last_four_digits: '1234',
        brand: 'Mastercard Black',
        limit_amount: 8000.00,
        closing_day: 5,
        due_day: 12,
        color: '#8b5cf6',
        is_active: true,
        account_id: `acc-${DEFAULT_USER_ID}-1`
      },
      {
        id: `card-${DEFAULT_USER_ID}-2`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Itaú Personalité',
        issuer: 'Itaú',
        last_four_digits: '5678',
        brand: 'Visa Platinum',
        limit_amount: 6000.00,
        closing_day: 15,
        due_day: 22,
        color: '#f97316',
        is_active: true,
        account_id: `acc-${DEFAULT_USER_ID}-1`
      }
    ];
    setItem(STORAGE_KEYS.CREDIT_CARDS, [...existingCards, ...userCards]);
  }

  // Credit Card Purchases
  const existingPurchases = getItem<CreditCardPurchase[]>(STORAGE_KEYS.CREDIT_CARD_PURCHASES, []);
  let userPurchases = existingPurchases.filter(p => p.financial_account_id === finAccId);

  if (userPurchases.length === 0) {
    const eletrCat = userCategories.find(c => c.name === 'Compras & Vestuário')?.id;
    const marketCat = userCategories.find(c => c.name === 'Supermercado')?.id;
    const uberCat = userCategories.find(c => c.name === 'Combustível & Transporte')?.id;

    for (let i = 1; i <= 12; i++) {
      const d = new Date(2026, 7 + (i - 1), 6);
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const yearStr = d.getFullYear();

      userPurchases.push({
        id: `pur-${DEFAULT_USER_ID}-nb-${i}`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        created_by_name: 'Carlos Silva',
        credit_card_id: `card-${DEFAULT_USER_ID}-1`,
        category_id: eletrCat,
        description: `Notebook Dell Inspiron (${i}/12)`,
        total_amount: 3600.00,
        installment_number: i,
        total_installments: 12,
        installment_amount: 300.00,
        purchase_date: `${yearStr}-${monthStr}-06`
      });
    }

    userPurchases.push(
      {
        id: `pur-${DEFAULT_USER_ID}-1`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        created_by_name: 'Carlos Silva',
        credit_card_id: `card-${DEFAULT_USER_ID}-1`,
        category_id: marketCat,
        description: 'Supermercado Carrefour',
        total_amount: 350.00,
        installment_number: 1,
        total_installments: 1,
        installment_amount: 350.00,
        purchase_date: '2026-08-08'
      },
      {
        id: `pur-${DEFAULT_USER_ID}-2`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: 'user-wife-456',
        created_by_name: 'Jaqueline Silva',
        credit_card_id: `card-${DEFAULT_USER_ID}-1`,
        category_id: uberCat,
        description: 'Uber Reunião',
        total_amount: 42.80,
        installment_number: 1,
        total_installments: 1,
        installment_amount: 42.80,
        purchase_date: '2026-08-10'
      }
    );

    setItem(STORAGE_KEYS.CREDIT_CARD_PURCHASES, [...existingPurchases, ...userPurchases]);
  }

  // Sample Transactions for current month (2026-08)
  const existingTransactions = getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  let userTransactions = existingTransactions.filter(t => t.financial_account_id === finAccId);

  if (userTransactions.length === 0) {
    const salaryCat = userCategories.find(c => c.name === 'Salário')?.id;
    const rentCat = userCategories.find(c => c.name === 'Moradia & Aluguel')?.id;
    const netCat = userCategories.find(c => c.name === 'Internet & Telefone')?.id;
    const energyCat = userCategories.find(c => c.name === 'Energia & Água')?.id;

    userTransactions = [
      {
        id: `tx-${DEFAULT_USER_ID}-1`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        created_by_name: 'Carlos Silva',
        account_id: `acc-${DEFAULT_USER_ID}-1`,
        category_id: salaryCat,
        description: 'Salário Mensal Tech Corp',
        amount: 8500.00,
        date: '2026-08-05',
        type: 'income',
        status: 'completed',
        payment_method: 'pix'
      },
      {
        id: `tx-${DEFAULT_USER_ID}-2`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: 'user-wife-456',
        created_by_name: 'Jaqueline Silva',
        account_id: `acc-${DEFAULT_USER_ID}-1`,
        category_id: rentCat,
        description: 'Aluguel do Apê',
        amount: 2400.00,
        date: '2026-08-08',
        type: 'expense',
        status: 'completed',
        payment_method: 'pix'
      },
      {
        id: `tx-${DEFAULT_USER_ID}-5`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        created_by_name: 'Carlos Silva',
        account_id: `acc-${DEFAULT_USER_ID}-1`,
        category_id: energyCat,
        description: 'Conta de Luz Enel',
        amount: 185.00,
        date: '2026-08-18',
        type: 'expense',
        status: 'planned',
        payment_method: 'boleto'
      },
      {
        id: `tx-${DEFAULT_USER_ID}-6`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: 'user-wife-456',
        created_by_name: 'Jaqueline Silva',
        account_id: `acc-${DEFAULT_USER_ID}-1`,
        category_id: netCat,
        description: 'Internet Fibra 500MB',
        amount: 149.90,
        date: '2026-08-20',
        type: 'expense',
        status: 'planned',
        payment_method: 'pix'
      }
    ];
    setItem(STORAGE_KEYS.TRANSACTIONS, [...existingTransactions, ...userTransactions]);
  }

  // Assets
  const existingAssets = getItem<Asset[]>(STORAGE_KEYS.ASSETS, []);
  let userAssets = existingAssets.filter(a => a.financial_account_id === finAccId);

  if (userAssets.length === 0) {
    userAssets = [
      {
        id: `asset-${DEFAULT_USER_ID}-1`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Veículo Honda Civic 2021',
        type: 'vehicle',
        current_value: 92000.00,
        notes: 'Tabela FIPE atualizada'
      },
      {
        id: `asset-${DEFAULT_USER_ID}-2`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Fundos Imobiliários HGLG11',
        type: 'investment',
        current_value: 15400.00
      }
    ];
    setItem(STORAGE_KEYS.ASSETS, [...existingAssets, ...userAssets]);
  }

  // Liabilities
  const existingLiabilities = getItem<Liability[]>(STORAGE_KEYS.LIABILITIES, []);
  let userLiabilities = existingLiabilities.filter(l => l.financial_account_id === finAccId);

  if (userLiabilities.length === 0) {
    userLiabilities = [
      {
        id: `liab-${DEFAULT_USER_ID}-1`,
        user_id: DEFAULT_USER_ID,
        financial_account_id: finAccId,
        created_by: DEFAULT_USER_ID,
        name: 'Financiamento de Veículo',
        type: 'financing',
        current_value: 24500.00,
        due_date: '2027-12-15',
        notes: 'Restam 22 parcelas de R$ 1.250'
      }
    ];
    setItem(STORAGE_KEYS.LIABILITIES, [...existingLiabilities, ...userLiabilities]);
  }

  // Budgets
  const existingBudgets = getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
  let userBudgets = existingBudgets.filter(b => b.financial_account_id === finAccId);

  if (userBudgets.length === 0) {
    const marketCat = userCategories.find(c => c.name === 'Supermercado')?.id;
    const uberCat = userCategories.find(c => c.name === 'Combustível & Transporte')?.id;
    const restCat = userCategories.find(c => c.name === 'Restaurante & Delivery')?.id;

    if (marketCat) userBudgets.push({ id: `b-1`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, category_id: marketCat, month: 8, year: 2026, amount: 1500.00 });
    if (uberCat) userBudgets.push({ id: `b-2`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, category_id: uberCat, month: 8, year: 2026, amount: 600.00 });
    if (restCat) userBudgets.push({ id: `b-3`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, category_id: restCat, month: 8, year: 2026, amount: 800.00 });

    setItem(STORAGE_KEYS.BUDGETS, [...existingBudgets, ...userBudgets]);
  }

  // Net worth snapshots for history graph
  const existingSnapshots = getItem<NetWorthSnapshot[]>(STORAGE_KEYS.NET_WORTH_SNAPSHOTS, []);
  let userSnapshots = existingSnapshots.filter(s => s.financial_account_id === finAccId);

  if (userSnapshots.length === 0) {
    userSnapshots = [
      { id: `s-1`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, snapshot_date: '2026-03-01', total_assets: 125000, total_liabilities: 32000, net_worth: 93000 },
      { id: `s-2`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, snapshot_date: '2026-04-01', total_assets: 128500, total_liabilities: 30500, net_worth: 98000 },
      { id: `s-3`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, snapshot_date: '2026-05-01', total_assets: 132000, total_liabilities: 29000, net_worth: 103000 },
      { id: `s-4`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, snapshot_date: '2026-06-01', total_assets: 136200, total_liabilities: 27500, net_worth: 108700 },
      { id: `s-5`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, snapshot_date: '2026-07-01', total_assets: 141000, total_liabilities: 26000, net_worth: 115000 },
      { id: `s-6`, user_id: DEFAULT_USER_ID, financial_account_id: finAccId, snapshot_date: '2026-08-01', total_assets: 147450, total_liabilities: 24500, net_worth: 122950 }
    ];
    setItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS, [...existingSnapshots, ...userSnapshots]);
  }
}
