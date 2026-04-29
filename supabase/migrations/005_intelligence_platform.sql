-- 005_intelligence_platform.sql
-- LegitCheck PH — Intelligence Platform Schema Extension

-- ─── Entities ─────────────────────────────────────────────────────────────────
-- Extracted entities (phones, emails, domains, names, accounts, etc.)
create table if not exists public.entities (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in (
    'person', 'business', 'phone', 'email', 'domain', 'url',
    'wallet', 'bank_account', 'social_page', 'app_name', 'sender_name'
  )),
  value text not null,
  normalized_value text not null,
  risk_score integer not null default 50 check (risk_score between 0 and 100),
  report_count integer not null default 1,
  verified_status text not null default 'unverified' check (verified_status in (
    'unverified', 'disputed', 'verified_safe', 'verified_risky', 'public_advisory'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists entities_type_normalized_idx
  on public.entities (entity_type, normalized_value);
create index if not exists entities_normalized_value_idx
  on public.entities (normalized_value);

alter table public.entities enable row level security;
create policy "Entities are publicly readable"
  on public.entities for select using (true);
create policy "Service role can manage entities"
  on public.entities for all using (auth.role() = 'service_role');

-- ─── Report Entities (join table: checks ↔ entities) ──────────────────────────
create table if not exists public.report_entities (
  id uuid primary key default uuid_generate_v4(),
  check_id uuid references public.checks(id) on delete cascade not null,
  entity_id uuid references public.entities(id) on delete cascade not null,
  role text not null default 'other' check (role in (
    'sender', 'recipient', 'claimed_company', 'payment_account',
    'contact_number', 'website', 'social_page', 'referenced_person', 'other'
  )),
  created_at timestamptz not null default now()
);

create index if not exists report_entities_check_id_idx
  on public.report_entities (check_id);
create index if not exists report_entities_entity_id_idx
  on public.report_entities (entity_id);

alter table public.report_entities enable row level security;
create policy "Report entities are publicly readable"
  on public.report_entities for select using (true);
create policy "Service role can manage report_entities"
  on public.report_entities for all using (auth.role() = 'service_role');

-- ─── Red Flags (granular per-check red flag records) ──────────────────────────
create table if not exists public.red_flags (
  id uuid primary key default uuid_generate_v4(),
  check_id uuid references public.checks(id) on delete cascade not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  flag_type text not null,
  explanation text not null,
  evidence_text text,
  created_at timestamptz not null default now()
);

create index if not exists red_flags_check_id_idx
  on public.red_flags (check_id);

alter table public.red_flags enable row level security;
create policy "Service role can manage red_flags"
  on public.red_flags for all using (auth.role() = 'service_role');

-- ─── Feedback (user feedback per result) ──────────────────────────────────────
create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  check_id uuid references public.checks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  feedback_type text not null check (feedback_type in (
    'accurate', 'false_positive', 'false_negative', 'unclear'
  )),
  user_comment text,
  review_status text not null default 'pending' check (review_status in (
    'pending', 'reviewed', 'resolved'
  )),
  created_at timestamptz not null default now()
);

create index if not exists feedback_check_id_idx on public.feedback (check_id);

alter table public.feedback enable row level security;
create policy "Anyone can insert feedback"
  on public.feedback for insert with check (true);
create policy "Users can view own feedback"
  on public.feedback for select
  using (auth.uid() = user_id or user_id is null);
create policy "Service role can manage feedback"
  on public.feedback for all using (auth.role() = 'service_role');

-- ─── Patterns (scam pattern reference library) ────────────────────────────────
create table if not exists public.patterns (
  id uuid primary key default uuid_generate_v4(),
  pattern_name text not null,
  category text not null,
  description text not null,
  example_script text,
  risk_indicators text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patterns enable row level security;
create policy "Patterns are publicly readable"
  on public.patterns for select using (true);
create policy "Service role can manage patterns"
  on public.patterns for all using (auth.role() = 'service_role');

-- ─── Report Credits (earn credits for accepted reports) ───────────────────────
create table if not exists public.report_credits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  source_report_id uuid references public.scam_reports(id) on delete set null,
  credit_type text not null check (credit_type in ('earned_from_reports', 'promo', 'admin')),
  status text not null default 'pending' check (status in (
    'pending', 'awarded', 'used', 'expired'
  )),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists report_credits_user_id_idx
  on public.report_credits (user_id);

alter table public.report_credits enable row level security;
create policy "Users can view own credits"
  on public.report_credits for select using (auth.uid() = user_id);
create policy "Service role can manage credits"
  on public.report_credits for all using (auth.role() = 'service_role');

-- ─── Extend checks table with intelligence platform columns ──────────────────
alter table public.checks
  add column if not exists confidence_score integer check (confidence_score between 0 and 100),
  add column if not exists risk_level_label text check (risk_level_label in (
    'Likely Safe', 'Needs Verification', 'Suspicious', 'High Risk', 'Critical Risk'
  )),
  add column if not exists is_public_reference boolean not null default false,
  add column if not exists submission_type text check (submission_type in (
    'sms', 'screenshot', 'email', 'link', 'company', 'person',
    'payment_confirmation', 'investment_offer', 'mixed'
  )),
  add column if not exists main_conclusion text,
  add column if not exists recommended_next_step text;

-- ─── Track accepted report count on scam_reports ─────────────────────────────
alter table public.scam_reports
  add column if not exists review_status text default 'pending' check (review_status in (
    'pending', 'accepted', 'rejected'
  ));

-- ─── Triggers for updated_at ──────────────────────────────────────────────────
create trigger entities_updated_at
  before update on public.entities
  for each row execute procedure public.handle_updated_at();

create trigger patterns_updated_at
  before update on public.patterns
  for each row execute procedure public.handle_updated_at();
