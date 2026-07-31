create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  legacy_id text not null,
  professional_id text,
  name text not null check (char_length(name) between 2 and 120),
  role_id text not null check (char_length(role_id) between 2 and 80),
  role_label text not null check (char_length(role_label) between 2 and 120),
  role_group text not null check (role_group in ('coaches', 'technical', 'medical', 'administrative', 'operations')),
  status text not null default 'active' check (status in ('active', 'notice', 'resigned', 'fired', 'expired')),
  salary numeric(14,2) not null default 0 check (salary >= 0),
  contract_start_at timestamptz,
  contract_end_at timestamptz,
  experience_years numeric(6,2) not null default 0 check (experience_years >= 0),
  aptitudes jsonb not null default '{}'::jsonb check (jsonb_typeof(aptitudes) = 'object'),
  natural_talents jsonb not null default '{}'::jsonb check (jsonb_typeof(natural_talents) = 'object'),
  temporary_modifiers jsonb not null default '{}'::jsonb check (jsonb_typeof(temporary_modifiers) = 'object'),
  professional_history jsonb not null default '[]'::jsonb check (jsonb_typeof(professional_history) = 'array'),
  infrastructure_requirements jsonb not null default '[]'::jsonb check (jsonb_typeof(infrastructure_requirements) = 'array'),
  expectations jsonb not null default '[]'::jsonb check (jsonb_typeof(expectations) = 'array'),
  ambitions jsonb not null default '[]'::jsonb check (jsonb_typeof(ambitions) = 'array'),
  autonomy_level integer not null default 50 check (autonomy_level between 0 and 100),
  may_request_meeting boolean not null default true,
  may_complain boolean not null default true,
  may_praise boolean not null default true,
  may_suggest boolean not null default true,
  may_resign boolean not null default true,
  hired_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, legacy_id)
);

create table if not exists public.employee_personality_concepts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  concept text not null check (concept in (
    'diligence', 'ambition', 'learning', 'autonomy', 'loyalty', 'stability',
    'sociability', 'recognition', 'discipline', 'contention', 'innovation',
    'resilience', 'integrity'
  )),
  level integer not null check (level between 0 and 5),
  is_core boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, concept)
);

create table if not exists public.employee_status (
  employee_id uuid primary key references public.employees(id) on delete cascade,
  satisfaction_score numeric(5,2) not null default 60 check (satisfaction_score between 0 and 100),
  trust_in_leadership numeric(5,2) not null default 55 check (trust_in_leadership between 0 and 100),
  professional_morale numeric(5,2) not null default 60 check (professional_morale between 0 and 100),
  workload numeric(5,2) not null default 50 check (workload between 0 and 100),
  meeting_fatigue numeric(5,2) not null default 0 check (meeting_fatigue between 0 and 100),
  training_fatigue numeric(5,2) not null default 0 check (training_fatigue between 0 and 100),
  last_state_processed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_relationships (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  target_type text not null check (target_type in ('employee', 'user', 'player')),
  target_id text not null,
  relationship_score numeric(5,2) not null default 50 check (relationship_score between 0 and 100),
  trust_score numeric(5,2) not null default 50 check (trust_score between 0 and 100),
  conflict_score numeric(5,2) not null default 0 check (conflict_score between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (employee_id, target_type, target_id)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  meeting_type text not null check (meeting_type in (
    'planning', 'evaluation', 'accountability', 'praise', 'feedback', 'training',
    'crisis', 'negotiation', 'promotion', 'contract', 'alignment', 'debate',
    'warning', 'technical', 'collective', 'private'
  )),
  subject text not null check (char_length(subject) between 3 and 180),
  original_text text not null check (char_length(original_text) between 3 and 5000),
  tone text not null default 'neutral' check (tone in ('respectful', 'neutral', 'direct', 'critical', 'hostile', 'supportive')),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  interpretation jsonb not null default '{}'::jsonb check (jsonb_typeof(interpretation) = 'object'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  participant_type text not null check (participant_type in ('employee', 'user', 'player', 'interim_advisor')),
  participant_id text not null,
  employee_id uuid references public.employees(id) on delete cascade,
  role_in_meeting text not null default 'participant' check (role_in_meeting in ('organizer', 'participant', 'advisor', 'observer')),
  created_at timestamptz not null default now(),
  unique (meeting_id, participant_type, participant_id)
);

create table if not exists public.meeting_results (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  satisfaction_delta numeric(5,2) not null default 0 check (satisfaction_delta between -12 and 10),
  trust_delta numeric(5,2) not null default 0 check (trust_delta between -12 and 10),
  morale_delta numeric(5,2) not null default 0 check (morale_delta between -12 and 10),
  fatigue_delta numeric(5,2) not null default 0 check (fatigue_delta between 0 and 25),
  aptitude_delta numeric(6,3) not null default 0 check (aptitude_delta between 0 and 0.18),
  player_morale_delta numeric(5,2) not null default 0 check (player_morale_delta between -10 and 10),
  relationship_deltas jsonb not null default '[]'::jsonb check (jsonb_typeof(relationship_deltas) = 'array'),
  structured_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_summary) = 'object'),
  created_at timestamptz not null default now(),
  unique (meeting_id, employee_id)
);

create table if not exists public.employee_memories (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  memory_type text not null check (memory_type in ('meeting', 'promise', 'course', 'contract', 'praise', 'complaint', 'decision')),
  importance integer not null default 2 check (importance between 1 and 5),
  summary text not null check (char_length(summary) between 3 and 1000),
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_promises (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  author_type text not null check (author_type in ('user', 'employee')),
  author_id text not null,
  recipient_type text not null check (recipient_type in ('employee', 'group', 'club')),
  recipient_id text,
  employee_id uuid references public.employees(id) on delete cascade,
  description text not null check (char_length(description) between 3 and 600),
  deadline timestamptz,
  status text not null default 'active' check (status in ('active', 'fulfilled', 'broken', 'cancelled')),
  importance integer not null default 2 check (importance between 1 and 5),
  fulfilled_at timestamptz,
  broken_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_courses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  course_type text not null check (course_type in ('ead', 'weekend', 'immersion')),
  course_domain text not null check (char_length(course_domain) between 2 and 100),
  course_subject text not null check (char_length(course_subject) between 2 and 160),
  course_level text not null check (course_level in ('basic', 'intermediate', 'advanced')),
  aptitude_target text not null check (char_length(aptitude_target) between 2 and 80),
  base_gain numeric(6,3) not null check (base_gain between 0 and 15),
  effective_gain numeric(6,3) not null check (effective_gain between 0 and 15),
  saturation_factor numeric(4,2) not null default 1 check (saturation_factor between 0.15 and 1),
  cost numeric(14,2) not null check (cost >= 0),
  selected_by_employee boolean not null default false,
  forced boolean not null default false,
  tolerance_at_start integer not null default 1 check (tolerance_at_start between 1 and 5),
  recent_course_count integer not null default 0 check (recent_course_count >= 0),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  cancelled_at timestamptz,
  status text not null default 'in_progress' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.advisor_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  event_type text not null check (char_length(event_type) between 2 and 80),
  related_entity_type text,
  related_entity_id text,
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  tone text not null check (tone in ('praise', 'suggestion', 'information', 'complaint', 'alert', 'urgent_alert')),
  title text not null check (char_length(title) between 3 and 180),
  message text not null check (char_length(message) between 3 and 1200),
  reason text,
  recommendation text,
  structured_impact jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_impact) = 'object'),
  actions jsonb not null default '[]'::jsonb check (jsonb_typeof(actions) = 'array'),
  status text not null default 'new' check (status in ('new', 'read', 'dismissed', 'resolved')),
  group_count integer not null default 1 check (group_count >= 1),
  expires_at timestamptz,
  read_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tutorial_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  current_step integer not null default 1 check (current_step between 1 and 10),
  completed_steps integer[] not null default '{}',
  contextual_tips_seen text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'skipped')),
  reward_granted boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, club_id)
);

create index if not exists employees_club_status_idx on public.employees(club_id, status);
create index if not exists employee_concepts_employee_core_idx on public.employee_personality_concepts(employee_id, is_core);
create index if not exists employee_relationships_target_idx on public.employee_relationships(target_type, target_id);
create index if not exists meetings_club_created_idx on public.meetings(club_id, created_at desc);
create index if not exists meeting_participants_employee_idx on public.meeting_participants(employee_id);
create index if not exists employee_memories_employee_created_idx on public.employee_memories(employee_id, created_at desc);
create index if not exists employee_promises_club_status_idx on public.employee_promises(club_id, status, deadline);
create index if not exists employee_courses_employee_status_idx on public.employee_courses(employee_id, status, completed_at);
create index if not exists advisor_messages_club_status_idx on public.advisor_messages(club_id, status, created_at desc);

create or replace trigger employees_set_updated_at before update on public.employees
for each row execute function public.set_updated_at();
create or replace trigger employee_personality_concepts_set_updated_at before update on public.employee_personality_concepts
for each row execute function public.set_updated_at();
create or replace trigger employee_status_set_updated_at before update on public.employee_status
for each row execute function public.set_updated_at();
create or replace trigger employee_relationships_set_updated_at before update on public.employee_relationships
for each row execute function public.set_updated_at();
create or replace trigger advisor_messages_set_updated_at before update on public.advisor_messages
for each row execute function public.set_updated_at();
create or replace trigger tutorial_progress_set_updated_at before update on public.tutorial_progress
for each row execute function public.set_updated_at();

alter table public.employees enable row level security;
alter table public.employee_personality_concepts enable row level security;
alter table public.employee_status enable row level security;
alter table public.employee_relationships enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_results enable row level security;
alter table public.employee_memories enable row level security;
alter table public.employee_promises enable row level security;
alter table public.employee_courses enable row level security;
alter table public.advisor_messages enable row level security;
alter table public.tutorial_progress enable row level security;

create policy "employees_select_own" on public.employees for select to authenticated
using (exists (select 1 from public.clubs c where c.id = employees.club_id and c.owner_id = (select auth.uid())));
create policy "employee_concepts_select_own" on public.employee_personality_concepts for select to authenticated
using (exists (select 1 from public.employees e join public.clubs c on c.id = e.club_id where e.id = employee_personality_concepts.employee_id and c.owner_id = (select auth.uid())));
create policy "employee_status_select_own" on public.employee_status for select to authenticated
using (exists (select 1 from public.employees e join public.clubs c on c.id = e.club_id where e.id = employee_status.employee_id and c.owner_id = (select auth.uid())));
create policy "employee_relationships_select_own" on public.employee_relationships for select to authenticated
using (exists (select 1 from public.employees e join public.clubs c on c.id = e.club_id where e.id = employee_relationships.employee_id and c.owner_id = (select auth.uid())));
create policy "meetings_select_own" on public.meetings for select to authenticated
using (created_by = (select auth.uid()) and exists (select 1 from public.clubs c where c.id = meetings.club_id and c.owner_id = (select auth.uid())));
create policy "meeting_participants_select_own" on public.meeting_participants for select to authenticated
using (exists (select 1 from public.meetings m join public.clubs c on c.id = m.club_id where m.id = meeting_participants.meeting_id and c.owner_id = (select auth.uid())));
create policy "meeting_results_select_own" on public.meeting_results for select to authenticated
using (exists (select 1 from public.meetings m join public.clubs c on c.id = m.club_id where m.id = meeting_results.meeting_id and c.owner_id = (select auth.uid())));
create policy "employee_memories_select_own" on public.employee_memories for select to authenticated
using (exists (select 1 from public.employees e join public.clubs c on c.id = e.club_id where e.id = employee_memories.employee_id and c.owner_id = (select auth.uid())));
create policy "employee_promises_select_own" on public.employee_promises for select to authenticated
using (exists (select 1 from public.clubs c where c.id = employee_promises.club_id and c.owner_id = (select auth.uid())));
create policy "employee_courses_select_own" on public.employee_courses for select to authenticated
using (exists (select 1 from public.employees e join public.clubs c on c.id = e.club_id where e.id = employee_courses.employee_id and c.owner_id = (select auth.uid())));
create policy "advisor_messages_select_own" on public.advisor_messages for select to authenticated
using (exists (select 1 from public.clubs c where c.id = advisor_messages.club_id and c.owner_id = (select auth.uid())));
create policy "tutorial_progress_select_own" on public.tutorial_progress for select to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.clubs c where c.id = tutorial_progress.club_id and c.owner_id = (select auth.uid())));

revoke all on public.employees, public.employee_personality_concepts, public.employee_status,
  public.employee_relationships, public.meetings, public.meeting_participants,
  public.meeting_results, public.employee_memories, public.employee_promises,
  public.employee_courses, public.advisor_messages, public.tutorial_progress
from anon, authenticated;

comment on column public.employees.natural_talents is 'Valores ocultos de 0 a 100. Nunca expor diretamente ao cliente.';
comment on table public.meeting_results is 'Resultados numericos calculados pelo motor deterministico, nunca por texto livre.';
