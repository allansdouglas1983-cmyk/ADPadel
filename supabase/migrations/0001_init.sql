-- Marque backend — a THIN, optional sync/backup only. Free users never touch
-- this; they stay 100% on-device (zero COGS). Only signed-in users sync their
-- dirty rows. Conflicts resolve last-write-wins by updated_at. Row-level
-- security ensures a user can only ever read/write their own data.

create extension if not exists "pgcrypto";

-- A claimed user (maps to auth.users).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique,
  display_name text,
  created_at timestamptz not null default now()
);

-- Generic sync envelope: on-device rows mirror here for multi-device + backup.
-- payload holds the serialized entity (match snapshot, player, rating, ...).
create table if not exists public.sync_rows (
  owner uuid not null references auth.users (id) on delete cascade,
  entity text not null,
  entity_id text not null,
  updated_at bigint not null,
  payload jsonb not null,
  deleted boolean not null default false,
  primary key (owner, entity, entity_id)
);

create index if not exists sync_rows_owner_entity_idx
  on public.sync_rows (owner, entity, updated_at desc);

-- Guest-claim: re-parent a guest player's rows to the claiming user.
create or replace function public.claim_guest(guest_entity_id text)
returns void language sql security definer as $$
  update public.sync_rows
     set owner = auth.uid(), updated_at = extract(epoch from now())::bigint
   where entity = 'players' and entity_id = guest_entity_id;
$$;

-- Row-level security: everyone sees only their own rows.
alter table public.profiles enable row level security;
alter table public.sync_rows enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles are self-writable"
  on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "sync rows are owner-scoped (read)"
  on public.sync_rows for select using (auth.uid() = owner);
create policy "sync rows are owner-scoped (write)"
  on public.sync_rows for all using (auth.uid() = owner) with check (auth.uid() = owner);
