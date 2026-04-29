-- ─── Report Moderation Workflow ───────────────────────────────────────────────
-- Adds proper status column (pending → approved / rejected) to scam_reports.
-- is_verified stays for backward compat — kept in sync by the admin API.

ALTER TABLE public.scam_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Backfill: existing verified reports become approved
UPDATE public.scam_reports
  SET status = 'approved', moderated_at = now()
  WHERE is_verified = true;

CREATE INDEX IF NOT EXISTS idx_scam_reports_status
  ON public.scam_reports (status);

CREATE INDEX IF NOT EXISTS idx_scam_reports_created_at
  ON public.scam_reports (created_at DESC);
