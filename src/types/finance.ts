export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'planned' | 'completed' | 'cancelled';
export type AccountType = 'checking' | 'savings' | 'cash' | 'investment';
export type AssetType = 'real_estate' | 'vehicle' | 'investment' | 'cash_equivalent' | 'other';
export type LiabilityType = 'loan' | 'financing' | 'debt' | 'other';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'partially_paid' | 'overdue';
export type MemberRole = 'owner' | 'member';
export type MemberStatus = 'active' | 'invited' | 'suspended';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
  };
  onboarding_completed?: boolean;
  onboarding_step?: number;
  financial_goals?: string[];
  show_onboarding_checklist?: boolean;
  created_at: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface AccountMember {
  id: string;
  financial_account_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  created_at: string;
}

export interface AccountInvite {
  id: string;
  token: string;
  financial_account_id: string;
  created_by: string;
  invited_name?: string;
  invited_phone: string;
  status: 'pending' | 'accepted' | 'expired' | 'canceled';
  expires_at: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  financial_account_id?: string;
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
  financial_account_id?: string;
  created_by?: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance?: number;
  color: string;
  icon: string;
  is_active: boolean;
  financial_institution?: string | null;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  financial_account_id?: string;
  created_by?: string;
  created_by_name?: string;
  account_id?: string;
  destination_account_id?: string;
  credit_card_id?: string;
  category_id?: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  competency_date?: string;
  type: TransactionType;
  status: TransactionStatus;
  payment_method?: string; // 'pix' | 'boleto' | 'credit_card' | 'cash' | 'transfer'
  installment_info?: {
    installment_number: number;
    total_installments: number;
    parent_id?: string;
  };
  notes?: string | null;
  tags?: string[];
  recurring_transaction_id?: string;
  created_at?: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  financial_account_id?: string;
  created_by?: string;
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
  financial_account_id?: string;
  created_by?: string;
  account_id?: string; // Conta padrão para pagamento
  name: string;
  issuer: string;
  last_four_digits: string;
  brand: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
  color: string;
  is_active: boolean;
  used_limit?: number;
  committed_limit?: number;
  available_limit?: number;
}

export interface CreditCardInvoice {
  id: string;
  user_id: string;
  financial_account_id?: string;
  credit_card_id: string;
  month: number;
  year: number;
  period_start: string;
  period_end: string;
  closing_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount?: number;
  status: InvoiceStatus;
}

export interface CreditCardPurchase {
  id: string;
  user_id: string;
  financial_account_id?: string;
  created_by?: string;
  created_by_name?: string;
  credit_card_id: string;
  invoice_id?: string;
  transaction_id?: string;
  category_id?: string;
  description: string;
  total_amount: number;
  installment_number: number;
  total_installments: number;
  installment_amount: number;
  purchase_date: string;
  parent_purchase_id?: string;
  created_at?: string;
}

export interface CreditCardPayment {
  id: string;
  user_id: string;
  financial_account_id?: string;
  created_by?: string;
  invoice_id: string;
  account_id: string;
  amount: number;
  payment_date: string;
  transaction_id?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  financial_account_id?: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  spent_amount?: number;
}

export interface Asset {
  id: string;
  user_id: string;
  financial_account_id?: string;
  created_by?: string;
  name: string;
  type: AssetType;
  current_value: number;
  notes?: string | null;
}

export interface Liability {
  id: string;
  user_id: string;
  financial_account_id?: string;
  created_by?: string;
  name: string;
  type: LiabilityType;
  current_value: number;
  due_date?: string;
  notes?: string | null;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  financial_account_id?: string;
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
  totalCreditCommitted: number;
}
