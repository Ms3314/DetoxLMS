-- DetoxLMS database schema. Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent or guarded.

-- ── Profiles: one row per account, created automatically at sign-up ─────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

-- The sign-up form sends the username as user metadata; this copies it into profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(new.raw_user_meta_data ->> 'username'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up form say "username taken" before creating the account.
create or replace function public.username_available(name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (select 1 from public.profiles where username = lower(name));
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- ── Focus sessions: the hours ledger ────────────────────────────────────────
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The id the browser gave the session, so re-uploading the same session is a no-op.
  local_id text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  target_seconds integer check (target_seconds is null or target_seconds > 0),
  focused_seconds integer not null check (focused_seconds >= 0 and focused_seconds <= 86400),
  away_seconds integer not null check (away_seconds >= 0),
  strikes integer not null check (strikes >= 0),
  status text not null check (status in ('completed', 'failed', 'abandoned')),
  playlist_id text not null,
  video_id text not null,
  -- Focused time that counts toward hours (10 min minimum and 12 h/day cap already applied).
  counted_seconds integer not null check (counted_seconds >= 0 and counted_seconds <= focused_seconds),
  created_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create index if not exists focus_sessions_user_ended_idx
  on public.focus_sessions (user_id, ended_at desc);

alter table public.focus_sessions enable row level security;

drop policy if exists "focus_sessions: read own" on public.focus_sessions;
create policy "focus_sessions: read own" on public.focus_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "focus_sessions: insert own" on public.focus_sessions;
create policy "focus_sessions: insert own" on public.focus_sessions
  for insert with check (auth.uid() = user_id);
