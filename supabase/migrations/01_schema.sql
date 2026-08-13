-- =========================================================
-- SISTEMA DE CONTROLE FINANCEIRO PESSOAL - SUPABASE DDL & RLS
-- =========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    preferences JSONB DEFAULT '{"theme": "system", "currency": "BRL"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 2. CATEGORIES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#64748b',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 3. ACCOUNTS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'cash', 'investment')),
    initial_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    color TEXT NOT NULL DEFAULT '#0284c7',
    icon TEXT NOT NULL DEFAULT 'Landmark',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    financial_institution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 4. RECURRING TRANSACTIONS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    day_of_month INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 5. TRANSACTIONS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    competency_date DATE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned', 'completed', 'cancelled')),
    payment_method TEXT DEFAULT 'pix',
    notes TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    recurring_transaction_id UUID REFERENCES public.recurring_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 6. CREDIT CARDS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    limit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color TEXT NOT NULL DEFAULT '#6366f1',
    brand TEXT NOT NULL DEFAULT 'Mastercard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 7. CREDIT CARD INVOICES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_card_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
    paid_amount DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 8. BUDGETS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, month, year)
);

-- ---------------------------------------------------------
-- 9. ASSETS (Patrimônio - Ativos)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('real_estate', 'vehicle', 'investment', 'cash_equivalent', 'other')),
    current_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 10. LIABILITIES (Patrimônio - Passivos / Dívidas)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('loan', 'financing', 'debt', 'other')),
    current_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 11. NET WORTH SNAPSHOTS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_assets DECIMAL(12, 2) NOT NULL,
    total_liabilities DECIMAL(12, 2) NOT NULL,
    net_worth DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- ---------------------------------------------------------
-- 12. AUTOMATION RULES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 13. WHATSAPP MESSAGES LOG
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    raw_message TEXT NOT NULL,
    parsed_payload JSONB,
    status TEXT NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'confirmed', 'failed', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- POLÍTICAS DE RLS (CRÍTICO: ISOLAMENTO TOTAL POR USER_ID)
-- (Usando DROP POLICY IF EXISTS para ser 100% idempotente)
-- =========================================================

-- Profiles
DROP POLICY IF EXISTS "user_profiles_policy" ON public.profiles;
CREATE POLICY "user_profiles_policy" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "user_categories_policy" ON public.categories;
CREATE POLICY "user_categories_policy" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Accounts
DROP POLICY IF EXISTS "user_accounts_policy" ON public.accounts;
CREATE POLICY "user_accounts_policy" ON public.accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recurring Transactions
DROP POLICY IF EXISTS "user_recurring_policy" ON public.recurring_transactions;
CREATE POLICY "user_recurring_policy" ON public.recurring_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "user_transactions_policy" ON public.transactions;
CREATE POLICY "user_transactions_policy" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Credit Cards
DROP POLICY IF EXISTS "user_credit_cards_policy" ON public.credit_cards;
CREATE POLICY "user_credit_cards_policy" ON public.credit_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Credit Card Invoices
DROP POLICY IF EXISTS "user_invoices_policy" ON public.credit_card_invoices;
CREATE POLICY "user_invoices_policy" ON public.credit_card_invoices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Budgets
DROP POLICY IF EXISTS "user_budgets_policy" ON public.budgets;
CREATE POLICY "user_budgets_policy" ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Assets
DROP POLICY IF EXISTS "user_assets_policy" ON public.assets;
CREATE POLICY "user_assets_policy" ON public.assets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Liabilities
DROP POLICY IF EXISTS "user_liabilities_policy" ON public.liabilities;
CREATE POLICY "user_liabilities_policy" ON public.liabilities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Net Worth Snapshots
DROP POLICY IF EXISTS "user_snapshots_policy" ON public.net_worth_snapshots;
CREATE POLICY "user_snapshots_policy" ON public.net_worth_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Automation Rules
DROP POLICY IF EXISTS "user_automation_policy" ON public.automation_rules;
CREATE POLICY "user_automation_policy" ON public.automation_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- WhatsApp Messages
DROP POLICY IF EXISTS "user_whatsapp_policy" ON public.whatsapp_messages;
CREATE POLICY "user_whatsapp_policy" ON public.whatsapp_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- TRIGGER: CRIAÇÃO AUTOMÁTICA DE PERFIL E CATEGORIAS PADRÃO
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir Perfil
    INSERT INTO public.profiles (id, name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'), NEW.email);

    -- Inserir Categorias Padrão (Entradas)
    INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (NEW.id, 'Salário', 'Briefcase', '#10b981', 'income', true),
    (NEW.id, 'Freelance', 'Laptop', '#06b6d4', 'income', true),
    (NEW.id, 'Rendimentos', 'TrendingUp', '#8b5cf6', 'income', true),
    (NEW.id, 'Reembolso', 'Receipt', '#64748b', 'income', true),
    (NEW.id, 'Outras Receitas', 'PlusCircle', '#94a3b8', 'income', true);

    -- Inserir Categorias Padrão (Saídas)
    INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (NEW.id, 'Supermercado', 'ShoppingCart', '#ef4444', 'expense', true),
    (NEW.id, 'Restaurante & Delivery', 'Utensils', '#f97316', 'expense', true),
    (NEW.id, 'Moradia & Aluguel', 'Home', '#eab308', 'expense', true),
    (NEW.id, 'Energia & Água', 'Zap', '#84cc16', 'expense', true),
    (NEW.id, 'Internet & Telefone', 'Wifi', '#06b6d4', 'expense', true),
    (NEW.id, 'Combustível & Transporte', 'Car', '#3b82f6', 'expense', true),
    (NEW.id, 'Saúde & Farmácia', 'HeartPulse', '#ec4899', 'expense', true),
    (NEW.id, 'Educação & Cursos', 'GraduationCap', '#a855f7', 'expense', true),
    (NEW.id, 'Lazer & Viagens', 'Compass', '#14b8a6', 'expense', true),
    (NEW.id, 'Assinaturas & Streaming', 'Tv', '#6366f1', 'expense', true),
    (NEW.id, 'Compras & Vestuário', 'ShoppingBag', '#d946ef', 'expense', true),
    (NEW.id, 'Tarifas & Impostos', 'Landmark', '#64748b', 'expense', true),
    (NEW.id, 'Outras Despesas', 'MinusCircle', '#94a3b8', 'expense', true);

    -- Inserir Conta Inicial Padrão
    INSERT INTO public.accounts (user_id, name, type, initial_balance, color, icon)
    VALUES (NEW.id, 'Conta Principal', 'checking', 0.00, '#0284c7', 'Wallet');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar trigger ao evento AFTER INSERT em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
