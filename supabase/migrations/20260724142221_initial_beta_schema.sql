create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  role text not null default 'player' check (role in ('player', 'tester', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 120),
  short_name text not null check (char_length(short_name) between 2 and 60),
  abbreviation text not null check (char_length(abbreviation) between 2 and 4),
  hashtag text not null unique check (hashtag ~ '^#[a-z0-9]{3,40}$'),
  city text not null,
  state text not null check (char_length(state) = 2),
  legal_model text not null check (legal_model in ('association', 'saf')),
  founded_at timestamptz not null default now(),
  primary_color text not null default '#0b7a53',
  secondary_color text not null default '#ffffff',
  accent_color text not null default '#d8a21a',
  crest_url text,
  mascot text,
  cash_balance numeric(14,2) not null default 0,
  institutional_reputation numeric(4,2) not null default 1.00,
  financial_reputation numeric(4,2) not null default 1.00,
  sporting_reputation numeric(4,2) not null default 0.50,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clubs_one_owner_initially unique (owner_id)
);

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff', 'viewer')),
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create table if not exists public.press_releases (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  content text not null check (char_length(content) between 3 and 1200),
  category text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'removed')),
  published_at timestamptz,
  scheduled_at timestamptz,
  institutional_impact numeric(5,2) not null default 0,
  financial_impact numeric(5,2) not null default 0,
  sporting_impact numeric(5,2) not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('important_feed', 'club_internal', 'transfer_market', 'newspaper')),
  source_name text not null,
  title text not null check (char_length(title) between 3 and 160),
  summary text not null check (char_length(summary) <= 400),
  content text,
  relevance_score integer not null default 50 check (relevance_score between 0 and 100),
  scope text not null default 'city' check (scope in ('city', 'region', 'state', 'national', 'private')),
  city text,
  state text,
  related_club_ids uuid[] not null default '{}',
  is_demo boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  type text not null,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled', 'expired')),
  financial_impact numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  category text not null check (category in ('Bug', 'Interface', 'Regra do jogo', 'Desempenho', 'Sugestao', 'Outro')),
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 3 and 1200),
  page_url text,
  browser text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  environment text not null,
  release_notes text,
  released_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (version, environment)
);

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
from public.clubs;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists clubs_owner_id_idx on public.clubs(owner_id);
create index if not exists clubs_hashtag_idx on public.clubs(hashtag);
create index if not exists club_members_user_id_idx on public.club_members(user_id);
create index if not exists press_releases_club_status_idx on public.press_releases(club_id, status);
create index if not exists news_type_scope_idx on public.news(type, scope);
create index if not exists events_club_status_idx on public.events(club_id, status);
create index if not exists feedback_user_status_idx on public.feedback(user_id, status);

create or replace trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace trigger clubs_set_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

create or replace trigger press_releases_set_updated_at
before update on public.press_releases
for each row execute function public.set_updated_at();

create or replace trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create or replace trigger feedback_set_updated_at
before update on public.feedback
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.press_releases enable row level security;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.feedback enable row level security;
alter table public.app_versions enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "clubs_select_own" on public.clubs
for select to authenticated
using ((select auth.uid()) = owner_id or exists (
  select 1 from public.club_members cm where cm.club_id = clubs.id and cm.user_id = (select auth.uid())
));

create policy "clubs_select_public_demo" on public.clubs
for select to anon, authenticated
using (is_demo = true);

create policy "clubs_insert_own" on public.clubs
for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "clubs_update_own" on public.clubs
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "club_members_select_own" on public.club_members
for select to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.clubs c where c.id = club_members.club_id and c.owner_id = (select auth.uid())
));

create policy "club_members_insert_owner" on public.club_members
for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.clubs c where c.id = club_members.club_id and c.owner_id = (select auth.uid())
));

create policy "press_releases_public_published" on public.press_releases
for select to anon, authenticated
using (status = 'published');

create policy "press_releases_owner_all" on public.press_releases
for select to authenticated
using (exists (
  select 1 from public.clubs c where c.id = press_releases.club_id and c.owner_id = (select auth.uid())
));

create policy "press_releases_owner_insert" on public.press_releases
for insert to authenticated
with check (exists (
  select 1 from public.clubs c where c.id = press_releases.club_id and c.owner_id = (select auth.uid())
));

create policy "press_releases_owner_update" on public.press_releases
for update to authenticated
using (exists (
  select 1 from public.clubs c where c.id = press_releases.club_id and c.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.clubs c where c.id = press_releases.club_id and c.owner_id = (select auth.uid())
));

create policy "news_public_read" on public.news
for select to anon, authenticated
using (scope <> 'private');

create policy "events_owner_private" on public.events
for select to authenticated
using (exists (
  select 1 from public.clubs c where c.id = events.club_id and c.owner_id = (select auth.uid())
) or is_demo = true or (metadata->>'public') = 'true');

create policy "events_owner_insert" on public.events
for insert to authenticated
with check (exists (
  select 1 from public.clubs c where c.id = events.club_id and c.owner_id = (select auth.uid())
));

create policy "events_public_demo" on public.events
for select to anon
using (is_demo = true or (metadata->>'public') = 'true');

create policy "feedback_insert_anyone" on public.feedback
for insert to anon, authenticated
with check (true);

create policy "feedback_select_own" on public.feedback
for select to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "feedback_admin_update" on public.feedback
for update to authenticated
using (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "app_versions_public_read" on public.app_versions
for select to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated;
grant select on public.public_club_profiles to anon, authenticated;
grant select (
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
) on public.clubs to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.clubs to authenticated;
grant select, insert on public.club_members to authenticated;
grant select, insert, update on public.press_releases to authenticated;
grant select on public.press_releases to anon;
grant select on public.news to anon, authenticated;
grant select, insert on public.events to authenticated;
grant select on public.events to anon;
grant insert on public.feedback to anon, authenticated;
grant select, update on public.feedback to authenticated;
grant select on public.app_versions to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('club-crests', 'club-crests', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('club-uniforms', 'club-uniforms', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('feedback-attachments', 'feedback-attachments', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "club_public_assets_read" on storage.objects
for select to anon, authenticated
using (bucket_id in ('club-crests', 'club-uniforms'));

create policy "club_assets_insert_own_folder" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('club-crests', 'club-uniforms')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "club_assets_update_own_folder" on storage.objects
for update to authenticated
using (
  bucket_id in ('club-crests', 'club-uniforms')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('club-crests', 'club-uniforms')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "feedback_attachments_select_own_folder" on storage.objects
for select to authenticated
using (bucket_id = 'feedback-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "feedback_attachments_insert_own_folder" on storage.objects
for insert to authenticated
with check (bucket_id = 'feedback-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "feedback_attachments_update_own_folder" on storage.objects
for update to authenticated
using (bucket_id = 'feedback-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'feedback-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

insert into public.app_versions (version, environment, release_notes)
values ('0.1.0', 'beta', 'Primeira beta online com autenticacao, clubes, imprensa minima, feedback e status.')
on conflict (version, environment) do nothing;
