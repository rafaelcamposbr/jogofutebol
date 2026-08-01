create table if not exists public.tactics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  formation text not null check (formation in ('4-3-3','4-2-3-1','4-4-2','3-4-3','3-5-2','5-3-2','4-1-4-1','4-3-1-2')),
  mentality text not null default 'balanced' check (mentality in ('very_defensive','defensive','balanced','attacking','very_attacking')),
  in_possession jsonb not null default '{}'::jsonb,
  transitions jsonb not null default '{}'::jsonb,
  out_of_possession jsonb not null default '{}'::jsonb,
  set_pieces jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, name)
);

create table if not exists public.tactic_positions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  tactic_id uuid not null references public.tactics(id) on delete cascade,
  slot_key text not null,
  position text not null,
  role text not null,
  zone text not null,
  x smallint not null check (x between 0 and 100),
  y smallint not null check (y between 0 and 100),
  instructions jsonb not null default '{}'::jsonb,
  unique (tactic_id, slot_key)
);

create table if not exists public.player_tactic_familiarity (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  tactic_id uuid not null references public.tactics(id) on delete cascade,
  formation smallint not null default 20 check (formation between 0 and 100),
  position smallint not null default 20 check (position between 0 and 100),
  role smallint not null default 20 check (role between 0 and 100),
  style smallint not null default 20 check (style between 0 and 100),
  instructions smallint not null default 20 check (instructions between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (player_id, tactic_id)
);

create table if not exists public.lineups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  tactic_id uuid not null references public.tactics(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, name)
);

create table if not exists public.lineup_players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  lineup_id uuid not null references public.lineups(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  slot_key text not null,
  position text not null,
  role text not null,
  is_starter boolean not null default true,
  bench_order smallint,
  is_captain boolean not null default false,
  set_piece_duties text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (lineup_id, player_id),
  unique (lineup_id, slot_key)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  match_type text not null default 'qa' check (match_type in ('qa','friendly','competitive')),
  competition text not null default 'Partida QA',
  seed text not null,
  simulation_version text not null default 'v1',
  status text not null default 'ready' check (status in ('draft','ready','in_progress','halftime','paused','finished','cancelled','failed')),
  current_minute smallint not null default 0 check (current_minute between 0 and 90),
  home_club_id uuid references public.clubs(id) on delete set null,
  away_club_id uuid references public.clubs(id) on delete set null,
  home_tactic_id uuid references public.tactics(id) on delete set null,
  away_tactic_id uuid references public.tactics(id) on delete set null,
  home_lineup_id uuid references public.lineups(id) on delete set null,
  away_lineup_id uuid references public.lineups(id) on delete set null,
  opponent_name text not null,
  opponent_context jsonb not null default '{}'::jsonb,
  home_score smallint not null default 0 check (home_score >= 0),
  away_score smallint not null default 0 check (away_score >= 0),
  speed smallint not null default 1 check (speed in (1,10,30,90)),
  lock_version integer not null default 0,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  halftime_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_states (
  match_id uuid primary key references public.matches(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  processing_token uuid,
  locked_until timestamptz,
  last_processed_at timestamptz,
  next_process_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.match_commands (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  command_type text not null check (command_type in ('pause','resume','speed','substitution','mentality','instruction')),
  requested_minute smallint not null check (requested_minute between 0 and 90),
  applies_from_minute smallint not null check (applies_from_minute between 0 and 90),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','applied','rejected')),
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  event_index integer not null,
  minute smallint not null check (minute between 0 and 90),
  stoppage smallint not null default 0 check (stoppage between 0 and 15),
  team_side text not null check (team_side in ('home','away','neutral')),
  player_id uuid references public.players(id) on delete set null,
  secondary_player_id uuid references public.players(id) on delete set null,
  event_type text not null,
  zone text not null,
  narrative text not null,
  displayed_xg numeric(5,3),
  goal_probability numeric(5,3),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (match_id, event_index)
);

create table if not exists public.match_team_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  team_side text not null check (team_side in ('home','away')),
  possession numeric(5,2) not null default 50,
  shots smallint not null default 0,
  shots_on_target smallint not null default 0,
  xg numeric(7,3) not null default 0,
  big_chances smallint not null default 0,
  corners smallint not null default 0,
  fouls smallint not null default 0,
  offsides smallint not null default 0,
  pass_attempts smallint not null default 0,
  passes_completed smallint not null default 0,
  chances_created smallint not null default 0,
  tackles_won smallint not null default 0,
  interceptions smallint not null default 0,
  recoveries smallint not null default 0,
  aerial_duels_won smallint not null default 0,
  saves smallint not null default 0,
  yellow_cards smallint not null default 0,
  red_cards smallint not null default 0,
  injuries smallint not null default 0,
  extended_stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (match_id, team_side)
);

create table if not exists public.match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  technical_player_id text,
  player_name text not null,
  team_side text not null check (team_side in ('home','away')),
  position text not null,
  minutes_played smallint not null default 0,
  rating numeric(4,2) not null default 6,
  goals smallint not null default 0,
  assists smallint not null default 0,
  shots smallint not null default 0,
  shots_on_target smallint not null default 0,
  pass_attempts smallint not null default 0,
  passes_completed smallint not null default 0,
  key_passes smallint not null default 0,
  tackles smallint not null default 0,
  interceptions smallint not null default 0,
  recoveries smallint not null default 0,
  fouls smallint not null default 0,
  fouls_suffered smallint not null default 0,
  offsides smallint not null default 0,
  yellow_cards smallint not null default 0,
  red_cards smallint not null default 0,
  goalkeeper_stats jsonb not null default '{}'::jsonb,
  extended_stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (player_id is not null or technical_player_id is not null)
);

create unique index if not exists match_player_stats_real_idx on public.match_player_stats(match_id, player_id) where player_id is not null;
create unique index if not exists match_player_stats_technical_idx on public.match_player_stats(match_id, technical_player_id) where technical_player_id is not null;

create table if not exists public.match_reports (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  report_type text not null check (report_type in ('pre_match','halftime','post_match')),
  author_role text not null check (author_role in ('coach','analyst')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (match_id, report_type, author_role)
);

create table if not exists public.match_injuries (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  technical_player_id text,
  minute smallint not null check (minute between 0 and 90),
  severity text not null check (severity in ('minor','moderate','serious')),
  forced_substitution boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.match_substitutions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  team_side text not null check (team_side in ('home','away')),
  minute smallint not null check (minute between 0 and 90),
  player_out_id uuid references public.players(id) on delete set null,
  player_in_id uuid references public.players(id) on delete set null,
  technical_player_out_id text,
  technical_player_in_id text,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists tactics_club_idx on public.tactics(club_id, is_active);
create index if not exists tactic_positions_owner_idx on public.tactic_positions(owner_id, tactic_id);
create index if not exists familiarity_player_idx on public.player_tactic_familiarity(player_id, tactic_id);
create index if not exists lineups_club_idx on public.lineups(club_id, status);
create index if not exists lineup_players_lineup_idx on public.lineup_players(lineup_id, is_starter, bench_order);
create index if not exists matches_owner_status_idx on public.matches(owner_id, status, scheduled_at desc);
create index if not exists match_commands_pending_idx on public.match_commands(match_id, status, applies_from_minute);
create index if not exists match_events_timeline_idx on public.match_events(match_id, event_index);
create index if not exists match_reports_idx on public.match_reports(match_id, report_type);

create or replace trigger tactics_set_updated_at before update on public.tactics
for each row execute function public.set_updated_at();
create or replace trigger familiarity_set_updated_at before update on public.player_tactic_familiarity
for each row execute function public.set_updated_at();
create or replace trigger lineups_set_updated_at before update on public.lineups
for each row execute function public.set_updated_at();
create or replace trigger matches_set_updated_at before update on public.matches
for each row execute function public.set_updated_at();
create or replace trigger match_states_set_updated_at before update on public.match_states
for each row execute function public.set_updated_at();
create or replace trigger match_team_stats_set_updated_at before update on public.match_team_stats
for each row execute function public.set_updated_at();
create or replace trigger match_player_stats_set_updated_at before update on public.match_player_stats
for each row execute function public.set_updated_at();

alter table public.tactics enable row level security;
alter table public.tactic_positions enable row level security;
alter table public.player_tactic_familiarity enable row level security;
alter table public.lineups enable row level security;
alter table public.lineup_players enable row level security;
alter table public.matches enable row level security;
alter table public.match_states enable row level security;
alter table public.match_commands enable row level security;
alter table public.match_events enable row level security;
alter table public.match_team_stats enable row level security;
alter table public.match_player_stats enable row level security;
alter table public.match_reports enable row level security;
alter table public.match_injuries enable row level security;
alter table public.match_substitutions enable row level security;

create policy "tactics_select_own" on public.tactics for select to authenticated
using (owner_id = (select auth.uid()));
create policy "tactic_positions_select_own" on public.tactic_positions for select to authenticated
using (owner_id = (select auth.uid()));
create policy "familiarity_select_own" on public.player_tactic_familiarity for select to authenticated
using (owner_id = (select auth.uid()));
create policy "lineups_select_own" on public.lineups for select to authenticated
using (owner_id = (select auth.uid()));
create policy "lineup_players_select_own" on public.lineup_players for select to authenticated
using (owner_id = (select auth.uid()));
create policy "matches_select_own" on public.matches for select to authenticated
using (owner_id = (select auth.uid()));
create policy "match_states_select_own" on public.match_states for select to authenticated
using (owner_id = (select auth.uid()));
create policy "match_commands_select_own" on public.match_commands for select to authenticated
using (owner_id = (select auth.uid()));
create policy "match_events_select_own" on public.match_events for select to authenticated
using (owner_id = (select auth.uid()));
create policy "match_team_stats_select_own" on public.match_team_stats for select to authenticated
using (owner_id = (select auth.uid()));
create policy "match_player_stats_select_own" on public.match_player_stats for select to authenticated
using (owner_id = (select auth.uid()));
create policy "match_reports_select_own" on public.match_reports for select to authenticated
using (owner_id = (select auth.uid()));
create policy "match_injuries_select_own" on public.match_injuries for select to authenticated
using (owner_id = (select auth.uid()));
create policy "match_substitutions_select_own" on public.match_substitutions for select to authenticated
using (owner_id = (select auth.uid()));

revoke all on public.tactics, public.tactic_positions, public.player_tactic_familiarity,
  public.lineups, public.lineup_players, public.matches, public.match_states,
  public.match_commands, public.match_events, public.match_team_stats,
  public.match_player_stats, public.match_reports, public.match_injuries,
  public.match_substitutions from anon, authenticated;

grant select on public.tactics, public.tactic_positions, public.player_tactic_familiarity,
  public.lineups, public.lineup_players, public.matches, public.match_states,
  public.match_commands, public.match_events, public.match_team_stats,
  public.match_player_stats, public.match_reports, public.match_injuries,
  public.match_substitutions to authenticated;

grant all on public.tactics, public.tactic_positions, public.player_tactic_familiarity,
  public.lineups, public.lineup_players, public.matches, public.match_states,
  public.match_commands, public.match_events, public.match_team_stats,
  public.match_player_stats, public.match_reports, public.match_injuries,
  public.match_substitutions to service_role;

create or replace function public.commit_match_snapshot(
  p_match_id uuid,
  p_owner_id uuid,
  p_expected_version integer,
  p_status text,
  p_current_minute smallint,
  p_home_score smallint,
  p_away_score smallint,
  p_snapshot jsonb,
  p_events jsonb default '[]'::jsonb
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  changed_count integer;
begin
  if p_owner_id is distinct from auth.uid() and auth.role() <> 'service_role' then
    raise exception 'unauthorized match commit';
  end if;

  update public.matches
  set status = p_status,
      current_minute = p_current_minute,
      home_score = p_home_score,
      away_score = p_away_score,
      lock_version = lock_version + 1,
      started_at = case when p_current_minute > 0 then coalesce(started_at, now()) else started_at end,
      halftime_at = case when p_status = 'halftime' then coalesce(halftime_at, now()) else halftime_at end,
      finished_at = case when p_status = 'finished' then coalesce(finished_at, now()) else finished_at end
  where id = p_match_id
    and owner_id = p_owner_id
    and lock_version = p_expected_version;

  get diagnostics changed_count = row_count;
  if changed_count <> 1 then
    return false;
  end if;

  insert into public.match_states(match_id, owner_id, snapshot, version, last_processed_at, next_process_at)
  values (p_match_id, p_owner_id, p_snapshot, p_expected_version + 1, now(), now())
  on conflict (match_id) do update
    set snapshot = excluded.snapshot,
        version = excluded.version,
        processing_token = null,
        locked_until = null,
        last_processed_at = now(),
        next_process_at = now();

  insert into public.match_events(
    match_id, owner_id, event_index, minute, stoppage, team_side, player_id,
    secondary_player_id, event_type, zone, narrative, displayed_xg,
    goal_probability, details
  )
  select p_match_id, p_owner_id, event_index, minute, coalesce(stoppage, 0),
    team_side, player_id, secondary_player_id, event_type, zone, narrative,
    displayed_xg, goal_probability, coalesce(details, '{}'::jsonb)
  from jsonb_to_recordset(coalesce(p_events, '[]'::jsonb)) as event_rows(
    event_index integer,
    minute smallint,
    stoppage smallint,
    team_side text,
    player_id uuid,
    secondary_player_id uuid,
    event_type text,
    zone text,
    narrative text,
    displayed_xg numeric,
    goal_probability numeric,
    details jsonb
  )
  on conflict (match_id, event_index) do nothing;

  return true;
end;
$$;

revoke all on function public.commit_match_snapshot(uuid, uuid, integer, text, smallint, smallint, smallint, jsonb, jsonb)
from public, anon, authenticated;
grant execute on function public.commit_match_snapshot(uuid, uuid, integer, text, smallint, smallint, smallint, jsonb, jsonb)
to service_role;

comment on function public.commit_match_snapshot(uuid, uuid, integer, text, smallint, smallint, smallint, jsonb, jsonb)
  is 'Commits authoritative match progress exactly once using optimistic lock_version.';
comment on column public.matches.opponent_context
  is 'Technical opponent snapshot only; it never creates or mutates an AI-controlled club.';
