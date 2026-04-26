-- LegitCheck PH — Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── User Profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free',
  credits_remaining integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Check Records ─────────────────────────────────────────────────────────────
create table if not exists public.checks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id text not null,
  input_text text,
  score integer not null,
  color text not null check (color in ('green', 'yellow', 'red')),
  result jsonb not null,
  is_flagged boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.checks enable row level security;

create policy "Users can view own checks"
  on public.checks for select
  using (auth.uid() = user_id);

create policy "Users can insert own checks"
  on public.checks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own checks"
  on public.checks for update
  using (auth.uid() = user_id);

-- ─── Agent Sessions ────────────────────────────────────────────────────────────
create table if not exists public.agent_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  agent_role text not null,
  check_id uuid references public.checks(id) on delete set null,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_sessions enable row level security;

create policy "Users can manage own agent sessions"
  on public.agent_sessions for all
  using (auth.uid() = user_id);

-- ─── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists checks_user_id_idx on public.checks(user_id);
create index if not exists checks_created_at_idx on public.checks(created_at desc);
create index if not exists agent_sessions_user_id_idx on public.agent_sessions(user_id);

-- ─── Updated At Trigger ────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger checks_updated_at before update on public.checks
  for each row execute procedure public.handle_updated_at();

create trigger agent_sessions_updated_at before update on public.agent_sessions
  for each row execute procedure public.handle_updated_at();
