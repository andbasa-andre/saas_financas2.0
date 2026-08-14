-- ==============================================================================
-- MIGRATION 02: CONTAS FINANCEIRAS COMPARTILHADAS (FAMÍLIA), MEMBROS E RLS
-- ==============================================================================

-- 1. Tabela de Contas Financeiras Compartilhadas (ex: "Família Barbosa")
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Minha Conta Financeira',
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Associação de Membros
CREATE TABLE IF NOT EXISTS public.account_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(financial_account_id, user_id)
);

-- 3. Tabela de Convites via WhatsApp / Token Único
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

-- Indices para performance de busca por membro
CREATE INDEX IF NOT EXISTS idx_account_members_user_id ON public.account_members(user_id);
CREATE INDEX IF NOT EXISTS idx_account_members_fin_account_id ON public.account_members(financial_account_id);
CREATE INDEX IF NOT EXISTS idx_account_invites_token ON public.account_invites(token);

-- Enable RLS em todas as tabelas
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_invites ENABLE ROW LEVEL SECURITY;

-- Politicas para financial_accounts
DROP POLICY IF EXISTS "financial_accounts_member_policy" ON public.financial_accounts;
CREATE POLICY "financial_accounts_member_policy" ON public.financial_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.account_members am
            WHERE am.financial_account_id = public.financial_accounts.id
              AND am.user_id = auth.uid()
              AND am.status = 'active'
        )
    );

-- Politicas para account_members
DROP POLICY IF EXISTS "account_members_access_policy" ON public.account_members;
CREATE POLICY "account_members_access_policy" ON public.account_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.account_members am
            WHERE am.financial_account_id = public.account_members.financial_account_id
              AND am.user_id = auth.uid()
              AND am.status = 'active'
        )
    );

-- Politicas para account_invites
DROP POLICY IF EXISTS "account_invites_access_policy" ON public.account_invites;
CREATE POLICY "account_invites_access_policy" ON public.account_invites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.account_members am
            WHERE am.financial_account_id = public.account_invites.financial_account_id
              AND am.user_id = auth.uid()
              AND am.status = 'active'
        )
    );
