alter table public.profiles
  add column if not exists username text,
  add column if not exists username_normalized text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists whatsapp text,
  add column if not exists whatsapp_normalized text,
  add column if not exists email_game_verified boolean not null default false,
  add column if not exists whatsapp_game_verified boolean not null default false,
  add column if not exists email_verified_at timestamptz,
  add column if not exists whatsapp_verified_at timestamptz;

-- Preserve existing beta accounts while assigning collision-free legacy handles.
update public.profiles
set
  email = lower(btrim(email)),
  username = coalesce(username, 'player_' || substr(replace(id::text, '-', ''), 1, 8)),
  username_normalized = coalesce(username_normalized, 'player_' || substr(replace(id::text, '-', ''), 1, 8)),
  first_name = coalesce(nullif(btrim(first_name), ''), 'Jogador'),
  last_name = coalesce(nullif(btrim(last_name), ''), 'Beta'),
  whatsapp_normalized = coalesce(whatsapp_normalized, whatsapp)
where
  username is null
  or username_normalized is null
  or first_name is null
  or last_name is null
  or email <> lower(btrim(email))
  or (whatsapp is not null and whatsapp_normalized is null);

alter table public.profiles
  alter column username set not null,
  alter column username_normalized set not null,
  alter column first_name set not null,
  alter column last_name set not null;

alter table public.profiles
  add constraint profiles_username_format_check
    check (username ~ '^[A-Za-z0-9._]{3,24}$'),
  add constraint profiles_username_normalized_check
    check (
      username_normalized = lower(username)
      and username_normalized ~ '^[a-z0-9._]{3,24}$'
    ),
  add constraint profiles_username_reserved_check
    check (username_normalized <> all (array[
      'admin', 'administrador', 'central', 'cadastro', 'escritorio',
      'imprensa', 'login', 'moderador', 'moderator', 'oficial',
      'root', 'staff', 'suporte', 'supabase', 'sistema', 'vercel'
    ])),
  add constraint profiles_first_name_check
    check (char_length(first_name) between 2 and 60 and first_name ~ '[[:alpha:]]'),
  add constraint profiles_last_name_check
    check (char_length(last_name) between 2 and 100 and last_name ~ '[[:alpha:]]'),
  add constraint profiles_email_normalized_check
    check (email = lower(btrim(email)) and position('@' in email) > 1),
  add constraint profiles_whatsapp_check
    check (
      (whatsapp is null and whatsapp_normalized is null)
      or (
        whatsapp = whatsapp_normalized
        and whatsapp_normalized ~ '^\\+55[1-9][1-9][0-9]{8,9}$'
      )
    ),
  add constraint profiles_email_verified_state_check
    check (
      (email_game_verified and email_verified_at is not null)
      or (not email_game_verified and email_verified_at is null)
    ),
  add constraint profiles_whatsapp_verified_state_check
    check (
      (whatsapp_game_verified and whatsapp_verified_at is not null)
      or (not whatsapp_game_verified and whatsapp_verified_at is null)
    );

create unique index profiles_username_normalized_key
on public.profiles (username_normalized);

create unique index profiles_email_normalized_key
on public.profiles (email);

create unique index profiles_whatsapp_normalized_key
on public.profiles (whatsapp_normalized)
where whatsapp_normalized is not null;

create table public.verification_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  provider text not null check (provider in ('resend_link', 'twilio_verify')),
  token_hash text,
  external_id text,
  destination_normalized text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verification_challenges_token_shape check (
    (provider = 'resend_link' and token_hash is not null and external_id is null)
    or (provider = 'twilio_verify' and token_hash is null)
  )
);

create unique index verification_challenges_token_hash_key
on public.verification_challenges (token_hash)
where token_hash is not null;

create index verification_challenges_user_channel_created_idx
on public.verification_challenges (user_id, channel, created_at desc);

create index verification_challenges_active_idx
on public.verification_challenges (user_id, channel, expires_at)
where used_at is null;

create trigger verification_challenges_set_updated_at
before update on public.verification_challenges
for each row execute function public.set_updated_at();

alter table public.verification_challenges enable row level security;

revoke all privileges on public.verification_challenges from public, anon, authenticated;
grant all privileges on public.verification_challenges to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := btrim(coalesce(new.raw_user_meta_data->>'username', ''));
  v_username_normalized text := lower(btrim(coalesce(new.raw_user_meta_data->>'username_normalized', '')));
  v_first_name text := btrim(regexp_replace(coalesce(new.raw_user_meta_data->>'first_name', ''), '[[:space:]]+', ' ', 'g'));
  v_last_name text := btrim(regexp_replace(coalesce(new.raw_user_meta_data->>'last_name', ''), '[[:space:]]+', ' ', 'g'));
  v_whatsapp text := btrim(coalesce(new.raw_user_meta_data->>'whatsapp_normalized', ''));
begin
  if new.email is null
    or lower(btrim(new.email)) <> new.email
    or position('@' in new.email) <= 1
    or v_username !~ '^[A-Za-z0-9._]{3,24}$'
    or v_username_normalized <> lower(v_username)
    or v_username_normalized = any (array[
      'admin', 'administrador', 'central', 'cadastro', 'escritorio',
      'imprensa', 'login', 'moderador', 'moderator', 'oficial',
      'root', 'staff', 'suporte', 'supabase', 'sistema', 'vercel'
    ])
    or char_length(v_first_name) not between 2 and 60
    or v_first_name !~ '[[:alpha:]]'
    or char_length(v_last_name) not between 2 and 100
    or v_last_name !~ '[[:alpha:]]'
    or v_whatsapp !~ '^\\+55[1-9][1-9][0-9]{8,9}$'
  then
    raise exception using
      errcode = '23514',
      message = 'invalid_signup_profile';
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    username,
    username_normalized,
    first_name,
    last_name,
    whatsapp,
    whatsapp_normalized,
    email_game_verified,
    whatsapp_game_verified
  )
  values (
    new.id,
    new.email,
    v_first_name || ' ' || v_last_name,
    v_username,
    v_username_normalized,
    v_first_name,
    v_last_name,
    v_whatsapp,
    v_whatsapp,
    false,
    false
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set
      email = lower(btrim(new.email)),
      email_game_verified = false,
      email_verified_at = null,
      updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_profile_email() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function private.sync_profile_email();

-- RLS still restricts rows; column grants prevent users from forging roles,
-- destinations, usernames, or verification state through the Data API.
revoke insert, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, first_name, last_name, avatar_url) on public.profiles to authenticated;

create or replace function public.create_club_with_foundation(
  p_name text,
  p_short_name text,
  p_abbreviation text,
  p_hashtag text,
  p_city text,
  p_state text,
  p_legal_model text,
  p_primary_color text,
  p_secondary_color text,
  p_accent_color text,
  p_mascot text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_club_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select id into v_club_id
  from public.clubs
  where owner_id = v_user_id
  limit 1;

  if v_club_id is not null then
    return v_club_id;
  end if;

  if char_length(p_name) not between 3 and 120
    or char_length(p_short_name) not between 2 and 60
    or char_length(p_abbreviation) not between 2 and 4
    or p_hashtag !~ '^#[a-z0-9]{3,40}$'
    or btrim(p_city) = ''
    or char_length(p_state) <> 2
    or p_legal_model not in ('association', 'saf')
    or p_primary_color !~ '^#[0-9A-Fa-f]{6}$'
    or p_secondary_color !~ '^#[0-9A-Fa-f]{6}$'
    or p_accent_color !~ '^#[0-9A-Fa-f]{6}$'
  then
    raise exception using errcode = '23514', message = 'invalid_club_data';
  end if;

  insert into public.clubs (
    owner_id,
    name,
    short_name,
    abbreviation,
    hashtag,
    city,
    state,
    legal_model,
    primary_color,
    secondary_color,
    accent_color,
    mascot,
    cash_balance,
    institutional_reputation,
    financial_reputation,
    sporting_reputation
  )
  values (
    v_user_id,
    btrim(p_name),
    btrim(p_short_name),
    upper(btrim(p_abbreviation)),
    p_hashtag,
    btrim(p_city),
    upper(btrim(p_state)),
    p_legal_model,
    p_primary_color,
    p_secondary_color,
    p_accent_color,
    nullif(btrim(p_mascot), ''),
    0,
    1,
    1,
    0.5
  )
  returning id into v_club_id;

  insert into public.club_members (club_id, user_id, role)
  values (v_club_id, v_user_id, 'owner');

  insert into public.events (
    club_id,
    type,
    title,
    description,
    starts_at,
    status,
    financial_impact
  )
  values (
    v_club_id,
    'foundation',
    'Clube fundado',
    btrim(p_name) || ' foi fundado na beta online.',
    now(),
    'completed',
    0
  );

  return v_club_id;
end;
$$;

revoke all on function public.create_club_with_foundation(
  text, text, text, text, text, text, text, text, text, text, text
) from public, anon;

grant execute on function public.create_club_with_foundation(
  text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

create or replace function public.complete_game_verification(
  p_user_id uuid,
  p_channel text,
  p_challenge_id uuid,
  p_destination_normalized text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed integer := 0;
begin
  if p_channel not in ('email', 'whatsapp') then
    return false;
  end if;

  update public.verification_challenges
  set used_at = now(), updated_at = now()
  where id = p_challenge_id
    and user_id = p_user_id
    and channel = p_channel
    and destination_normalized = p_destination_normalized
    and used_at is null
    and expires_at > now();

  if not found then
    return false;
  end if;

  if p_channel = 'email' then
    update public.profiles
    set email_game_verified = true, email_verified_at = now(), updated_at = now()
    where id = p_user_id and email = p_destination_normalized;
  else
    update public.profiles
    set whatsapp_game_verified = true, whatsapp_verified_at = now(), updated_at = now()
    where id = p_user_id and whatsapp_normalized = p_destination_normalized;
  end if;

  get diagnostics v_completed = row_count;
  if v_completed <> 1 then
    raise exception using errcode = '23514', message = 'verification_destination_changed';
  end if;

  return true;
end;
$$;

revoke all on function public.complete_game_verification(uuid, text, uuid, text)
from public, anon, authenticated;
grant execute on function public.complete_game_verification(uuid, text, uuid, text)
to service_role;
