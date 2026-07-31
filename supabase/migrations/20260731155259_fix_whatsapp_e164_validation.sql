alter table public.profiles
drop constraint profiles_whatsapp_check;

alter table public.profiles
add constraint profiles_whatsapp_check
check (
  (whatsapp is null and whatsapp_normalized is null)
  or (
    whatsapp = whatsapp_normalized
    and whatsapp_normalized ~ '^[+]55[1-9][1-9][0-9]{8,9}$'
  )
);

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
    or v_whatsapp !~ '^[+]55[1-9][1-9][0-9]{8,9}$'
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
