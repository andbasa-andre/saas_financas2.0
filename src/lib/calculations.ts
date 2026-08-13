import { Account, Transaction, Asset, Liability, FinancialSummary, Category, Budget } from '@/types/finance';

export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Account[] {
  return accounts.map(account => {
    let balance = Number(account.initial_balance) || 0;

    const accountTxs = transactions.filter(
      t => t.status === 'completed' && (t.account_id === account.id || t.destination_account_id === account.id)
    );

    accountTxs.forEach(tx => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income' && tx.account_id === account.id) {
        balance += amount;
      } else if (tx.type === 'expense' && tx.account_id === account.id) {
        balance -= amount;
      } else if (tx.type === 'transfer') {
        if (tx.account_id === account.id) {
          balance -= amount; // Source account debited
        }
        if (tx.destination_account_id === account.id) {
          balance += amount; // Destination account credited
        }
      }
    });

    return {
      ...account,
      current_balance: Math.round(balance * 100) / 100
    };
  });
}

export function calculateFinancialSummary(
  accounts: Account[],
  transactions: Transaction[],
  assets: Asset[],
  liabilities: Liability[],
  selectedYear: number,
  selectedMonth: number // 1 to 12
): FinancialSummary {
  const updatedAccounts = calculateAccountBalances(accounts, transactions);
  const activeAccounts = updatedAccounts.filter(a => a.is_active);
  const availableBalance = activeAccounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

  // Month filtering string YYYY-MM
  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const monthTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.startsWith(monthStr);
  });

  let monthIncomeCompleted = 0;
  let monthExpenseCompleted = 0;
  let monthIncomePlanned = 0;
  let monthExpensePlanned = 0;

  monthTransactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      if (t.status === 'completed') monthIncomeCompleted += amt;
      else if (t.status === 'planned') monthIncomePlanned += amt;
    } else if (t.type === 'expense') {
      if (t.status === 'completed') monthExpenseCompleted += amt;
      else if (t.status === 'planned') monthExpensePlanned += amt;
    }
  });

  const monthResultCompleted = monthIncomeCompleted - monthExpenseCompleted;
  const projectedBalance = availableBalance + monthIncomePlanned - monthExpensePlanned;

  // Net worth calculation
  const totalFinancialAssets = availableBalance;
  const totalOtherAssets = assets.reduce((acc, a) => acc + (Number(a.current_value) || 0), 0);
  const totalAssets = totalFinancialAssets + totalOtherAssets;

  const totalLiabilities = liabilities.reduce((acc, l) => acc + (Number(l.current_value) || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Remaining days in month calculation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let remainingDaysInMonth = 30;
  if (selectedYear === currentYear && selectedMonth === currentMonth) {
    const today = now.getDate();
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    remainingDaysInMonth = Math.max(1, daysInMonth - today + 1);
  } else {
    remainingDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  }

  // Daily suggested limit formula:
  // (Available balance + planned remaining income - planned remaining expense) / remaining days
  const remainingBudgetPool = projectedBalance;
  const dailySuggestedLimit = Math.max(0, Math.round((remainingBudgetPool / remainingDaysInMonth) * 100) / 100);

  return {
    availableBalance: Math.round(availableBalance * 100) / 100,
    monthIncomeCompleted: Math.round(monthIncomeCompleted * 100) / 100,
    monthExpenseCompleted: Math.round(monthExpenseCompleted * 100) / 100,
    monthResultCompleted: Math.round(monthResultCompleted * 100) / 100,
    monthIncomePlanned: Math.round(monthIncomePlanned * 100) / 100,
    monthExpensePlanned: Math.round(monthExpensePlanned * 100) / 100,
    projectedBalance: Math.round(projectedBalance * 100) / 100,
    netWorth: Math.round(netWorth * 100) / 100,
    dailySuggestedLimit,
    remainingDaysInMonth
  };
}

export function autoCategorizeDescription(
  description: string,
  categories: Category[]
): string | undefined {
  const descLower = description.toLowerCase();
  
  const rules: { keywords: string[]; categoryName: string }[] = [
    { keywords: ['uber', '99', 'cabify', 'posto', 'gasolina', 'combustivel', 'shell', 'ipiranga'], categoryName: 'Combustível & Transporte' },
    { keywords: ['supermercado', 'carrefour', 'pao de acucar', 'extra', 'assai', 'atacadao', 'hortifruti', 'mercado'], categoryName: 'Supermercado' },
    { keywords: ['restaurant', 'outback', 'mcdonald', 'burger', 'ifood', 'rappi', 'pizzaria', 'sushi'], categoryName: 'Restaurante & Delivery' },
    { keywords: ['netflix', 'spotify', 'prime', 'disney', 'hbomax', 'apple.com', 'youtube'], categoryName: 'Assinaturas & Streaming' },
    { keywords: ['luz', 'enel', 'cpfl', 'sabesp', 'agua', 'energia'], categoryName: 'Energia & Água' },
    { keywords: ['internet', 'vivo', 'claro', 'tim', 'oi', 'fibra'], categoryName: 'Internet & Telefone' },
    { keywords: ['drogasil', 'droga raia', 'pague menos', 'farmacia', 'remedio', 'consulta', 'exame'], categoryName: 'Saúde & Farmácia' },
    { keywords: ['aluguel', 'condominio', 'iptu'], categoryName: 'Moradia & Aluguel' },
    { keywords: ['salario', 'pagamento', 'provento', 'pix recebido'], categoryName: 'Salário' }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(kw => descLower.includes(kw))) {
      const match = categories.find(c => c.name.toLowerCase() === rule.categoryName.toLowerCase());
      if (match) return match.id;
    }
  }

  return undefined;
}
