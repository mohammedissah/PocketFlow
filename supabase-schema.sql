-- =========================================================
-- PocketFlow Supabase Cloud Sync Schema & Security Policies
-- =========================================================
-- Instructions:
-- 1. Go to your Supabase project (https://supabase.com/dashboard).
-- 2. Open the "SQL Editor" in the left sidebar.
-- 3. Paste this script and click "Run".
-- =========================================================

-- 1. Create the pocketflow_sync table
create table if not exists public.pocketflow_sync (
    user_id uuid primary key references auth.users(id) on delete cascade,
    expenses jsonb default '[]'::jsonb not null,
    budget numeric default 2500 not null,
    currency text default 'GH₵' not null,
    coach_strictness text default 'balanced',
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS) so each user's financial data is strictly private
alter table public.pocketflow_sync enable row level security;

-- 3. Create security policies for authenticated users (idempotent)
drop policy if exists "Users can read own pocketflow data" on public.pocketflow_sync;
create policy "Users can read own pocketflow data"
    on public.pocketflow_sync for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own pocketflow data" on public.pocketflow_sync;
create policy "Users can insert own pocketflow data"
    on public.pocketflow_sync for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own pocketflow data" on public.pocketflow_sync;
create policy "Users can update own pocketflow data"
    on public.pocketflow_sync for update
    to authenticated
    using (auth.uid() = user_id);

-- 4. Enable Supabase Realtime safely (idempotent, won't error if already added)
do $$
begin
    if not exists (
        select 1 from pg_publication_rel
        where prrelid = 'public.pocketflow_sync'::regclass
        and prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
    ) then
        alter publication supabase_realtime add table public.pocketflow_sync;
    end if;
end
$$;
