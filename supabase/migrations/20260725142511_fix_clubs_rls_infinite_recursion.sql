-- Fix RLS recursion: clubs_select_own used club_members, while club_members
-- policies used clubs. Keep the dependency graph one-way: child tables may check
-- clubs ownership, but clubs never checks child tables.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.club_public_profiles (
  id uuid primary key references public.clubs(id) on delete cascade,
  name text not null,
  short_name text not null,
  abbreviation text not null,
  hashtag text not null,
  city text not null,
  state text not null,
  legal_model text not null,
  founded_at timestamptz not null,
  primary_color text not null,
  secondary_color text not null,
  accent_color text not null,
  crest_url text,
  mascot text,
  institutional_reputation numeric(4,2) not null,
  sporting_reputation numeric(4,2) not null,
  is_demo boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index if not exists club_public_profiles_hashtag_idx
on public.club_public_profiles(hashtag);

alter table public.club_public_profiles enable row level security;

insert into public.club_public_profiles (
  id,
  name,
  short_name,
  abbreviation,
  hashtag,
  city,
  state,
  legal_model,
  founded_at,
  primary_color,
  secondary_color,
  accent_color,
  crest_url,
  mascot,
  institutional_reputation,
  sporting_reputation,
  is_demo,
  created_at,
  updated_at
)
select
  id,
  name,
  short_name,
  abbreviation,
  hashtag,
  city,
  state,
  legal_model,
  founded_at,
  primary_color,
  secondary_color,
  accent_color,
  crest_url,
  mascot,
  institutional_reputation,
  sporting_reputation,
  is_demo,
  created_at,
  updated_at
from public.clubs
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  abbreviation = excluded.abbreviation,
  hashtag = excluded.hashtag,
  city = excluded.city,
  state = excluded.state,
  legal_model = excluded.legal_model,
  founded_at = excluded.founded_at,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  accent_color = excluded.accent_color,
  crest_url = excluded.crest_url,
  mascot = excluded.mascot,
  institutional_reputation = excluded.institutional_reputation,
  sporting_reputation = excluded.sporting_reputation,
  is_demo = excluded.is_demo,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

create or replace function private.sync_club_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.club_public_profiles where id = old.id;
    return old;
  end if;

  insert into public.club_public_profiles (
    id,
    name,
    short_name,
    abbreviation,
    hashtag,
    city,
    state,
    legal_model,
    founded_at,
    primary_color,
    secondary_color,
    accent_color,
    crest_url,
    mascot,
    institutional_reputation,
    sporting_reputation,
    is_demo,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.name,
    new.short_name,
    new.abbreviation,
    new.hashtag,
    new.city,
    new.state,
    new.legal_model,
    new.founded_at,
    new.primary_color,
    new.secondary_color,
    new.accent_color,
    new.crest_url,
    new.mascot,
    new.institutional_reputation,
    new.sporting_reputation,
    new.is_demo,
    new.created_at,
    new.updated_at
  )
  on conflict (id) do update set
    name = excluded.name,
    short_name = excluded.short_name,
    abbreviation = excluded.abbreviation,
    hashtag = excluded.hashtag,
    city = excluded.city,
    state = excluded.state,
    legal_model = excluded.legal_model,
    founded_at = excluded.founded_at,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    accent_color = excluded.accent_color,
    crest_url = excluded.crest_url,
    mascot = excluded.mascot,
    institutional_reputation = excluded.institutional_reputation,
    sporting_reputation = excluded.sporting_reputation,
    is_demo = excluded.is_demo,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.sync_club_public_profile() from public, anon, authenticated;

drop trigger if exists clubs_sync_public_profile on public.clubs;
create trigger clubs_sync_public_profile
after insert or update or delete on public.clubs
for each row execute function private.sync_club_public_profile();

drop policy if exists "clubs_select_own" on public.clubs;
create policy "clubs_select_own" on public.clubs
for select to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "club_members_insert_owner" on public.club_members;
create policy "club_members_insert_owner" on public.club_members
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1
    from public.clubs c
    where c.id = club_members.club_id
      and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "club_public_profiles_read" on public.club_public_profiles;
create policy "club_public_profiles_read" on public.club_public_profiles
for select to anon, authenticated
using (true);

create or replace view public.public_club_profiles
with (security_invoker = true) as
select
  id,
  name,
  short_name,
  abbreviation,
  hashtag,
  city,
  state,
  legal_model,
  founded_at,
  primary_color,
  secondary_color,
  accent_color,
  crest_url,
  mascot,
  institutional_reputation,
  sporting_reputation,
  is_demo,
  created_at,
  updated_at
from public.club_public_profiles;

revoke all privileges on public.club_public_profiles from anon, authenticated;
revoke all privileges on public.public_club_profiles from anon, authenticated;
grant select on public.club_public_profiles to anon, authenticated;
grant select on public.public_club_profiles to anon, authenticated;
