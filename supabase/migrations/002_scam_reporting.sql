-- ─── Scam Reports (crowd-sourced database) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS scam_reports (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier        TEXT        NOT NULL,           -- phone, account no, URL, email, FB handle
  identifier_type   TEXT        NOT NULL,           -- 'phone','gcash','maya','bank','url','email','facebook','shopee','other'
  account_name      TEXT,                           -- name on the account
  platform          TEXT,                           -- 'gcash','maya','bpi','bdo','metrobank','unionbank','facebook','shopee','lazada','other'
  category          TEXT        NOT NULL,           -- CategoryId
  description       TEXT,                           -- what happened
  amount_lost       NUMERIC,                        -- PHP amount (optional)
  check_id          UUID        REFERENCES checks(id) ON DELETE SET NULL,
  reporter_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_verified       BOOLEAN     DEFAULT FALSE,      -- admin-confirmed report
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scam_reports_identifier
  ON scam_reports (lower(trim(identifier)));

-- RLS
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scam_reports"
  ON scam_reports FOR SELECT USING (true);

CREATE POLICY "Anyone can insert scam_reports"
  ON scam_reports FOR INSERT WITH CHECK (true);

-- ─── Seller Verifications ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seller_verifications (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  seller_name         TEXT        NOT NULL,
  shop_name           TEXT,
  platforms           TEXT[]      DEFAULT '{}',     -- ['facebook','shopee','lazada','instagram','tiktok']
  platform_handles    TEXT[]      DEFAULT '{}',     -- ['@myshop','shopee.com/shop/myshop']
  contact_number      TEXT,
  dti_number          TEXT,
  sec_number          TEXT,
  description         TEXT,                         -- brief seller bio / what they sell
  badge_level         TEXT        DEFAULT 'pending', -- 'pending','id_verified','business_verified','fully_verified','rejected'
  rejection_reason    TEXT,
  public_slug         TEXT        UNIQUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_verifications_slug
  ON seller_verifications (public_slug);

CREATE INDEX IF NOT EXISTS idx_seller_verifications_user
  ON seller_verifications (user_id);

-- RLS
ALTER TABLE seller_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seller_verifications"
  ON seller_verifications FOR SELECT USING (true);

CREATE POLICY "Users manage own seller_verification"
  ON seller_verifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
