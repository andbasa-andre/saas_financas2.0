import { 
  Account, Category, Transaction, Budget, Asset, Liability, 
  CreditCard, CreditCardInvoice, CreditCardPurchase, CreditCardPayment, 
  NetWorthSnapshot, Profile 
} from '@/types/finance';

const STORAGE_KEYS = {
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
  NET_WORTH_SNAPSHOTS: 'fin_snapshots'
};

const DEFAULT_USER_ID = 'demo-user-123';

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id'>[] = [
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

// User Profile & Authentication simulation for local dev
export function getLocalUser(): Profile | null {
  return getItem<Profile | null>(STORAGE_KEYS.CURRENT_USER, {
    id: DEFAULT_USER_ID,
    name: 'Carlos Silva',
    email: 'carlos@exemplo.com',
    preferences: { theme: 'system', currency: 'BRL' },
    created_at: new Date().toISOString()
  });
}

export function setLocalUser(profile: Profile | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, profile);
}

// Seed initial data if empty
export function initializeSeedData(userId: string = DEFAULT_USER_ID) {
  if (typeof window === 'undefined') return;

  // Categories
  const existingCategories = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  let userCategories = existingCategories.filter(c => c.user_id === userId);

  if (userCategories.length === 0) {
    userCategories = DEFAULT_CATEGORIES.map((cat, idx) => ({
      ...cat,
      id: `cat-${userId}-${idx + 1}`,
      user_id: userId,
      created_at: new Date().toISOString()
    }));
    setItem(STORAGE_KEYS.CATEGORIES, [...existingCategories, ...userCategories]);
  }

  // Accounts
  const existingAccounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
  let userAccounts = existingAccounts.filter(a => a.user_id === userId);

  if (userAccounts.length === 0) {
    userAccounts = [
      {
        id: `acc-${userId}-1`,
        user_id: userId,
        name: 'Conta Corrente (Itaú)',
        type: 'checking',
        initial_balance: 5200.00,
        color: '#f97316',
        icon: 'Landmark',
        is_active: true,
        financial_institution: 'Itaú'
      },
      {
        id: `acc-${userId}-2`,
        user_id: userId,
        name: 'Reserva de Emergência',
        type: 'savings',
        initial_balance: 18500.00,
        color: '#10b981',
        icon: 'PiggyBank',
        is_active: true,
        financial_institution: 'Nubank'
      },
      {
        id: `acc-${userId}-3`,
        user_id: userId,
        name: 'Investimentos XP',
        type: 'investment',
        initial_balance: 34000.00,
        color: '#6366f1',
        icon: 'TrendingUp',
        is_active: true,
        financial_institution: 'XP Investimentos'
      },
      {
        id: `acc-${userId}-4`,
        user_id: userId,
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
  let userCards = existingCards.filter(c => c.user_id === userId);

  if (userCards.length === 0) {
    userCards = [
      {
        id: `card-${userId}-1`,
        user_id: userId,
        name: 'Nubank Violeta',
        issuer: 'Nubank',
        last_four_digits: '1234',
        brand: 'Mastercard Black',
        limit_amount: 8000.00,
        closing_day: 5,
        due_day: 12,
        color: '#8b5cf6',
        is_active: true,
        account_id: `acc-${userId}-1`
      },
      {
        id: `card-${userId}-2`,
        user_id: userId,
        name: 'Itaú Personalité',
        issuer: 'Itaú',
        last_four_digits: '5678',
        brand: 'Visa Platinum',
        limit_amount: 6000.00,
        closing_day: 15,
        due_day: 22,
        color: '#f97316',
        is_active: true,
        account_id: `acc-${userId}-1`
      }
    ];
    setItem(STORAGE_KEYS.CREDIT_CARDS, [...existingCards, ...userCards]);
  }

  // Credit Card Purchases
  const existingPurchases = getItem<CreditCardPurchase[]>(STORAGE_KEYS.CREDIT_CARD_PURCHASES, []);
  let userPurchases = existingPurchases.filter(p => p.user_id === userId);

  if (userPurchases.length === 0) {
    const eletrCat = userCategories.find(c => c.name === 'Compras & Vestuário')?.id;
    const marketCat = userCategories.find(c => c.name === 'Supermercado')?.id;
    const uberCat = userCategories.find(c => c.name === 'Combustível & Transporte')?.id;

    // Sample 12x installment purchase: Notebook R$ 3600 (12x de R$ 300)
    for (let i = 1; i <= 12; i++) {
      const d = new Date(2026, 7 + (i - 1), 6); // Month 8 to Month 19
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const yearStr = d.getFullYear();

      userPurchases.push({
        id: `pur-${userId}-nb-${i}`,
        user_id: userId,
        credit_card_id: `card-${userId}-1`,
        category_id: eletrCat,
        description: `Notebook Dell Inspiron (${i}/12)`,
        total_amount: 3600.00,
        installment_number: i,
        total_installments: 12,
        installment_amount: 300.00,
        purchase_date: `${yearStr}-${monthStr}-06`
      });
    }

    // Single purchases for August invoice (closing 05/09, due 12/09)
    userPurchases.push(
      {
        id: `pur-${userId}-1`,
        user_id: userId,
        credit_card_id: `card-${userId}-1`,
        category_id: marketCat,
        description: 'Supermercado Carrefour',
        total_amount: 350.00,
        installment_number: 1,
        total_installments: 1,
        installment_amount: 350.00,
        purchase_date: '2026-08-08'
      },
      {
        id: `pur-${userId}-2`,
        user_id: userId,
        credit_card_id: `card-${userId}-1`,
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
  let userTransactions = existingTransactions.filter(t => t.user_id === userId);

  if (userTransactions.length === 0) {
    const salaryCat = userCategories.find(c => c.name === 'Salário')?.id;
    const rentCat = userCategories.find(c => c.name === 'Moradia & Aluguel')?.id;
    const netCat = userCategories.find(c => c.name === 'Internet & Telefone')?.id;
    const energyCat = userCategories.find(c => c.name === 'Energia & Água')?.id;

    userTransactions = [
      {
        id: `tx-${userId}-1`,
        user_id: userId,
        account_id: `acc-${userId}-1`,
        category_id: salaryCat,
        description: 'Salário Mensal Tech Corp',
        amount: 8500.00,
        date: '2026-08-05',
        type: 'income',
        status: 'completed',
        payment_method: 'pix'
      },
      {
        id: `tx-${userId}-2`,
        user_id: userId,
        account_id: `acc-${userId}-1`,
        category_id: rentCat,
        description: 'Aluguel do Apê',
        amount: 2400.00,
        date: '2026-08-08',
        type: 'expense',
        status: 'completed',
        payment_method: 'pix'
      },
      {
        id: `tx-${userId}-5`,
        user_id: userId,
        account_id: `acc-${userId}-1`,
        category_id: energyCat,
        description: 'Conta de Luz Enel',
        amount: 185.00,
        date: '2026-08-18',
        type: 'expense',
        status: 'planned',
        payment_method: 'boleto'
      },
      {
        id: `tx-${userId}-6`,
        user_id: userId,
        account_id: `acc-${userId}-1`,
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
  let userAssets = existingAssets.filter(a => a.user_id === userId);

  if (userAssets.length === 0) {
    userAssets = [
      {
        id: `asset-${userId}-1`,
        user_id: userId,
        name: 'Veículo Honda Civic 2021',
        type: 'vehicle',
        current_value: 92000.00,
        notes: 'Tabela FIPE atualizada'
      },
      {
        id: `asset-${userId}-2`,
        user_id: userId,
        name: 'Fundos Imobiliários HGLG11',
        type: 'investment',
        current_value: 15400.00
      }
    ];
    setItem(STORAGE_KEYS.ASSETS, [...existingAssets, ...userAssets]);
  }

  // Liabilities
  const existingLiabilities = getItem<Liability[]>(STORAGE_KEYS.LIABILITIES, []);
  let userLiabilities = existingLiabilities.filter(l => l.user_id === userId);

  if (userLiabilities.length === 0) {
    userLiabilities = [
      {
        id: `liab-${userId}-1`,
        user_id: userId,
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
  let userBudgets = existingBudgets.filter(b => b.user_id === userId);

  if (userBudgets.length === 0) {
    const marketCat = userCategories.find(c => c.name === 'Supermercado')?.id;
    const uberCat = userCategories.find(c => c.name === 'Combustível & Transporte')?.id;
    const restCat = userCategories.find(c => c.name === 'Restaurante & Delivery')?.id;

    if (marketCat) userBudgets.push({ id: `b-1`, user_id: userId, category_id: marketCat, month: 8, year: 2026, amount: 1500.00 });
    if (uberCat) userBudgets.push({ id: `b-2`, user_id: userId, category_id: uberCat, month: 8, year: 2026, amount: 600.00 });
    if (restCat) userBudgets.push({ id: `b-3`, user_id: userId, category_id: restCat, month: 8, year: 2026, amount: 800.00 });

    setItem(STORAGE_KEYS.BUDGETS, [...existingBudgets, ...userBudgets]);
  }

  // Net worth snapshots for history graph
  const existingSnapshots = getItem<NetWorthSnapshot[]>(STORAGE_KEYS.NET_WORTH_SNAPSHOTS, []);
  let userSnapshots = existingSnapshots.filter(s => s.user_id === userId);

  if (userSnapshots.length === 0) {
    userSnapshots = [
      { id: `s-1`, user_id: userId, snapshot_date: '2026-03-01', total_assets: 125000, total_liabilities: 32000, net_worth: 93000 },
      { id: `s-2`, user_id: userId, snapshot_date: '2026-04-01', total_assets: 128500, total_liabilities: 30500, net_worth: 98000 },
      { id: `s-3`, user_id: userId, snapshot_date: '2026-05-01', total_assets: 132000, total_liabilities: 29000, net_worth: 103000 },
      { id: `s-4`, user_id: userId, snapshot_date: '2026-06-01', total_assets: 136200, total_liabilities: 27500, net_worth: 108700 },
      { id: `s-5`, user_id: userId, snapshot_date: '2026-07-01', total_assets: 141000, total_liabilities: 26000, net_worth: 115000 },
      { id: `s-6`, user_id: userId, snapshot_date: '2026-08-01', total_assets: 147450, total_liabilities: 24500, net_worth: 122950 }
    ];
    setItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS, [...existingSnapshots, ...userSnapshots]);
  }
}
