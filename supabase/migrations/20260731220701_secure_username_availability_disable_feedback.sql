create unique index if not exists profiles_username_normalized_key
  on public.profiles (username_normalized);

create or replace function public.is_username_available(p_username text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_username text := lower(btrim(p_username));
begin
  if p_username is null
    or btrim(p_username) !~ '^[A-Za-z0-9._]{3,24}$'
    or normalized_username = any (array[
      'admin', 'administrador', 'central', 'cadastro', 'escritorio', 'imprensa',
      'login', 'moderador', 'moderator', 'oficial', 'root', 'staff', 'suporte',
      'supabase', 'sistema', 'vercel'
    ])
  then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles
    where username_normalized = normalized_username
  );
end;
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated, service_role;

drop policy if exists feedback_insert_anyone on public.feedback;
revoke insert on table public.feedback from anon, authenticated;
