revoke all privileges on
  public.profiles,
  public.clubs,
  public.club_members,
  public.press_releases,
  public.news,
  public.events,
  public.feedback,
  public.app_versions,
  public.public_club_profiles
from anon, authenticated;

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
