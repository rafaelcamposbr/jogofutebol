create or replace function public.jsonb_object_numbers_between(
  p_value jsonb,
  p_min numeric,
  p_max numeric
)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select pg_catalog.jsonb_typeof(p_value) = 'object'
    and not exists (
      select 1
      from pg_catalog.jsonb_each(p_value) as item
      where case
        when pg_catalog.jsonb_typeof(item.value) <> 'number' then true
        else ((item.value #>> '{}')::numeric < p_min or (item.value #>> '{}')::numeric > p_max)
      end
    );
$$;

revoke all on function public.jsonb_object_numbers_between(jsonb, numeric, numeric) from public, anon, authenticated;
grant execute on function public.jsonb_object_numbers_between(jsonb, numeric, numeric) to service_role;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 2 and 60),
  last_name text not null check (char_length(last_name) between 2 and 80),
  known_as text not null check (char_length(known_as) between 2 and 100),
  birth_date date not null,
  nationality text not null default 'Brasil' check (char_length(nationality) between 2 and 80),
  secondary_nationality text check (secondary_nationality is null or char_length(secondary_nationality) between 2 and 80),
  height_cm integer not null check (height_cm between 150 and 215),
  weight_kg integer not null check (weight_kg between 50 and 130),
  preferred_foot text not null check (preferred_foot in ('left', 'right')),
  weak_foot_level integer not null default 2 check (weak_foot_level between 0 and 5),
  squad_number integer check (squad_number is null or squad_number between 1 and 99),
  main_position text not null check (main_position in (
    'GK','RB','RWB','CB','LB','LWB','DM','CM','AM','RM','LM','RW','LW','SS','ST'
  )),
  status text not null check (status in (
    'free_agent','contracted','loaned_out','loaned_in','unavailable','retired'
  )),
  squad_role text not null default 'reserve' check (squad_role in (
    'franchise','starter','rotation','reserve','development','surplus'
  )),
  current_overall numeric(5,2) not null default 0 check (current_overall between 0 and 100),
  public_potential_band text not null default 'uncertain' check (public_potential_band in (
    'limited','stable','promising','high','uncertain'
  )),
  captain_rank integer not null default 0 check (captain_rank between 0 and 5),
  generated_source text not null default 'initial_squad' check (generated_source in (
    'initial_squad','free_agent_market','youth','manual','imported'
  )),
  generation_index integer check (generation_index is null or generation_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'free_agent' and club_id is null)
    or (status <> 'free_agent' and club_id is not null)
  )
);

create unique index if not exists players_club_squad_number_key
  on public.players(club_id, squad_number)
  where club_id is not null and squad_number is not null and status not in ('loaned_out','retired');
create index if not exists players_club_status_position_idx on public.players(club_id, status, main_position);
create index if not exists players_free_agents_idx on public.players(status, main_position, current_overall)
  where club_id is null and status = 'free_agent';
create unique index if not exists players_generated_identity_idx
  on public.players(coalesce(club_id, '00000000-0000-0000-0000-000000000000'::uuid), generated_source, generation_index)
  where generation_index is not null;

create table if not exists public.player_attributes (
  player_id uuid primary key references public.players(id) on delete cascade,
  technical jsonb not null default '{}'::jsonb
    check (public.jsonb_object_numbers_between(technical, 0, 100)),
  mental jsonb not null default '{}'::jsonb
    check (public.jsonb_object_numbers_between(mental, 0, 100)),
  physical jsonb not null default '{}'::jsonb
    check (public.jsonb_object_numbers_between(physical, 0, 100)),
  goalkeeping jsonb not null default '{}'::jsonb
    check (public.jsonb_object_numbers_between(goalkeeping, 0, 100)),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_hidden_traits (
  player_id uuid primary key references public.players(id) on delete cascade,
  technical_talent numeric(5,2) not null check (technical_talent between 0 and 100),
  mental_talent numeric(5,2) not null check (mental_talent between 0 and 100),
  physical_talent numeric(5,2) not null check (physical_talent between 0 and 100),
  tactical_talent numeric(5,2) not null check (tactical_talent between 0 and 100),
  goalkeeping_talent numeric(5,2) not null check (goalkeeping_talent between 0 and 100),
  potential_ceiling numeric(5,2) not null check (potential_ceiling between 0 and 100),
  development_consistency numeric(5,2) not null check (development_consistency between 0 and 100),
  professionalism_hidden numeric(5,2) not null check (professionalism_hidden between 0 and 100),
  adaptability_hidden numeric(5,2) not null check (adaptability_hidden between 0 and 100),
  injury_proneness_hidden numeric(5,2) not null check (injury_proneness_hidden between 0 and 100),
  big_match_temperament_hidden numeric(5,2) not null check (big_match_temperament_hidden between 0 and 100),
  pressure_resistance_hidden numeric(5,2) not null check (pressure_resistance_hidden between 0 and 100),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_position_aptitudes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  position text not null check (position in (
    'GK','RB','RWB','CB','LB','LWB','DM','CM','AM','RM','LM','RW','LW','SS','ST'
  )),
  aptitude numeric(5,2) not null check (aptitude between 0 and 100),
  minutes_played integer not null default 0 check (minutes_played >= 0),
  training_minutes integer not null default 0 check (training_minutes >= 0),
  updated_at timestamptz not null default now(),
  unique (player_id, position)
);

create table if not exists public.player_role_aptitudes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  role text not null check (role in (
    'sweeper_keeper','defensive_goalkeeper','defensive_fullback','support_fullback','wingback',
    'ball_playing_defender','cover_defender','holding_midfielder','deep_playmaker',
    'box_to_box','advanced_playmaker','attacking_midfielder','wide_winger','inverted_winger',
    'second_striker','target_forward','mobile_forward'
  )),
  aptitude numeric(5,2) not null check (aptitude between 0 and 100),
  minutes_played integer not null default 0 check (minutes_played >= 0),
  training_minutes integer not null default 0 check (training_minutes >= 0),
  updated_at timestamptz not null default now(),
  unique (player_id, role)
);

create table if not exists public.player_personality_concepts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  concept text not null check (concept in (
    'diligence','ambition','learning','autonomy','loyalty','stability','sociability',
    'recognition','discipline','contention','innovation','resilience','integrity',
    'competitiveness','professionalism','leadership','emotional_control','club_attachment',
    'financial_interest'
  )),
  level integer not null check (level between 0 and 5),
  is_core boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (player_id, concept)
);

create table if not exists public.player_status (
  player_id uuid primary key references public.players(id) on delete cascade,
  morale numeric(5,2) not null default 60 check (morale between 0 and 100),
  confidence numeric(5,2) not null default 55 check (confidence between 0 and 100),
  club_satisfaction numeric(5,2) not null default 60 check (club_satisfaction between 0 and 100),
  coach_trust numeric(5,2) not null default 55 check (coach_trust between 0 and 100),
  leadership_trust numeric(5,2) not null default 55 check (leadership_trust between 0 and 100),
  match_fitness numeric(5,2) not null default 70 check (match_fitness between 0 and 100),
  sharpness numeric(5,2) not null default 62 check (sharpness between 0 and 100),
  fatigue numeric(5,2) not null default 8 check (fatigue between 0 and 100),
  physical_condition numeric(5,2) not null default 92 check (physical_condition between 0 and 100),
  tactical_familiarity numeric(5,2) not null default 45 check (tactical_familiarity between 0 and 100),
  training_load numeric(5,2) not null default 45 check (training_load between 0 and 100),
  form_rating numeric(4,2) not null default 6.5 check (form_rating between 0 and 10),
  transfer_intent numeric(5,2) not null default 0 check (transfer_intent between 0 and 100),
  injury_status text not null default 'available' check (injury_status in ('available','limited','injured','recovering')),
  suspension_status text not null default 'available' check (suspension_status in ('available','suspended','at_risk')),
  last_daily_processed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_relationships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  target_type text not null check (target_type in ('player','employee','user','club','coach','psychologist','executive')),
  target_id text not null check (char_length(target_id) between 1 and 160),
  affinity numeric(5,2) not null default 50 check (affinity between 0 and 100),
  trust numeric(5,2) not null default 50 check (trust between 0 and 100),
  respect numeric(5,2) not null default 50 check (respect between 0 and 100),
  conflict numeric(5,2) not null default 0 check (conflict between 0 and 100),
  influence numeric(5,2) not null default 10 check (influence between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (player_id, target_type, target_id)
);

create table if not exists public.player_memories (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  memory_type text not null check (char_length(memory_type) between 2 and 80),
  importance integer not null default 2 check (importance between 1 and 5),
  emotional_weight numeric(5,2) not null default 0 check (emotional_weight between -100 and 100),
  summary text not null check (char_length(summary) between 3 and 1000),
  related_person_type text,
  related_person_id text,
  related_match_id uuid,
  deadline timestamptz,
  status text not null default 'active' check (status in ('active','resolved','expired','broken','fulfilled')),
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.player_contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  contract_start date not null,
  contract_end date not null check (contract_end > contract_start),
  monthly_salary numeric(14,2) not null default 0 check (monthly_salary >= 0),
  signing_bonus numeric(14,2) not null default 0 check (signing_bonus >= 0),
  release_clause numeric(14,2) check (release_clause is null or release_clause >= 0),
  squad_role_promised text not null check (squad_role_promised in (
    'franchise','starter','rotation','reserve','development','surplus'
  )),
  appearance_bonus numeric(14,2) not null default 0 check (appearance_bonus >= 0),
  goal_bonus numeric(14,2) not null default 0 check (goal_bonus >= 0),
  assist_bonus numeric(14,2) not null default 0 check (assist_bonus >= 0),
  clean_sheet_bonus numeric(14,2) not null default 0 check (clean_sheet_bonus >= 0),
  promotion_bonus numeric(14,2) not null default 0 check (promotion_bonus >= 0),
  title_bonus numeric(14,2) not null default 0 check (title_bonus >= 0),
  agent_expectation jsonb not null default '{}'::jsonb check (jsonb_typeof(agent_expectation) = 'object'),
  status text not null default 'active' check (status in ('active','expired','terminated','future')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists player_contracts_one_active_idx on public.player_contracts(player_id)
  where status = 'active';
create index if not exists player_contracts_club_end_idx on public.player_contracts(club_id, contract_end, status);

create table if not exists public.player_promises (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  promise_type text not null check (char_length(promise_type) between 2 and 80),
  description text not null check (char_length(description) between 3 and 600),
  deadline timestamptz,
  importance integer not null default 2 check (importance between 1 and 5),
  status text not null default 'active' check (status in ('active','fulfilled','broken','cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.player_training_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  training_date date not null,
  focus text not null check (char_length(focus) between 2 and 100),
  load numeric(5,2) not null check (load between 0 and 100),
  development_delta jsonb not null default '{}'::jsonb check (jsonb_typeof(development_delta) = 'object'),
  fatigue_delta numeric(5,2) not null default 0 check (fatigue_delta between -20 and 30),
  notes text,
  created_at timestamptz not null default now(),
  unique (player_id, training_date, focus)
);

create table if not exists public.player_injuries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  injury_type text not null check (char_length(injury_type) between 2 and 100),
  severity text not null check (severity in ('minor','moderate','serious','severe')),
  occurred_at timestamptz not null,
  diagnosed_at timestamptz,
  estimated_return_at timestamptz,
  actual_return_at timestamptz,
  status text not null default 'assessment' check (status in ('assessment','treatment','rehab','fit','closed')),
  source text not null check (source in ('training','match','other')),
  match_id uuid,
  medical_report jsonb not null default '{}'::jsonb check (jsonb_typeof(medical_report) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists public.player_suspensions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  competition text not null check (char_length(competition) between 2 and 120),
  reason text not null check (char_length(reason) between 2 and 160),
  matches_total integer not null check (matches_total between 1 and 20),
  matches_remaining integer not null check (matches_remaining between 0 and matches_total),
  status text not null default 'active' check (status in ('active','served','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_season_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  season text not null check (char_length(season) between 4 and 20),
  competition text not null check (char_length(competition) between 2 and 120),
  appearances integer not null default 0 check (appearances >= 0),
  starts integer not null default 0 check (starts >= 0),
  minutes integer not null default 0 check (minutes >= 0),
  goals integer not null default 0 check (goals >= 0),
  assists integer not null default 0 check (assists >= 0),
  yellow_cards integer not null default 0 check (yellow_cards >= 0),
  red_cards integer not null default 0 check (red_cards >= 0),
  average_rating numeric(4,2) not null default 0 check (average_rating between 0 and 10),
  extended_stats jsonb not null default '{}'::jsonb check (jsonb_typeof(extended_stats) = 'object'),
  updated_at timestamptz not null default now(),
  unique (player_id, season, competition)
);

create table if not exists public.player_career_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_name text not null check (char_length(club_name) between 2 and 120),
  season_start integer not null check (season_start between 1950 and 2200),
  season_end integer check (season_end is null or season_end between season_start and 2200),
  appearances integer not null default 0 check (appearances >= 0),
  goals integer not null default 0 check (goals >= 0),
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.player_meeting_results (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  classification text not null check (char_length(classification) between 2 and 80),
  morale_delta numeric(5,2) not null default 0 check (morale_delta between -12 and 10),
  confidence_delta numeric(5,2) not null default 0 check (confidence_delta between -12 and 10),
  satisfaction_delta numeric(5,2) not null default 0 check (satisfaction_delta between -12 and 10),
  coach_trust_delta numeric(5,2) not null default 0 check (coach_trust_delta between -12 and 10),
  leadership_trust_delta numeric(5,2) not null default 0 check (leadership_trust_delta between -12 and 10),
  transfer_intent_delta numeric(5,2) not null default 0 check (transfer_intent_delta between -20 and 20),
  structured_reaction jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_reaction) = 'object'),
  created_at timestamptz not null default now(),
  unique (meeting_id, player_id)
);

create index if not exists player_position_aptitudes_player_idx on public.player_position_aptitudes(player_id, aptitude desc);
create index if not exists player_role_aptitudes_player_idx on public.player_role_aptitudes(player_id, aptitude desc);
create index if not exists player_personality_player_core_idx on public.player_personality_concepts(player_id, is_core);
create index if not exists player_relationships_target_idx on public.player_relationships(target_type, target_id);
create index if not exists player_memories_player_created_idx on public.player_memories(player_id, created_at desc);
create index if not exists player_promises_club_status_idx on public.player_promises(club_id, status, deadline);
create index if not exists player_training_player_date_idx on public.player_training_history(player_id, training_date desc);
create index if not exists player_injuries_player_status_idx on public.player_injuries(player_id, status, occurred_at desc);
create index if not exists player_suspensions_player_status_idx on public.player_suspensions(player_id, status);
create index if not exists player_season_stats_player_idx on public.player_season_stats(player_id, season, competition);
create index if not exists player_career_history_player_idx on public.player_career_history(player_id, season_start desc);
create index if not exists player_meeting_results_player_idx on public.player_meeting_results(player_id, created_at desc);

create or replace trigger players_set_updated_at before update on public.players
for each row execute function public.set_updated_at();
create or replace trigger player_attributes_set_updated_at before update on public.player_attributes
for each row execute function public.set_updated_at();
create or replace trigger player_hidden_traits_set_updated_at before update on public.player_hidden_traits
for each row execute function public.set_updated_at();
create or replace trigger player_position_aptitudes_set_updated_at before update on public.player_position_aptitudes
for each row execute function public.set_updated_at();
create or replace trigger player_role_aptitudes_set_updated_at before update on public.player_role_aptitudes
for each row execute function public.set_updated_at();
create or replace trigger player_personality_concepts_set_updated_at before update on public.player_personality_concepts
for each row execute function public.set_updated_at();
create or replace trigger player_status_set_updated_at before update on public.player_status
for each row execute function public.set_updated_at();
create or replace trigger player_relationships_set_updated_at before update on public.player_relationships
for each row execute function public.set_updated_at();
create or replace trigger player_contracts_set_updated_at before update on public.player_contracts
for each row execute function public.set_updated_at();
create or replace trigger player_suspensions_set_updated_at before update on public.player_suspensions
for each row execute function public.set_updated_at();
create or replace trigger player_season_stats_set_updated_at before update on public.player_season_stats
for each row execute function public.set_updated_at();

alter table public.players enable row level security;
alter table public.player_attributes enable row level security;
alter table public.player_hidden_traits enable row level security;
alter table public.player_position_aptitudes enable row level security;
alter table public.player_role_aptitudes enable row level security;
alter table public.player_personality_concepts enable row level security;
alter table public.player_status enable row level security;
alter table public.player_relationships enable row level security;
alter table public.player_memories enable row level security;
alter table public.player_contracts enable row level security;
alter table public.player_promises enable row level security;
alter table public.player_training_history enable row level security;
alter table public.player_injuries enable row level security;
alter table public.player_suspensions enable row level security;
alter table public.player_season_stats enable row level security;
alter table public.player_career_history enable row level security;
alter table public.player_meeting_results enable row level security;

create policy "players_select_owned_or_free" on public.players for select to authenticated
using (
  (club_id is null and status = 'free_agent')
  or exists (select 1 from public.clubs c where c.id = players.club_id and c.owner_id = (select auth.uid()))
);
create policy "player_attributes_select_owned_or_free" on public.player_attributes for select to authenticated
using (exists (
  select 1 from public.players p left join public.clubs c on c.id = p.club_id
  where p.id = player_attributes.player_id
    and ((p.club_id is null and p.status = 'free_agent') or c.owner_id = (select auth.uid()))
));
create policy "player_positions_select_owned_or_free" on public.player_position_aptitudes for select to authenticated
using (exists (
  select 1 from public.players p left join public.clubs c on c.id = p.club_id
  where p.id = player_position_aptitudes.player_id
    and ((p.club_id is null and p.status = 'free_agent') or c.owner_id = (select auth.uid()))
));
create policy "player_roles_select_owned_or_free" on public.player_role_aptitudes for select to authenticated
using (exists (
  select 1 from public.players p left join public.clubs c on c.id = p.club_id
  where p.id = player_role_aptitudes.player_id
    and ((p.club_id is null and p.status = 'free_agent') or c.owner_id = (select auth.uid()))
));
create policy "player_status_select_own" on public.player_status for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_status.player_id and c.owner_id = (select auth.uid())));
create policy "player_contracts_select_own" on public.player_contracts for select to authenticated
using (exists (select 1 from public.clubs c where c.id = player_contracts.club_id and c.owner_id = (select auth.uid())));
create policy "player_training_select_own" on public.player_training_history for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_training_history.player_id and c.owner_id = (select auth.uid())));
create policy "player_injuries_select_own" on public.player_injuries for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_injuries.player_id and c.owner_id = (select auth.uid())));
create policy "player_suspensions_select_own" on public.player_suspensions for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_suspensions.player_id and c.owner_id = (select auth.uid())));
create policy "player_season_stats_select_own" on public.player_season_stats for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_season_stats.player_id and c.owner_id = (select auth.uid())));
create policy "player_career_history_select_owned_or_free" on public.player_career_history for select to authenticated
using (exists (
  select 1 from public.players p left join public.clubs c on c.id = p.club_id
  where p.id = player_career_history.player_id
    and ((p.club_id is null and p.status = 'free_agent') or c.owner_id = (select auth.uid()))
));

create policy "player_hidden_traits_select_own" on public.player_hidden_traits for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_hidden_traits.player_id and c.owner_id = (select auth.uid())));
create policy "player_personality_select_own" on public.player_personality_concepts for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_personality_concepts.player_id and c.owner_id = (select auth.uid())));
create policy "player_relationships_select_own" on public.player_relationships for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_relationships.player_id and c.owner_id = (select auth.uid())));
create policy "player_memories_select_own" on public.player_memories for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_memories.player_id and c.owner_id = (select auth.uid())));
create policy "player_promises_select_own" on public.player_promises for select to authenticated
using (exists (select 1 from public.clubs c where c.id = player_promises.club_id and c.owner_id = (select auth.uid())));
create policy "player_meeting_results_select_own" on public.player_meeting_results for select to authenticated
using (exists (select 1 from public.players p join public.clubs c on c.id = p.club_id where p.id = player_meeting_results.player_id and c.owner_id = (select auth.uid())));

revoke all on public.players, public.player_attributes, public.player_hidden_traits,
  public.player_position_aptitudes, public.player_role_aptitudes,
  public.player_personality_concepts, public.player_status, public.player_relationships,
  public.player_memories, public.player_contracts, public.player_promises,
  public.player_training_history, public.player_injuries, public.player_suspensions,
  public.player_season_stats, public.player_career_history, public.player_meeting_results
from anon, authenticated;

grant select on public.players, public.player_attributes, public.player_position_aptitudes,
  public.player_role_aptitudes, public.player_status, public.player_contracts,
  public.player_training_history, public.player_injuries, public.player_suspensions,
  public.player_season_stats, public.player_career_history
to authenticated;

grant all on public.players, public.player_attributes, public.player_hidden_traits,
  public.player_position_aptitudes, public.player_role_aptitudes,
  public.player_personality_concepts, public.player_status, public.player_relationships,
  public.player_memories, public.player_contracts, public.player_promises,
  public.player_training_history, public.player_injuries, public.player_suspensions,
  public.player_season_stats, public.player_career_history, public.player_meeting_results
to service_role;

comment on table public.player_hidden_traits is 'Valores esportivos ocultos. Nunca retornar numeros exatos ao cliente.';
comment on table public.player_personality_concepts is 'Niveis ocultos; o cliente recebe apenas descricoes aproximadas calculadas no servidor.';
comment on table public.player_meeting_results is 'Impactos calculados pelo motor deterministico; a IA apenas narra a reacao estruturada.';
