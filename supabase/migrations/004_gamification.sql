-- ── Gamification columns on profiles ────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shield_score    INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checks_total    INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports_total   INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days     INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_check_date DATE,
  ADD COLUMN IF NOT EXISTS badges_earned   TEXT[]   NOT NULL DEFAULT '{}';
