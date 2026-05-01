-- ─── Phase 1 Monetization Schema ──────────────────────────────────────────────
-- Adds: anonymous_checks (IP rate-limiting), payments, credit_batches,
-- credit_ledger, and usage_counts view.

-- ─── Anonymous check tracking (IP-based, 1 free per IP) ─────────────────────
CREATE TABLE IF NOT EXISTS public.anonymous_checks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anonymous_checks ENABLE ROW LEVEL SECURITY;
-- No client policies — service role only. Clients cannot read or write this table.

CREATE INDEX IF NOT EXISTS idx_anon_checks_ip_hash ON public.anonymous_checks (ip_hash);
CREATE INDEX IF NOT EXISTS idx_anon_checks_created ON public.anonymous_checks (created_at DESC);

-- ─── Payments (one row per initiated checkout) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider        text NOT NULL DEFAULT 'paymongo',
  provider_ref    text UNIQUE,          -- PayMongo payment_intent or checkout session ID
  reference_no    text NOT NULL UNIQUE, -- our internal idempotency key
  plan_id         text NOT NULL,
  amount_cents    integer NOT NULL,     -- in centavos (₱79 = 7900)
  currency        text NOT NULL DEFAULT 'PHP',
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  credits_granted integer NOT NULL DEFAULT 0,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id  ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref      ON public.payments (reference_no);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments (provider_ref);

-- ─── Credit batches (one row per successful payment) ─────────────────────────
-- Each batch tracks the source and remaining credits from that purchase.
CREATE TABLE IF NOT EXISTS public.credit_batches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_id      uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  source          text NOT NULL DEFAULT 'purchase'
    CHECK (source IN ('purchase', 'community_reward', 'promo', 'admin')),
  total_credits   integer NOT NULL CHECK (total_credits > 0),
  used_credits    integer NOT NULL DEFAULT 0 CHECK (used_credits >= 0),
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credit batches"
  ON public.credit_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_batches_user_id ON public.credit_batches (user_id);

-- ─── Credit ledger (one row per debit/credit event) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  batch_id    uuid REFERENCES public.credit_batches(id) ON DELETE SET NULL,
  delta       integer NOT NULL,         -- positive = credit, negative = debit
  description text NOT NULL,
  check_id    uuid,                     -- optional link to checks table
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ledger"
  ON public.credit_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON public.credit_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON public.credit_ledger (created_at DESC);

-- ─── Add premium_credits computed column helper to profiles ──────────────────
-- We keep credits_remaining on profiles as a denormalized cache (fast reads)
-- The authoritative source is credit_batches. Function to recompute:
CREATE OR REPLACE FUNCTION public.get_premium_credits(p_user_id uuid)
RETURNS integer AS $$
  SELECT COALESCE(SUM(total_credits - used_credits), 0)::integer
  FROM public.credit_batches
  WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now())
    AND total_credits > used_credits;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── Add free_checks_used to profiles (monthly counter) ─────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_checks_this_month  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_checks_month_reset timestamptz NOT NULL DEFAULT date_trunc('month', now());

-- ─── Updated-at trigger for payments ─────────────────────────────────────────
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
