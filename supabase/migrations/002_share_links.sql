-- Migration 002: Share Links
-- Run in Supabase SQL Editor after 001_initial_schema.sql

create table if not exists public.share_links (
  id            uuid primary key default uuid_generate_v4(),
  token         text not null unique,
  check_id      uuid references public.checks(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  amount        integer,                         -- transaction amount in PHP
  is_free       boolean not null default true,   -- true if amount <= 1000
  expires_at    timestamptz not null,            -- always 7 days from creation
  view_count    integer not null default 0,
  dispute_count integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.share_links enable row level security;

-- Owners can manage their own share links
create policy "Users can manage own share links"
  on public.share_links for all
  using (auth.uid() = user_id);

-- Anyone can VIEW a share link (public read by token)
create policy "Anyone can view share links"
  on public.share_links for select
  using (true);

-- Disputes table (anonymous, linked to share link)
create table if not exists public.disputes (
  id           uuid primary key default uuid_generate_v4(),
  share_token  text references public.share_links(token) on delete cascade not null,
  check_id     uuid references public.checks(id) on delete cascade not null,
  issue_type   text not null,
  message      text,
  created_at   timestamptz not null default now()
);

alter table public.disputes enable row level security;

-- Anyone can insert a dispute (seller doesn't need account)
create policy "Anyone can create a dispute"
  on public.disputes for insert
  with check (true);

-- Only check owner can view disputes on their checks
create policy "Check owners can view disputes"
  on public.disputes for select
  using (
    check_id in (
      select id from public.checks where user_id = auth.uid()
    )
  );

-- Auto-increment view count function
create or replace function public.increment_share_view(p_token text)
returns void as $$
begin
  update public.share_links
  set view_count = view_count + 1
  where token = p_token and expires_at > now();
end;
$$ language plpgsql security definer;

-- Index for fast token lookup
create index if not exists share_links_token_idx on public.share_links(token);
create index if not exists share_links_expires_at_idx on public.share_links(expires_at);
