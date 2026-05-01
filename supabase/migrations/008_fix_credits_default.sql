-- Fix: credits_remaining was initialized to 3 (legacy free-tier default).
-- It is now a denormalized cache of premium credits from credit_batches.
-- New users should start at 0. Existing users with no purchases also reset to 0.

-- Change column default to 0
ALTER TABLE public.profiles
  ALTER COLUMN credits_remaining SET DEFAULT 0;

-- Sync all existing users: set credits_remaining to their actual premium credit balance
UPDATE public.profiles p
SET credits_remaining = COALESCE((
  SELECT SUM(total_credits - used_credits)
  FROM public.credit_batches b
  WHERE b.user_id = p.id
    AND (b.expires_at IS NULL OR b.expires_at > now())
    AND b.total_credits > b.used_credits
), 0);
