create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists feedback_club_id_idx on public.feedback(club_id);
create index if not exists press_releases_author_id_idx on public.press_releases(author_id);

drop policy if exists "clubs_select_own" on public.clubs;
drop policy if exists "clubs_select_public_demo" on public.clubs;

create policy "clubs_select_own" on public.clubs
for select to authenticated
using (is_demo = true or (select auth.uid()) = owner_id or exists (
  select 1 from public.club_members cm where cm.club_id = clubs.id and cm.user_id = (select auth.uid())
));

create policy "clubs_select_public_demo" on public.clubs
for select to anon
using (is_demo = true);

drop policy if exists "press_releases_public_published" on public.press_releases;
drop policy if exists "press_releases_owner_all" on public.press_releases;

create policy "press_releases_public_published" on public.press_releases
for select to anon
using (status = 'published');

create policy "press_releases_owner_all" on public.press_releases
for select to authenticated
using (status = 'published' or exists (
  select 1 from public.clubs c where c.id = press_releases.club_id and c.owner_id = (select auth.uid())
));

drop policy if exists "feedback_insert_anyone" on public.feedback;

create policy "feedback_insert_anyone" on public.feedback
for insert to anon, authenticated
with check (
  status = 'open'
  and title is not null
  and description is not null
  and category in ('Bug', 'Interface', 'Regra do jogo', 'Desempenho', 'Sugestao', 'Outro')
  and char_length(title) between 3 and 120
  and char_length(description) between 3 and 1200
  and (user_id is null or user_id = (select auth.uid()))
);
