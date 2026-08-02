alter table public.matches
  add column if not exists expected_end_at timestamptz,
  add column if not exists result_prepared_at timestamptz,
  add column if not exists result_released_at timestamptz,
  add column if not exists consequences_processed_at timestamptz,
  add column if not exists venue text,
  add column if not exists round_label text,
  add column if not exists pre_match_plan jsonb not null default '{}'::jsonb,
  add column if not exists staff_assignments jsonb not null default '{}'::jsonb;

alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches add constraint matches_status_check check (
  status in (
    'draft', 'ready', 'in_progress', 'awaiting_processing', 'finished',
    'postponed', 'cancelled', 'failed', 'halftime', 'paused'
  )
);

alter table public.matches drop constraint if exists matches_pre_match_plan_object_check;
alter table public.matches add constraint matches_pre_match_plan_object_check
  check (jsonb_typeof(pre_match_plan) = 'object');
alter table public.matches drop constraint if exists matches_staff_assignments_object_check;
alter table public.matches add constraint matches_staff_assignments_object_check
  check (jsonb_typeof(staff_assignments) = 'object');
alter table public.matches drop constraint if exists matches_expected_end_after_start_check;
alter table public.matches add constraint matches_expected_end_after_start_check
  check (expected_end_at is null or started_at is null or expected_end_at > started_at);

alter table public.match_reports drop constraint if exists match_reports_author_role_check;
alter table public.match_reports add constraint match_reports_author_role_check check (
  author_role in (
    'coach', 'assistant', 'analyst', 'fitness_coach', 'physiologist',
    'doctor', 'psychologist', 'goalkeeper_coach', 'commission'
  )
);

create index if not exists matches_due_release_idx
  on public.matches(status, expected_end_at)
  where status in ('in_progress', 'awaiting_processing');

-- The browser must never query authoritative match truth directly. The app server
-- reads these tables with its server-only secret and returns a purpose-built DTO.
revoke select on public.match_states, public.match_commands, public.match_events,
  public.match_team_stats, public.match_player_stats, public.match_reports,
  public.match_injuries, public.match_substitutions from authenticated;

drop policy if exists "match_states_select_own" on public.match_states;
drop policy if exists "match_commands_select_own" on public.match_commands;
drop policy if exists "match_events_select_own" on public.match_events;
drop policy if exists "match_team_stats_select_own" on public.match_team_stats;
drop policy if exists "match_player_stats_select_own" on public.match_player_stats;
drop policy if exists "match_reports_select_own" on public.match_reports;
drop policy if exists "match_injuries_select_own" on public.match_injuries;
drop policy if exists "match_substitutions_select_own" on public.match_substitutions;

create or replace function public.start_managed_match(
  p_match_id uuid,
  p_owner_id uuid,
  p_expected_version integer,
  p_started_at timestamptz,
  p_expected_end_at timestamptz,
  p_snapshot jsonb
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  changed_count integer;
begin
  if p_expected_end_at <= p_started_at then
    raise exception 'invalid managed match release window';
  end if;

  update public.matches
  set status = 'in_progress',
      current_minute = 0,
      home_score = 0,
      away_score = 0,
      speed = 1,
      started_at = p_started_at,
      expected_end_at = p_expected_end_at,
      result_prepared_at = p_started_at,
      result_released_at = null,
      finished_at = null,
      lock_version = lock_version + 1
  where id = p_match_id
    and owner_id = p_owner_id
    and status in ('draft', 'ready')
    and lock_version = p_expected_version;

  get diagnostics changed_count = row_count;
  if changed_count <> 1 then
    return false;
  end if;

  insert into public.match_states(
    match_id, owner_id, snapshot, version, last_processed_at, next_process_at
  ) values (
    p_match_id, p_owner_id, p_snapshot, p_expected_version + 1,
    p_started_at, p_expected_end_at
  )
  on conflict (match_id) do update
    set snapshot = excluded.snapshot,
        version = excluded.version,
        processing_token = null,
        locked_until = null,
        last_processed_at = excluded.last_processed_at,
        next_process_at = excluded.next_process_at;

  return true;
end;
$$;

revoke all on function public.start_managed_match(
  uuid, uuid, integer, timestamptz, timestamptz, jsonb
) from public, anon, authenticated;
grant execute on function public.start_managed_match(
  uuid, uuid, integer, timestamptz, timestamptz, jsonb
) to service_role;

comment on function public.start_managed_match(
  uuid, uuid, integer, timestamptz, timestamptz, jsonb
) is 'Locks pre-match decisions and stores a complete sealed simulation without publishing partial results.';
comment on column public.matches.expected_end_at
  is 'Earliest time at which the sealed result may be released to the club owner.';
comment on column public.matches.speed
  is 'Legacy field retained for compatibility. Managed matches always use 1 and expose no playback speed.';

notify pgrst, 'reload schema';
