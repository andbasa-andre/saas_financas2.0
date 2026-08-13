export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'planned' | 'completed' | 'cancelled';
export type AccountType = 'checking' | 'savings' | 'cash' | 'investment';
export type AssetType = 'real_estate' | 'vehicle' | 'investment' | 'cash_equivalent' | 'other';
export type LiabilityType = 'loan' | 'financing' | 'debt' | 'other';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type InvoiceStatus = 'open' | 'closed' | 'paid';

export interface Profile {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
  };
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  is_default?: boolean;
  archived?: boolean;
  created_at?: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance?: number;
  color: string;
  icon: string;
  is_active: boolean;
  financial_institution?: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id?: string;
  category_id?: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  competency_date?: string;
  type: TransactionType;
  status: TransactionStatus;
  payment_method?: string;
  notes?: string;
  tags?: string[];
  recurring_transaction_id?: string;
  created_at?: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: FrequencyType;
  day_of_month?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

export interface CreditCard {
  id: string;
  user_id: string;
  account_id?: string;
  name: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
  color: string;
  brand: string;
  used_limit?: number;
}

export interface CreditCardInvoice {
  id: string;
  user_id: string;
  credit_card_id: string;
  month: number;
  year: number;
  closing_date: string;
  due_date: string;
  status: InvoiceStatus;
  paid_amount: number;
  total_amount?: number;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  spent_amount?: number;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  current_value: number;
  notes?: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  type: LiabilityType;
  current_value: number;
  due_date?: string;
  notes?: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

export interface FinancialSummary {
  availableBalance: number;
  monthIncomeCompleted: number;
  monthExpenseCompleted: number;
  monthResultCompleted: number;
  monthIncomePlanned: number;
  monthExpensePlanned: number;
  projectedBalance: number;
  netWorth: number;
  dailySuggestedLimit: number;
  remainingDaysInMonth: number;
}
