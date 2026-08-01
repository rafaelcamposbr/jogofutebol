-- Persistent club operations, scouting, reports and relationship intelligence.

alter table public.clubs
  add column if not exists lifecycle_status text not null default 'active',
  add column if not exists closed_at timestamptz,
  add column if not exists closure_reason text;

alter table public.clubs drop constraint if exists clubs_lifecycle_status_check;
alter table public.clubs add constraint clubs_lifecycle_status_check
  check (lifecycle_status in ('active', 'closing', 'closed'));

alter table public.employees drop constraint if exists employees_club_id_fkey;
alter table public.employees alter column club_id drop not null;
alter table public.employees add constraint employees_club_id_fkey
  foreign key (club_id) references public.clubs(id) on delete set null;
alter table public.employees drop constraint if exists employees_role_group_check;
alter table public.employees add constraint employees_role_group_check
  check (role_group in ('coaches', 'technical', 'football', 'medical', 'administrative', 'operations'));
alter table public.employees drop constraint if exists employees_status_check;
alter table public.employees add constraint employees_status_check
  check (status in ('active', 'notice', 'resigned', 'fired', 'expired', 'market'));

alter table public.players drop constraint if exists players_club_id_fkey;
alter table public.players add constraint players_club_id_fkey
  foreign key (club_id) references public.clubs(id) on delete set null;
alter table public.players drop constraint if exists players_status_check;
alter table public.players add constraint players_status_check
  check (status in ('free_agent','tryout_candidate','on_trial','contracted','loaned_out','loaned_in','unavailable','retired'));
alter table public.players drop constraint if exists players_generated_source_check;
alter table public.players add constraint players_generated_source_check
  check (generated_source in ('initial_squad','free_agent_market','youth','tryout','manual','imported'));
alter table public.players drop constraint if exists players_check;
alter table public.players add constraint players_club_status_check check (
  (status in ('free_agent','tryout_candidate') and club_id is null)
  or (status not in ('free_agent','tryout_candidate') and club_id is not null)
);

alter table public.player_contracts
  add column if not exists contract_type text not null default 'professional',
  add column if not exists auto_renew boolean not null default false,
  add column if not exists source_tryout_candidate_id uuid,
  add column if not exists ended_at timestamptz,
  add column if not exists end_reason text;
alter table public.player_contracts drop constraint if exists player_contracts_contract_type_check;
alter table public.player_contracts add constraint player_contracts_contract_type_check
  check (contract_type in ('professional', 'trial'));

create table if not exists public.employee_roles (
  id text primary key,
  label text not null,
  group_id text not null check (group_id in ('football','medical','administrative','operations')),
  subgroup text not null,
  relevance integer not null check (relevance between 1 and 5),
  salary_min_cents bigint not null check (salary_min_cents >= 0),
  salary_max_cents bigint not null check (salary_max_cents >= salary_min_cents),
  reports_to_role_id text references public.employee_roles(id) on delete set null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.employee_roles (id,label,group_id,subgroup,relevance,salary_min_cents,salary_max_cents,reports_to_role_id) values
  ('football-executive','Executivo de Futebol','football','Gestao do futebol',5,1800000,9500000,null),
  ('football-supervisor','Supervisor de Futebol','football','Gestao do futebol',4,900000,4800000,'football-executive'),
  ('administrative-coordinator','Coordenador Administrativo','football','Gestao do futebol',3,700000,3500000,'football-executive'),
  ('supervision-assistant','Auxiliar de Supervisao','football','Gestao do futebol',2,400000,1800000,'football-supervisor'),
  ('head-coach','Tecnico','football','Equipe tecnica',5,1500000,18000000,'football-executive'),
  ('assistant-coach','Auxiliar Tecnico','football','Equipe tecnica',3,700000,4500000,'head-coach'),
  ('fitness-coach','Preparador Fisico','football','Equipe tecnica',3,700000,4200000,'head-coach'),
  ('goalkeeper-coach','Treinador de Goleiros','football','Equipe tecnica',3,650000,3800000,'head-coach'),
  ('performance-analysis-coordinator','Coordenador de Analise de Desempenho','football','Equipe tecnica',4,900000,4800000,'head-coach'),
  ('performance-analyst','Analista de Desempenho','football','Equipe tecnica',3,600000,3200000,'performance-analysis-coordinator'),
  ('scout','Olheiro','football','Equipe tecnica',3,600000,4200000,'football-executive'),
  ('doctor','Medico','medical','Saude',5,1800000,8500000,null),
  ('psychologist','Psicologo','medical','Saude',3,700000,3500000,'doctor'),
  ('physiologist','Fisiologista','medical','Saude',3,800000,4000000,'doctor'),
  ('physiotherapy-coordinator','Coordenador de Fisioterapia','medical','Saude',4,1000000,4800000,'doctor'),
  ('physiotherapist','Fisioterapeuta','medical','Saude',3,700000,3600000,'physiotherapy-coordinator'),
  ('nurse','Enfermeiro','medical','Saude',2,500000,2200000,'doctor'),
  ('masseur','Massagista','medical','Saude',2,400000,1800000,'physiotherapy-coordinator'),
  ('podiatrist','Podologo','medical','Saude',2,500000,2400000,'doctor'),
  ('nutritionist','Nutricionista','medical','Saude',3,700000,3400000,'doctor')
on conflict (id) do update set
  label=excluded.label, group_id=excluded.group_id, subgroup=excluded.subgroup,
  relevance=excluded.relevance, salary_min_cents=excluded.salary_min_cents,
  salary_max_cents=excluded.salary_max_cents, reports_to_role_id=excluded.reports_to_role_id,
  is_active=true, updated_at=now();

create table if not exists public.room_operations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation_type text not null check (operation_type in ('purchase','rent','expansion')),
  room_type text not null check (char_length(room_type) between 2 and 80),
  cost_cents bigint not null check (cost_cents >= 0),
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  started_at timestamptz not null default now(),
  completes_at timestamptz not null,
  completed_at timestamptz,
  charged_at timestamptz not null default now(),
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completes_at > started_at)
);
create index if not exists room_operations_due_idx on public.room_operations(status, completes_at);

create table if not exists public.tryouts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  scout_employee_id uuid not null references public.employees(id) on delete restrict,
  preparation_days integer not null check (preparation_days between 1 and 30),
  cost_cents bigint not null default 145688 check (cost_cents = 145688),
  focus text not null check (focus in ('broad','technical','physical','tactical','goalkeeper','offensive','defensive')),
  status text not null default 'preparing' check (status in ('preparing','processing','completed','cancelled','failed')),
  seed text not null,
  scout_quality numeric(5,2) not null check (scout_quality between 0 and 100),
  preparation_quality numeric(5,2) not null check (preparation_quality between 0 and 100),
  selection_quality numeric(5,2) not null check (selection_quality between 0 and 100),
  candidate_count integer check (candidate_count is null or candidate_count between 4 and 50),
  started_at timestamptz not null default now(),
  completes_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists tryouts_one_active_per_scout_idx
  on public.tryouts(scout_employee_id) where status in ('preparing','processing');
create index if not exists tryouts_club_due_idx on public.tryouts(club_id,status,completes_at);

create table if not exists public.tryout_preferences (
  tryout_id uuid primary key references public.tryouts(id) on delete cascade,
  age_min integer not null default 16 check (age_min between 14 and 40),
  age_max integer not null default 24 check (age_max between age_min and 45),
  positions text[] not null default '{}',
  region text,
  max_per_position integer not null default 8 check (max_per_position between 1 and 50),
  focus text not null,
  scout_comments text check (scout_comments is null or char_length(scout_comments) <= 600),
  created_at timestamptz not null default now()
);

create table if not exists public.tryout_candidates (
  id uuid primary key default gen_random_uuid(),
  tryout_id uuid not null references public.tryouts(id) on delete cascade,
  player_id uuid not null unique references public.players(id) on delete cascade,
  estimated_position text not null,
  observed_profile jsonb not null default '{}'::jsonb check (jsonb_typeof(observed_profile)='object'),
  confidence integer not null check (confidence between 10 and 95),
  recommendation text not null check (recommendation in ('trial','observe','release')),
  status text not null default 'available' check (status in ('available','on_trial','released','expired','professional')),
  trial_available_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tryout_candidates_tryout_idx on public.tryout_candidates(tryout_id,status);
alter table public.player_contracts drop constraint if exists player_contracts_source_tryout_candidate_id_fkey;
alter table public.player_contracts add constraint player_contracts_source_tryout_candidate_id_fkey
  foreign key (source_tryout_candidate_id) references public.tryout_candidates(id) on delete set null;

create table if not exists public.player_observations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  author_employee_id uuid references public.employees(id) on delete set null,
  observation_type text not null,
  quality numeric(5,2) not null check (quality between 0 and 100),
  data_quality numeric(5,2) not null check (data_quality between 0 and 100),
  notes text,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.player_reports (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  author_employee_id uuid references public.employees(id) on delete set null,
  author_name text not null,
  author_role text not null,
  report_version integer not null default 1 check (report_version >= 1),
  precision integer not null check (precision between 10 and 95),
  uncertainty integer not null check (uncertainty between 3 and 27),
  confidence_label text not null,
  age_status text not null check (age_status in ('current','update_needed','outdated','unreliable')),
  summary text not null,
  caveats text[] not null default '{}',
  recommendation text not null,
  created_at timestamptz not null default now(),
  valid_until timestamptz not null
);
create index if not exists player_reports_player_created_idx on public.player_reports(club_id,player_id,created_at desc);

create table if not exists public.player_report_estimates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.player_reports(id) on delete cascade,
  category text not null,
  estimate_label text not null,
  lower_bound integer not null check (lower_bound between 0 and 100),
  upper_bound integer not null check (upper_bound between lower_bound and 100),
  central_estimate integer not null check (central_estimate between lower_bound and upper_bound),
  created_at timestamptz not null default now(),
  unique (report_id, category)
);

create table if not exists public.player_report_consensus (
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  category text not null,
  consensus_label text not null,
  lower_bound integer not null check (lower_bound between 0 and 100),
  upper_bound integer not null check (upper_bound between lower_bound and 100),
  confidence integer not null check (confidence between 0 and 100),
  divergence integer not null check (divergence between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (club_id,player_id,category)
);

create table if not exists public.player_negotiations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  trial_contract_id uuid references public.player_contracts(id) on delete set null,
  status text not null default 'open' check (status in ('open','countered','accepted','rejected','time_requested','cancelled')),
  proposed_role text not null,
  monthly_salary numeric(14,2) not null check (monthly_salary >= 0),
  signing_bonus numeric(14,2) not null default 0 check (signing_bonus >= 0),
  contract_months integer not null check (contract_months between 1 and 60),
  counter_offer jsonb not null default '{}'::jsonb check (jsonb_typeof(counter_offer)='object'),
  expires_at timestamptz not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists player_negotiations_one_open_idx
  on public.player_negotiations(player_id,club_id) where status in ('open','countered','time_requested');

create table if not exists public.character_relationships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  source_type text not null check (source_type in ('user','employee','player','department')),
  source_id text not null,
  target_type text not null check (target_type in ('user','employee','player','department')),
  target_id text not null,
  familiarity numeric(5,2) not null default 0 check (familiarity between 0 and 100),
  affinity numeric(5,2) not null default 50 check (affinity between 0 and 100),
  trust numeric(5,2) not null default 50 check (trust between 0 and 100),
  respect numeric(5,2) not null default 50 check (respect between 0 and 100),
  tension numeric(5,2) not null default 0 check (tension between 0 and 100),
  professional_alignment numeric(5,2) not null default 50 check (professional_alignment between 0 and 100),
  influence numeric(5,2) not null default 10 check (influence between 0 and 100),
  compatibility_base numeric(5,2) not null check (compatibility_base between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (club_id,source_type,source_id,target_type,target_id),
  check (source_type <> target_type or source_id <> target_id)
);

create table if not exists public.relationship_events (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.character_relationships(id) on delete cascade,
  event_type text not null,
  deltas jsonb not null check (jsonb_typeof(deltas)='object'),
  severity integer not null default 1 check (severity between 1 and 5),
  propagated_from_event_id uuid references public.relationship_events(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.relationship_memories (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.character_relationships(id) on delete cascade,
  summary text not null,
  importance integer not null default 2 check (importance between 1 and 5),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.club_bankruptcy_requests (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete cascade,
  club_name_confirmation text not null,
  status text not null default 'pending' check (status in ('pending','cancelled','completed')),
  requested_at timestamptz not null default now(),
  effective_at timestamptz not null,
  cancel_deadline timestamptz not null,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (cancel_deadline = effective_at - interval '15 minutes')
);
create unique index if not exists club_bankruptcy_one_pending_idx
  on public.club_bankruptcy_requests(club_id) where status='pending';

create table if not exists public.club_closure_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete restrict,
  owner_id uuid references auth.users(id) on delete set null,
  request_id uuid references public.club_bankruptcy_requests(id) on delete set null,
  event_type text not null check (event_type in ('requested','cancelled','completed')),
  public_club_name text not null default 'Clube encerrado',
  private_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(private_metadata)='object'),
  created_at timestamptz not null default now()
);

create or replace function public.start_room_operation(
  p_user_id uuid, p_operation_type text, p_room_type text, p_cost_cents bigint
) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_club public.clubs%rowtype; v_id uuid;
begin
  if p_operation_type not in ('purchase','rent','expansion') or p_cost_cents < 0 then raise exception 'invalid_room_operation'; end if;
  select * into v_club from public.clubs where owner_id=p_user_id for update;
  if v_club.id is null or v_club.lifecycle_status <> 'active' then raise exception 'club_unavailable'; end if;
  if v_club.cash_balance < p_cost_cents::numeric / 100 then raise exception 'insufficient_funds'; end if;
  update public.clubs set cash_balance=cash_balance-(p_cost_cents::numeric/100),updated_at=now() where id=v_club.id;
  insert into public.room_operations(club_id,owner_id,operation_type,room_type,cost_cents,started_at,completes_at)
  values(v_club.id,p_user_id,p_operation_type,p_room_type,p_cost_cents,now(),now()+interval '2 hours') returning id into v_id;
  return v_id;
end $$;

create or replace function public.process_due_room_operations(p_user_id uuid, p_now timestamptz default now())
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_count integer;
begin
  update public.room_operations set status='completed',completed_at=p_now,updated_at=now(),
    result=jsonb_build_object('completedBy','server_clock')
  where owner_id=p_user_id and status='pending' and completes_at<=p_now;
  get diagnostics v_count=row_count; return v_count;
end $$;

create or replace function public.start_club_tryout(
  p_user_id uuid, p_scout_id uuid, p_days integer, p_preferences jsonb
) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_club public.clubs%rowtype; v_employee public.employees%rowtype; v_id uuid; v_scout numeric; v_prep numeric; v_selection numeric; v_focus text; v_positions text[] := '{}';
begin
  if p_days < 1 or p_days > 30 or jsonb_typeof(p_preferences) <> 'object' then raise exception 'invalid_tryout_preferences'; end if;
  v_focus := coalesce(p_preferences->>'focus','broad');
  if v_focus not in ('broad','technical','physical','tactical','goalkeeper','offensive','defensive') then raise exception 'invalid_tryout_focus'; end if;
  select * into v_club from public.clubs where owner_id=p_user_id for update;
  if v_club.id is null or v_club.lifecycle_status <> 'active' then raise exception 'club_unavailable'; end if;
  select * into v_employee from public.employees where id=p_scout_id and club_id=v_club.id and status='active' for update;
  if v_employee.id is null or v_employee.role_id <> 'scout' or v_employee.role_group not in ('football','technical') then raise exception 'active_scout_required'; end if;
  if exists(select 1 from public.tryouts where scout_employee_id=p_scout_id and status in ('preparing','processing')) then raise exception 'scout_already_assigned'; end if;
  if v_club.cash_balance < 1456.88 then raise exception 'insufficient_funds'; end if;
  v_scout := greatest(0,least(100,coalesce((v_employee.aptitudes->>'scouting')::numeric,50)+coalesce((v_employee.natural_talents->>'scouting')::numeric,0)+coalesce((v_employee.temporary_modifiers->>'scouting')::numeric,0)));
  v_prep := least(100,18*sqrt(p_days)); v_selection := .65*v_scout+.35*v_prep;
  select coalesce(array_agg(item), '{}') into v_positions
  from jsonb_array_elements_text(coalesce(p_preferences->'positions','[]'::jsonb)) as item;
  update public.clubs set cash_balance=cash_balance-1456.88,updated_at=now() where id=v_club.id;
  insert into public.tryouts(club_id,owner_id,scout_employee_id,preparation_days,focus,seed,scout_quality,preparation_quality,selection_quality,started_at,completes_at)
  values(v_club.id,p_user_id,p_scout_id,p_days,v_focus,encode(digest(v_club.id::text||':'||p_scout_id::text||':'||clock_timestamp()::text,'sha256'),'hex'),v_scout,v_prep,v_selection,now(),now()+make_interval(days=>p_days)) returning id into v_id;
  insert into public.tryout_preferences(tryout_id,age_min,age_max,positions,region,max_per_position,focus,scout_comments)
  values(v_id,coalesce((p_preferences->>'ageMin')::integer,16),coalesce((p_preferences->>'ageMax')::integer,24),
    v_positions,p_preferences->>'region',
    coalesce((p_preferences->>'maxPerPosition')::integer,8),v_focus,p_preferences->>'comments');
  return v_id;
end $$;

create or replace function public.claim_due_tryout(p_user_id uuid, p_tryout_id uuid, p_now timestamptz default now())
returns public.tryouts language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_row public.tryouts%rowtype;
begin
  update public.tryouts set status='processing',updated_at=now()
  where id=p_tryout_id and owner_id=p_user_id and status='preparing' and completes_at<=p_now returning * into v_row;
  if v_row.id is null then raise exception 'tryout_not_due'; end if; return v_row;
end $$;

create or replace function public.start_player_trial(p_user_id uuid, p_candidate_id uuid)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_candidate public.tryout_candidates%rowtype; v_tryout public.tryouts%rowtype; v_contract_id uuid;
begin
  select * into v_candidate from public.tryout_candidates where id=p_candidate_id for update;
  select * into v_tryout from public.tryouts where id=v_candidate.tryout_id and owner_id=p_user_id;
  if v_candidate.id is null or v_tryout.id is null or v_candidate.status <> 'available' or v_candidate.trial_available_until<now() then raise exception 'candidate_unavailable'; end if;
  update public.players set club_id=v_tryout.club_id,status='on_trial',squad_role='development',updated_at=now() where id=v_candidate.player_id and status='tryout_candidate';
  if not found then raise exception 'candidate_player_unavailable'; end if;
  insert into public.player_contracts(player_id,club_id,contract_start,contract_end,monthly_salary,signing_bonus,release_clause,squad_role_promised,status,contract_type,auto_renew,source_tryout_candidate_id)
  values(v_candidate.player_id,v_tryout.club_id,current_date,current_date+30,0,0,null,'development','active','trial',false,v_candidate.id) returning id into v_contract_id;
  update public.tryout_candidates set status='on_trial',updated_at=now() where id=v_candidate.id;
  return v_contract_id;
end $$;

create or replace function public.process_expired_trial_contracts(p_now timestamptz default now())
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_count integer;
begin
  delete from public.lineup_players lp using public.player_contracts pc
    where pc.player_id=lp.player_id and pc.contract_type='trial' and pc.status='active' and pc.contract_end<p_now::date;
  update public.players p set club_id=null,status='free_agent',squad_number=null,updated_at=now()
    from public.player_contracts pc where pc.player_id=p.id and pc.contract_type='trial' and pc.status='active' and pc.contract_end<p_now::date;
  update public.player_contracts set status='expired',ended_at=p_now,end_reason='trial_expired',updated_at=now()
    where contract_type='trial' and status='active' and contract_end<p_now::date;
  get diagnostics v_count=row_count; return v_count;
end $$;

create or replace function public.offer_professional_player_contract(
  p_user_id uuid, p_player_id uuid, p_role text, p_monthly_salary numeric,
  p_signing_bonus numeric, p_contract_months integer
) returns public.player_negotiations language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_club public.clubs%rowtype; v_player public.players%rowtype; v_trial public.player_contracts%rowtype;
  v_expected numeric; v_ratio numeric; v_status text; v_counter numeric; v_negotiation public.player_negotiations%rowtype;
begin
  if p_role not in ('franchise','starter','rotation','reserve','development','surplus') or p_monthly_salary<0 or p_signing_bonus<0 or p_contract_months<1 or p_contract_months>60 then raise exception 'invalid_contract_offer'; end if;
  select * into v_club from public.clubs where owner_id=p_user_id for update;
  if v_club.id is null or v_club.lifecycle_status<>'active' then raise exception 'club_unavailable'; end if;
  select * into v_player from public.players where id=p_player_id and club_id=v_club.id and status='on_trial' for update;
  select * into v_trial from public.player_contracts where player_id=p_player_id and club_id=v_club.id and contract_type='trial' and status='active' for update;
  if v_player.id is null or v_trial.id is null then raise exception 'active_trial_required'; end if;
  if exists(select 1 from public.player_negotiations where player_id=p_player_id and club_id=v_club.id and status in ('open','countered','time_requested')) then raise exception 'negotiation_already_open'; end if;
  v_expected:=greatest(6000,round((v_player.current_overall*v_player.current_overall*5)::numeric,2));
  v_ratio:=case when v_expected=0 then 1 else p_monthly_salary/v_expected end;
  v_status:=case when v_ratio>=.95 then 'accepted' when v_ratio>=.78 then 'countered' when v_ratio>=.65 then 'time_requested' else 'rejected' end;
  v_counter:=round(v_expected*1.02,2);
  if v_status='accepted' and v_club.cash_balance<p_signing_bonus then raise exception 'insufficient_funds'; end if;
  insert into public.player_negotiations(club_id,player_id,trial_contract_id,status,proposed_role,monthly_salary,signing_bonus,contract_months,counter_offer,expires_at,resolved_at)
  values(v_club.id,p_player_id,v_trial.id,v_status,p_role,p_monthly_salary,p_signing_bonus,p_contract_months,
    case when v_status='countered' then jsonb_build_object('monthlySalary',v_counter,'role',p_role,'contractMonths',p_contract_months) else '{}'::jsonb end,
    now()+interval '5 days',case when v_status in ('accepted','rejected') then now() else null end) returning * into v_negotiation;
  if v_status='accepted' then
    update public.player_contracts set status='terminated',ended_at=now(),end_reason='converted_to_professional',updated_at=now() where id=v_trial.id;
    update public.tryout_candidates set status='professional',updated_at=now() where id=v_trial.source_tryout_candidate_id;
    update public.clubs set cash_balance=cash_balance-p_signing_bonus,updated_at=now() where id=v_club.id;
    insert into public.player_contracts(player_id,club_id,contract_start,contract_end,monthly_salary,signing_bonus,release_clause,squad_role_promised,status,contract_type,auto_renew)
    values(p_player_id,v_club.id,current_date,(current_date+make_interval(months=>p_contract_months))::date,p_monthly_salary,p_signing_bonus,null,p_role,'active','professional',false);
    update public.players set status='contracted',squad_role=p_role,updated_at=now() where id=p_player_id;
  end if;
  return v_negotiation;
end $$;

create or replace function public.accept_professional_player_counter(p_user_id uuid,p_negotiation_id uuid)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_neg public.player_negotiations%rowtype; v_trial public.player_contracts%rowtype; v_salary numeric; v_club public.clubs%rowtype;
begin
  select n.* into v_neg from public.player_negotiations n join public.clubs c on c.id=n.club_id where n.id=p_negotiation_id and c.owner_id=p_user_id and n.status='countered' and n.expires_at>now() for update of n;
  if v_neg.id is null then raise exception 'counter_unavailable'; end if;
  select * into v_club from public.clubs where id=v_neg.club_id and lifecycle_status='active' for update;
  select * into v_trial from public.player_contracts where id=v_neg.trial_contract_id and status='active' for update;
  if v_club.id is null or v_trial.id is null then raise exception 'active_trial_required'; end if;
  v_salary:=(v_neg.counter_offer->>'monthlySalary')::numeric;
  if v_club.cash_balance<v_neg.signing_bonus then raise exception 'insufficient_funds'; end if;
  update public.player_contracts set status='terminated',ended_at=now(),end_reason='converted_to_professional',updated_at=now() where id=v_trial.id;
  insert into public.player_contracts(player_id,club_id,contract_start,contract_end,monthly_salary,signing_bonus,release_clause,squad_role_promised,status,contract_type,auto_renew)
  values(v_neg.player_id,v_neg.club_id,current_date,(current_date+make_interval(months=>v_neg.contract_months))::date,v_salary,v_neg.signing_bonus,null,v_neg.proposed_role,'active','professional',false);
  update public.players set status='contracted',squad_role=v_neg.proposed_role,updated_at=now() where id=v_neg.player_id;
  update public.tryout_candidates set status='professional',updated_at=now() where id=v_trial.source_tryout_candidate_id;
  update public.clubs set cash_balance=cash_balance-v_neg.signing_bonus,updated_at=now() where id=v_club.id;
  update public.player_negotiations set status='accepted',monthly_salary=v_salary,resolved_at=now(),updated_at=now() where id=v_neg.id;
  return v_neg.id;
end $$;

create or replace function public.request_club_bankruptcy(p_user_id uuid, p_club_name text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_club public.clubs%rowtype; v_id uuid; v_effective timestamptz:=now()+interval '2 hours';
begin
  select * into v_club from public.clubs where owner_id=p_user_id for update;
  if v_club.id is null or v_club.lifecycle_status<>'active' then raise exception 'club_unavailable'; end if;
  if btrim(p_club_name)<>v_club.name then raise exception 'club_name_confirmation_mismatch'; end if;
  insert into public.club_bankruptcy_requests(club_id,owner_id,club_name_confirmation,effective_at,cancel_deadline)
  values(v_club.id,p_user_id,p_club_name,v_effective,v_effective-interval '15 minutes') returning id into v_id;
  update public.clubs set lifecycle_status='closing',updated_at=now() where id=v_club.id;
  insert into public.club_closure_events(club_id,owner_id,request_id,event_type,private_metadata)
  values(v_club.id,p_user_id,v_id,'requested',jsonb_build_object('effectiveAt',v_effective));
  return v_id;
end $$;

create or replace function public.cancel_club_bankruptcy(p_user_id uuid, p_request_id uuid)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_request public.club_bankruptcy_requests%rowtype;
begin
  select * into v_request from public.club_bankruptcy_requests where id=p_request_id and owner_id=p_user_id and status='pending' for update;
  if v_request.id is null then raise exception 'bankruptcy_request_unavailable'; end if;
  if now()>=v_request.cancel_deadline then raise exception 'bankruptcy_cancellation_closed'; end if;
  update public.club_bankruptcy_requests set status='cancelled',cancelled_at=now() where id=v_request.id;
  update public.clubs set lifecycle_status='active',updated_at=now() where id=v_request.club_id;
  insert into public.club_closure_events(club_id,owner_id,request_id,event_type) values(v_request.club_id,p_user_id,v_request.id,'cancelled');
  return v_request.id;
end $$;

create or replace function public.process_due_bankruptcies(p_now timestamptz default now())
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_request public.club_bankruptcy_requests%rowtype; v_count integer:=0; v_old_name text;
begin
  for v_request in select * from public.club_bankruptcy_requests where status='pending' and effective_at<=p_now for update skip locked loop
    select name into v_old_name from public.clubs where id=v_request.club_id for update;
    update public.player_contracts set status='terminated',ended_at=p_now,end_reason='club_closed',updated_at=now()
      where club_id=v_request.club_id and status in ('active','future');
    delete from public.lineup_players lp using public.lineups l where l.id=lp.lineup_id and l.club_id=v_request.club_id;
    update public.players set club_id=null,status='free_agent',squad_number=null,updated_at=now() where club_id=v_request.club_id and status<>'retired';
    update public.employees set club_id=null,status='market',contract_end_at=p_now,updated_at=now() where club_id=v_request.club_id;
    delete from public.club_members where club_id=v_request.club_id;
    update public.clubs set owner_id=null,name='Clube encerrado',short_name='Clube encerrado',abbreviation='ENC',
      hashtag='#encerrado'||substr(replace(id::text,'-',''),1,12),lifecycle_status='closed',closed_at=p_now,
      closure_reason='bankruptcy',cash_balance=0,crest_url=null,mascot=null,updated_at=now() where id=v_request.club_id;
    update public.club_bankruptcy_requests set status='completed',completed_at=p_now where id=v_request.id;
    insert into public.club_closure_events(club_id,owner_id,request_id,event_type,private_metadata)
      values(v_request.club_id,v_request.owner_id,v_request.id,'completed',jsonb_build_object('previousNameHash',encode(digest(v_old_name,'sha256'),'hex')));
    v_count:=v_count+1;
  end loop; return v_count;
end $$;

alter table public.employee_roles enable row level security;
alter table public.room_operations enable row level security;
alter table public.tryouts enable row level security;
alter table public.tryout_preferences enable row level security;
alter table public.tryout_candidates enable row level security;
alter table public.player_observations enable row level security;
alter table public.player_reports enable row level security;
alter table public.player_report_estimates enable row level security;
alter table public.player_report_consensus enable row level security;
alter table public.player_negotiations enable row level security;
alter table public.character_relationships enable row level security;
alter table public.relationship_events enable row level security;
alter table public.relationship_memories enable row level security;
alter table public.club_bankruptcy_requests enable row level security;
alter table public.club_closure_events enable row level security;

create policy "employee_roles_read" on public.employee_roles for select to authenticated using (is_active);
create policy "room_operations_owner_read" on public.room_operations for select to authenticated using (owner_id=(select auth.uid()));
create policy "tryouts_owner_read" on public.tryouts for select to authenticated using (owner_id=(select auth.uid()));
create policy "tryout_preferences_owner_read" on public.tryout_preferences for select to authenticated using (exists(select 1 from public.tryouts t where t.id=tryout_id and t.owner_id=(select auth.uid())));
create policy "tryout_candidates_owner_read" on public.tryout_candidates for select to authenticated using (exists(select 1 from public.tryouts t where t.id=tryout_id and t.owner_id=(select auth.uid())));
create policy "player_observations_owner_read" on public.player_observations for select to authenticated using (exists(select 1 from public.clubs c where c.id=club_id and c.owner_id=(select auth.uid())));
create policy "player_reports_owner_read" on public.player_reports for select to authenticated using (exists(select 1 from public.clubs c where c.id=club_id and c.owner_id=(select auth.uid())));
create policy "player_report_estimates_owner_read" on public.player_report_estimates for select to authenticated using (exists(select 1 from public.player_reports r join public.clubs c on c.id=r.club_id where r.id=report_id and c.owner_id=(select auth.uid())));
create policy "player_report_consensus_owner_read" on public.player_report_consensus for select to authenticated using (exists(select 1 from public.clubs c where c.id=club_id and c.owner_id=(select auth.uid())));
create policy "player_negotiations_owner_read" on public.player_negotiations for select to authenticated using (exists(select 1 from public.clubs c where c.id=club_id and c.owner_id=(select auth.uid())));
create policy "character_relationships_owner_read" on public.character_relationships for select to authenticated using (exists(select 1 from public.clubs c where c.id=club_id and c.owner_id=(select auth.uid())));
create policy "relationship_events_owner_read" on public.relationship_events for select to authenticated using (exists(select 1 from public.character_relationships r join public.clubs c on c.id=r.club_id where r.id=relationship_id and c.owner_id=(select auth.uid())));
create policy "relationship_memories_owner_read" on public.relationship_memories for select to authenticated using (exists(select 1 from public.character_relationships r join public.clubs c on c.id=r.club_id where r.id=relationship_id and c.owner_id=(select auth.uid())));
create policy "bankruptcy_requests_owner_read" on public.club_bankruptcy_requests for select to authenticated using (owner_id=(select auth.uid()));
create policy "closure_events_owner_read" on public.club_closure_events for select to authenticated using (owner_id=(select auth.uid()));

revoke all on public.employee_roles,public.room_operations,public.tryouts,public.tryout_preferences,public.tryout_candidates,
  public.player_observations,public.player_reports,public.player_report_estimates,public.player_report_consensus,
  public.player_negotiations,public.character_relationships,public.relationship_events,public.relationship_memories,
  public.club_bankruptcy_requests,public.club_closure_events from anon,authenticated;
grant select on public.employee_roles to authenticated;
grant all on public.employee_roles,public.room_operations,public.tryouts,public.tryout_preferences,public.tryout_candidates,
  public.player_observations,public.player_reports,public.player_report_estimates,public.player_report_consensus,
  public.player_negotiations,public.character_relationships,public.relationship_events,public.relationship_memories,
  public.club_bankruptcy_requests,public.club_closure_events to service_role;

revoke select on public.players,public.player_attributes,public.player_hidden_traits,
  public.player_position_aptitudes,public.player_role_aptitudes,public.player_personality_concepts from authenticated;

revoke all on function public.start_room_operation(uuid,text,text,bigint),
  public.process_due_room_operations(uuid,timestamptz),public.start_club_tryout(uuid,uuid,integer,jsonb),
  public.claim_due_tryout(uuid,uuid,timestamptz),public.start_player_trial(uuid,uuid),
  public.process_expired_trial_contracts(timestamptz),public.request_club_bankruptcy(uuid,text),
  public.offer_professional_player_contract(uuid,uuid,text,numeric,numeric,integer),public.accept_professional_player_counter(uuid,uuid),
  public.cancel_club_bankruptcy(uuid,uuid),public.process_due_bankruptcies(timestamptz)
from public,anon,authenticated;
grant execute on function public.start_room_operation(uuid,text,text,bigint),
  public.process_due_room_operations(uuid,timestamptz),public.start_club_tryout(uuid,uuid,integer,jsonb),
  public.claim_due_tryout(uuid,uuid,timestamptz),public.start_player_trial(uuid,uuid),
  public.process_expired_trial_contracts(timestamptz),public.request_club_bankruptcy(uuid,text),
  public.offer_professional_player_contract(uuid,uuid,text,numeric,numeric,integer),public.accept_professional_player_counter(uuid,uuid),
  public.cancel_club_bankruptcy(uuid,uuid),public.process_due_bankruptcies(timestamptz)
to service_role;

comment on table public.player_reports is 'Safe scouting reports. Exact hidden values must never be stored in report text or returned to clients.';
comment on table public.player_report_estimates is 'Uncertain estimates derived from hidden sporting data; real values remain server-only.';
