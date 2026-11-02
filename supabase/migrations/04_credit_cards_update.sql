-- =========================================================
-- MIGRAÇÃO 04: ATUALIZAÇÃO DA TABELA DE CARTÕES DE CRÉDITO
-- Adiciona colunas issuer, last_four_digits e is_active
-- e restrição de unicidade para faturas
-- =========================================================

-- 1. Colunas estendidas para credit_cards
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS issuer TEXT DEFAULT 'Banco';
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS last_four_digits TEXT DEFAULT '0000';
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Restrição única para credit_card_invoices (permite upsert seguro de pagamentos e fechamentos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'credit_card_invoices_card_month_year_unique'
    ) THEN
        ALTER TABLE public.credit_card_invoices
        ADD CONSTRAINT credit_card_invoices_card_month_year_unique UNIQUE (credit_card_id, month, year);
    END IF;
END $$;
