-- ==============================================================================
-- MIGRATION 03: SINCRONIZAÇÃO COMPLETA SUPABASE 100% ONLINE (CORREÇÃO DE RLS)
-- ==============================================================================

-- 1. Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Atualizar tabela de PROFILES com campos de Onboarding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS financial_goals TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_onboarding_checklist BOOLEAN DEFAULT TRUE;

-- 3. Criar Contas Compartilhadas (Família), Membros e Convites
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Minha Família',
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(financial_account_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.account_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    financial_account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_name TEXT,
    invited_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Criar tabela de Compras Parceladas de Cartão de Crédito
CREATE TABLE IF NOT EXISTS public.credit_card_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    installments_count INTEGER NOT NULL DEFAULT 1,
    purchase_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Atualizar Colunas de TRANSACTIONS
ALTER TABLE public.transactions ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installment_number INTEGER;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS total_installments INTEGER;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL;

-- 6. Adicionar financial_account_id nas demais tabelas
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.credit_card_invoices ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.net_worth_snapshots ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE;

-- 7. Função de Apoio SECURITY DEFINER (evita recursão infinita no RLS)
CREATE OR REPLACE FUNCTION public.is_account_member(fin_id UUID, check_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_members
    WHERE financial_account_id = fin_id
      AND user_id = check_uid
      AND status = 'active'
  );
$$;

-- 8. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- 9. Políticas de RLS Sem Recursão
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
CREATE POLICY "profiles_policy" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "financial_accounts_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_policy" ON public.financial_accounts FOR ALL 
USING (
    owner_id = auth.uid() OR 
    public.is_account_member(id, auth.uid())
)
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "account_members_policy" ON public.account_members;
CREATE POLICY "account_members_policy" ON public.account_members FOR ALL 
USING (
    user_id = auth.uid() OR
    public.is_account_member(financial_account_id, auth.uid())
);

DROP POLICY IF EXISTS "transactions_policy" ON public.transactions;
CREATE POLICY "transactions_policy" ON public.transactions FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "accounts_policy" ON public.accounts;
CREATE POLICY "accounts_policy" ON public.accounts FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "categories_policy" ON public.categories;
CREATE POLICY "categories_policy" ON public.categories FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "credit_cards_policy" ON public.credit_cards;
CREATE POLICY "credit_cards_policy" ON public.credit_cards FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "credit_card_purchases_policy" ON public.credit_card_purchases;
CREATE POLICY "credit_card_purchases_policy" ON public.credit_card_purchases FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "credit_card_invoices_policy" ON public.credit_card_invoices;
CREATE POLICY "credit_card_invoices_policy" ON public.credit_card_invoices FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "budgets_policy" ON public.budgets;
CREATE POLICY "budgets_policy" ON public.budgets FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "assets_policy" ON public.assets;
CREATE POLICY "assets_policy" ON public.assets FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "liabilities_policy" ON public.liabilities;
CREATE POLICY "liabilities_policy" ON public.liabilities FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "snapshots_policy" ON public.net_worth_snapshots;
CREATE POLICY "snapshots_policy" ON public.net_worth_snapshots FOR ALL 
USING (
    user_id = auth.uid() OR
    (financial_account_id IS NOT NULL AND public.is_account_member(financial_account_id, auth.uid()))
)
WITH CHECK (user_id = auth.uid());

-- 10. Trigger automático: cria Perfil, Conta Familiar e Categorias Padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_fin_acc_id UUID;
BEGIN
    INSERT INTO public.profiles (id, name, email, onboarding_completed, onboarding_step)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
        NEW.email,
        FALSE,
        1
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email;

    INSERT INTO public.financial_accounts (name, owner_id)
    VALUES ('Minhas Finanças', NEW.id)
    RETURNING id INTO new_fin_acc_id;

    INSERT INTO public.account_members (financial_account_id, user_id, role, status)
    VALUES (new_fin_acc_id, NEW.id, 'owner', 'active')
    ON CONFLICT (financial_account_id, user_id) DO NOTHING;

    INSERT INTO public.categories (user_id, financial_account_id, name, icon, color, type, is_default) VALUES
    (NEW.id, new_fin_acc_id, 'Salário', 'Briefcase', '#10b981', 'income', true),
    (NEW.id, new_fin_acc_id, 'Freelance', 'Laptop', '#06b6d4', 'income', true),
    (NEW.id, new_fin_acc_id, 'Rendimentos', 'TrendingUp', '#8b5cf6', 'income', true),
    (NEW.id, new_fin_acc_id, 'Reembolso', 'Receipt', '#64748b', 'income', true),
    (NEW.id, new_fin_acc_id, 'Outras Receitas', 'PlusCircle', '#94a3b8', 'income', true);

    INSERT INTO public.categories (user_id, financial_account_id, name, icon, color, type, is_default) VALUES
    (NEW.id, new_fin_acc_id, 'Supermercado', 'ShoppingCart', '#ef4444', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Restaurante & Delivery', 'Utensils', '#f97316', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Moradia & Aluguel', 'Home', '#eab308', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Energia & Água', 'Zap', '#84cc16', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Internet & Telefone', 'Wifi', '#06b6d4', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Combustível & Transporte', 'Car', '#3b82f6', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Saúde & Farmácia', 'HeartPulse', '#ec4899', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Educação & Cursos', 'GraduationCap', '#a855f7', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Lazer & Viagens', 'Compass', '#14b8a6', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Assinaturas & Streaming', 'Tv', '#6366f1', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Compras & Vestuário', 'ShoppingBag', '#d946ef', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Tarifas & Impostos', 'Landmark', '#64748b', 'expense', true),
    (NEW.id, new_fin_acc_id, 'Outras Despesas', 'MinusCircle', '#94a3b8', 'expense', true);

    INSERT INTO public.accounts (user_id, financial_account_id, name, type, initial_balance, color, icon)
    VALUES (NEW.id, new_fin_acc_id, 'Conta Principal', 'checking', 0.00, '#0284c7', 'Landmark');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
