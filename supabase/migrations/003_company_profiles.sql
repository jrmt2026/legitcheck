-- ── Company profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_profiles (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name        text        NOT NULL,
  slug                text        UNIQUE NOT NULL,
  industry            text,
  website             text,
  description         text,
  contact_email       text,

  -- Registration
  sec_number          text,
  dti_number          text,

  -- Verification
  -- unverified | sec_submitted | sec_verified | dti_submitted | dti_verified | failed
  verification_status text        NOT NULL DEFAULT 'unverified',
  verified_at         timestamptz,

  is_active           boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── API keys ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  key_hash            text        NOT NULL UNIQUE,
  key_prefix          text        NOT NULL,
  label               text        NOT NULL DEFAULT 'Default',
  is_active           boolean     NOT NULL DEFAULT true,
  monthly_limit       integer     NOT NULL DEFAULT 500,
  requests_this_month integer     NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  last_used_at        timestamptz
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_profiles_select_own"
  ON company_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "company_profiles_update_own"
  ON company_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "api_keys_select_own"
  ON api_keys FOR SELECT USING (
    company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "api_keys_insert_own"
  ON api_keys FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "api_keys_update_own"
  ON api_keys FOR UPDATE USING (
    company_id IN (SELECT id FROM company_profiles WHERE user_id = auth.uid())
  );

-- ── Slug helper ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_company_slug(p_name text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  base_slug text;
  final_slug text;
  ctr       integer := 0;
BEGIN
  base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 50);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM company_profiles WHERE slug = final_slug) LOOP
    ctr := ctr + 1;
    final_slug := base_slug || '-' || ctr::text;
  END LOOP;
  RETURN final_slug;
END;
$$;
