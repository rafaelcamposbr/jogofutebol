create or replace function public.sync_legacy_employee(
  p_user_id uuid,
  p_club_id uuid,
  p_employee jsonb,
  p_concepts jsonb,
  p_talents jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_employee_id uuid;
  v_concept record;
  v_status text;
begin
  if not exists (
    select 1 from public.clubs c where c.id = p_club_id and c.owner_id = p_user_id
  ) then
    raise exception 'club_not_owned';
  end if;

  if jsonb_typeof(p_employee) <> 'object'
    or jsonb_typeof(p_concepts) <> 'object'
    or jsonb_typeof(p_talents) <> 'object' then
    raise exception 'invalid_employee_payload';
  end if;

  v_status := case when p_employee->>'status' in ('active', 'notice', 'resigned', 'fired', 'expired')
    then p_employee->>'status' else 'active' end;

  insert into public.employees (
    club_id, legacy_id, professional_id, name, role_id, role_label,
    role_group, status, salary, contract_start_at, contract_end_at,
    experience_years, aptitudes, natural_talents, professional_history,
    infrastructure_requirements, expectations, ambitions, autonomy_level, hired_at
  ) values (
    p_club_id,
    p_employee->>'legacyId',
    nullif(p_employee->>'professionalId', ''),
    p_employee->>'name',
    p_employee->>'roleId',
    p_employee->>'roleLabel',
    p_employee->>'groupId',
    v_status,
    greatest(0, coalesce((p_employee->>'salary')::numeric, 0)),
    nullif(p_employee->>'contractStartAt', '')::timestamptz,
    nullif(p_employee->>'contractEndAt', '')::timestamptz,
    greatest(0, coalesce((p_employee->>'experienceYears')::numeric, 0)),
    coalesce(p_employee->'aptitudes', '{}'::jsonb),
    p_talents,
    coalesce(p_employee->'history', '[]'::jsonb),
    coalesce(p_employee->'infrastructureRequirements', '[]'::jsonb),
    coalesce(p_employee->'expectations', '[]'::jsonb),
    coalesce(p_employee->'ambitions', '[]'::jsonb),
    greatest(0, least(100, coalesce((p_employee->>'autonomyLevel')::integer, 50))),
    coalesce(nullif(p_employee->>'hiredAt', '')::timestamptz, now())
  )
  on conflict (club_id, legacy_id) do update set
    professional_id = excluded.professional_id,
    name = excluded.name,
    role_id = excluded.role_id,
    role_label = excluded.role_label,
    role_group = excluded.role_group,
    status = excluded.status,
    salary = excluded.salary,
    contract_start_at = excluded.contract_start_at,
    contract_end_at = excluded.contract_end_at,
    professional_history = excluded.professional_history,
    infrastructure_requirements = excluded.infrastructure_requirements,
    expectations = excluded.expectations,
    ambitions = excluded.ambitions,
    autonomy_level = excluded.autonomy_level,
    updated_at = now()
  returning id into v_employee_id;

  insert into public.employee_status (
    employee_id, satisfaction_score, trust_in_leadership, professional_morale, workload
  ) values (
    v_employee_id,
    60,
    55,
    greatest(0, least(100, coalesce((p_employee->>'morale')::numeric, 60))),
    greatest(0, least(100, coalesce((p_employee->>'workload')::numeric, 50)))
  ) on conflict (employee_id) do nothing;

  for v_concept in select key, value from jsonb_each(p_concepts)
  loop
    insert into public.employee_personality_concepts (employee_id, concept, level, is_core)
    values (
      v_employee_id,
      v_concept.key,
      greatest(0, least(5, (v_concept.value #>> '{}')::integer)),
      coalesce(p_employee->'coreConcepts', '[]'::jsonb) ? v_concept.key
    )
    on conflict (employee_id, concept) do nothing;
  end loop;

  return v_employee_id;
end;
$$;

revoke all on function public.sync_legacy_employee(uuid, uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.sync_legacy_employee(uuid, uuid, jsonb, jsonb, jsonb) to service_role;

create or replace function public.apply_employee_meeting_result(
  p_user_id uuid,
  p_meeting_id uuid,
  p_employee_id uuid,
  p_result jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result_id uuid;
  v_club_id uuid;
  v_subject text;
  v_type text;
  v_sat numeric := coalesce((p_result->>'satisfactionDelta')::numeric, 0);
  v_trust numeric := coalesce((p_result->>'trustDelta')::numeric, 0);
  v_morale numeric := coalesce((p_result->>'moraleDelta')::numeric, 0);
  v_fatigue numeric := coalesce((p_result->>'fatigueDelta')::numeric, 0);
  v_aptitude numeric := coalesce((p_result->>'aptitudeDelta')::numeric, 0);
  v_aptitude_target text := nullif(p_result->>'aptitudeTarget', '');
  v_promise jsonb;
  v_relationship jsonb;
begin
  select m.club_id, m.subject, m.meeting_type
    into v_club_id, v_subject, v_type
  from public.meetings m
  join public.clubs c on c.id = m.club_id
  join public.employees e on e.id = p_employee_id and e.club_id = m.club_id
  where m.id = p_meeting_id and m.created_by = p_user_id and c.owner_id = p_user_id;

  if v_club_id is null then raise exception 'meeting_not_owned'; end if;
  if v_sat not between -12 and 10 or v_trust not between -12 and 10
    or v_morale not between -12 and 10 or v_fatigue not between 0 and 25
    or v_aptitude not between 0 and 0.18 then
    raise exception 'meeting_result_out_of_bounds';
  end if;

  update public.employee_status set
    satisfaction_score = greatest(0, least(100, satisfaction_score + v_sat)),
    trust_in_leadership = greatest(0, least(100, trust_in_leadership + v_trust)),
    professional_morale = greatest(0, least(100, professional_morale + v_morale)),
    meeting_fatigue = greatest(0, least(100, meeting_fatigue + v_fatigue)),
    updated_at = now()
  where employee_id = p_employee_id;

  if v_aptitude > 0 and v_aptitude_target is not null then
    update public.employees set
      aptitudes = jsonb_set(
        aptitudes,
        array[v_aptitude_target],
        to_jsonb(greatest(0, least(100, coalesce((aptitudes->>v_aptitude_target)::numeric, 0) + v_aptitude))),
        true
      ),
      experience_years = experience_years + (v_aptitude / 10),
      updated_at = now()
    where id = p_employee_id;
  end if;

  insert into public.meeting_results (
    meeting_id, employee_id, satisfaction_delta, trust_delta, morale_delta,
    fatigue_delta, aptitude_delta, player_morale_delta, relationship_deltas,
    structured_summary
  ) values (
    p_meeting_id, p_employee_id, v_sat, v_trust, v_morale, v_fatigue,
    v_aptitude, coalesce((p_result->>'playerMoraleDelta')::numeric, 0),
    coalesce(p_result->'relationshipDeltas', '[]'::jsonb), p_result
  )
  returning id into v_result_id;

  for v_relationship in
    select value from jsonb_array_elements(coalesce(p_result->'relationshipDeltas', '[]'::jsonb))
  loop
    insert into public.employee_relationships (
      employee_id, target_type, target_id, relationship_score, trust_score, conflict_score
    ) values (
      p_employee_id,
      coalesce(v_relationship->>'targetType', 'user'),
      coalesce(v_relationship->>'targetId', p_user_id::text),
      greatest(0, least(100, 50 + coalesce((v_relationship->>'relationshipDelta')::numeric, 0))),
      greatest(0, least(100, 50 + coalesce((v_relationship->>'trustDelta')::numeric, 0))),
      greatest(0, least(100, coalesce((v_relationship->>'conflictDelta')::numeric, 0)))
    )
    on conflict (employee_id, target_type, target_id) do update set
      relationship_score = greatest(0, least(100, employee_relationships.relationship_score + coalesce((v_relationship->>'relationshipDelta')::numeric, 0))),
      trust_score = greatest(0, least(100, employee_relationships.trust_score + coalesce((v_relationship->>'trustDelta')::numeric, 0))),
      conflict_score = greatest(0, least(100, employee_relationships.conflict_score + coalesce((v_relationship->>'conflictDelta')::numeric, 0))),
      updated_at = now();
  end loop;

  insert into public.employee_memories (employee_id, memory_type, importance, summary, structured_data)
  values (
    p_employee_id, 'meeting', greatest(1, least(5, coalesce((p_result->>'importance')::integer, 2))),
    format('%s: %s', initcap(v_type), v_subject), p_result
  );

  for v_promise in select value from jsonb_array_elements(coalesce(p_result->'promises', '[]'::jsonb))
  loop
    insert into public.employee_promises (
      club_id, meeting_id, author_type, author_id, recipient_type, recipient_id,
      employee_id, description, deadline, importance
    ) values (
      v_club_id, p_meeting_id, 'user', p_user_id::text, 'employee', p_employee_id::text,
      p_employee_id, v_promise->>'description', nullif(v_promise->>'deadline', '')::timestamptz,
      greatest(1, least(5, coalesce((v_promise->>'importance')::integer, 2)))
    );
  end loop;

  update public.meetings set status = 'completed', completed_at = now()
  where id = p_meeting_id;

  return v_result_id;
end;
$$;

revoke all on function public.apply_employee_meeting_result(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_employee_meeting_result(uuid, uuid, uuid, jsonb) to service_role;

create or replace function public.start_employee_course(
  p_user_id uuid,
  p_employee_id uuid,
  p_course_type text,
  p_domain text,
  p_subject text,
  p_level text,
  p_aptitude_target text,
  p_selected_by_employee boolean,
  p_forced boolean
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_course_id uuid;
  v_club_id uuid;
  v_cost numeric;
  v_gain numeric;
  v_days integer;
  v_start timestamptz := now();
  v_end timestamptz;
  v_repeats integer;
  v_recent integer;
  v_factor numeric;
  v_tolerance integer := 1;
  v_concepts jsonb := '{}'::jsonb;
  v_status public.employee_status%rowtype;
  v_sat_delta numeric := 0;
  v_fatigue_delta numeric := 12;
begin
  select e.club_id into v_club_id
  from public.employees e join public.clubs c on c.id = e.club_id
  where e.id = p_employee_id and e.status = 'active' and c.owner_id = p_user_id;
  if v_club_id is null then raise exception 'employee_not_owned_or_inactive'; end if;

  if exists (select 1 from public.employee_courses where employee_id = p_employee_id and status in ('scheduled', 'in_progress')) then
    raise exception 'employee_already_in_course';
  end if;

  select case p_course_type when 'ead' then 12598.80 when 'weekend' then 19638.32 when 'immersion' then 26104.71 end,
         case p_course_type when 'ead' then 3.27 when 'weekend' then 6.41 when 'immersion' then 9.62 end,
         case p_course_type when 'ead' then 4 when 'weekend' then 1 when 'immersion' then 7 end
    into v_cost, v_gain, v_days;
  if v_cost is null or p_level not in ('basic', 'intermediate', 'advanced') then raise exception 'invalid_course'; end if;

  if p_course_type = 'weekend' and extract(dow from now())::integer <> 0 then
    v_start := date_trunc('day', now()) + ((7 - extract(dow from now())::integer) * interval '1 day') + interval '9 hours';
  end if;
  v_end := v_start + (v_days * interval '1 day');

  select count(*) into v_repeats from public.employee_courses
  where employee_id = p_employee_id and course_domain = p_domain and course_subject = p_subject
    and status = 'completed' and completed_at >= now() - interval '180 days';
  v_factor := case when v_repeats = 0 then 1 when v_repeats = 1 then 0.65 when v_repeats = 2 then 0.35 else 0.15 end;

  select count(*) into v_recent from public.employee_courses
  where employee_id = p_employee_id and status in ('scheduled', 'in_progress', 'completed')
    and created_at >= now() - interval '90 days';
  select coalesce(jsonb_object_agg(concept, level), '{}'::jsonb) into v_concepts
  from public.employee_personality_concepts where employee_id = p_employee_id;
  select * into v_status from public.employee_status where employee_id = p_employee_id;

  if coalesce((v_concepts->>'diligence')::integer, 0) >= 4 then v_tolerance := v_tolerance + 1; v_sat_delta := v_sat_delta + 1; end if;
  if coalesce((v_concepts->>'ambition')::integer, 0) >= 4 then v_tolerance := v_tolerance + 1; v_sat_delta := v_sat_delta + 1; end if;
  if coalesce((v_concepts->>'learning')::integer, 0) >= 4 then v_tolerance := v_tolerance + 2; v_sat_delta := v_sat_delta + 2; end if;
  if coalesce((v_concepts->>'autonomy')::integer, 0) >= 4 and p_forced then v_tolerance := v_tolerance - 1; v_sat_delta := v_sat_delta - 3; end if;
  if coalesce((v_concepts->>'contention')::integer, 0) >= 4 and v_repeats > 0 then v_tolerance := v_tolerance - 1; v_sat_delta := v_sat_delta - 2; end if;
  if v_status.workload > 75 then v_tolerance := v_tolerance - 1; end if;
  if v_status.training_fatigue > 70 then v_tolerance := v_tolerance - 1; end if;
  v_tolerance := greatest(1, least(5, v_tolerance));
  if v_recent >= v_tolerance then v_sat_delta := v_sat_delta - 2; v_fatigue_delta := v_fatigue_delta + ((v_recent - v_tolerance + 1) * 8); end if;
  if p_selected_by_employee then v_sat_delta := v_sat_delta + 1; end if;
  v_sat_delta := greatest(-8, least(6, v_sat_delta));
  v_fatigue_delta := greatest(4, least(30, v_fatigue_delta));

  update public.clubs set cash_balance = cash_balance - v_cost, updated_at = now()
  where id = v_club_id and cash_balance >= v_cost;
  if not found then raise exception 'insufficient_club_cash'; end if;

  insert into public.employee_courses (
    employee_id, course_type, course_domain, course_subject, course_level,
    aptitude_target, base_gain, effective_gain, saturation_factor, cost,
    selected_by_employee, forced, tolerance_at_start, recent_course_count,
    started_at, completed_at, status
  ) values (
    p_employee_id, p_course_type, p_domain, p_subject, p_level,
    p_aptitude_target, v_gain, round(v_gain * v_factor, 3), v_factor, v_cost,
    p_selected_by_employee, p_forced, v_tolerance, v_recent,
    v_start, v_end, case when v_start > now() then 'scheduled' else 'in_progress' end
  ) returning id into v_course_id;

  update public.employee_status set
    satisfaction_score = greatest(0, least(100, satisfaction_score + v_sat_delta)),
    training_fatigue = greatest(0, least(100, training_fatigue + v_fatigue_delta)),
    updated_at = now()
  where employee_id = p_employee_id;

  return v_course_id;
end;
$$;

revoke all on function public.start_employee_course(uuid, uuid, text, text, text, text, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.start_employee_course(uuid, uuid, text, text, text, text, text, boolean, boolean) to service_role;

create or replace function public.process_due_employee_courses(
  p_user_id uuid,
  p_club_id uuid,
  p_now timestamptz default now()
)
returns setof uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_course public.employee_courses%rowtype;
begin
  if not exists (select 1 from public.clubs where id = p_club_id and owner_id = p_user_id) then
    raise exception 'club_not_owned';
  end if;

  for v_course in
    select ec.* from public.employee_courses ec
    join public.employees e on e.id = ec.employee_id
    where e.club_id = p_club_id and ec.status in ('scheduled', 'in_progress') and ec.completed_at <= p_now
    for update of ec
  loop
    update public.employees set
      aptitudes = jsonb_set(
        aptitudes,
        array[v_course.aptitude_target],
        to_jsonb(greatest(0, least(100, coalesce((aptitudes->>v_course.aptitude_target)::numeric, 0) + v_course.effective_gain))),
        true
      ),
      experience_years = experience_years + (v_course.effective_gain / 20),
      updated_at = now()
    where id = v_course.employee_id;

    update public.employee_courses set status = 'completed' where id = v_course.id;
    insert into public.employee_memories (employee_id, memory_type, importance, summary, structured_data)
    values (v_course.employee_id, 'course', 2, format('Curso concluido: %s', v_course.course_subject), to_jsonb(v_course));
    return next v_course.id;
  end loop;
end;
$$;

revoke all on function public.process_due_employee_courses(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.process_due_employee_courses(uuid, uuid, timestamptz) to service_role;

create or replace function public.cancel_employee_course(
  p_user_id uuid,
  p_course_id uuid,
  p_now timestamptz default now()
)
returns numeric
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_course public.employee_courses%rowtype;
  v_club_id uuid;
  v_refund numeric := 0;
begin
  select ec.* into v_course
  from public.employee_courses ec
  join public.employees e on e.id = ec.employee_id
  join public.clubs c on c.id = e.club_id
  where ec.id = p_course_id and ec.status in ('scheduled', 'in_progress') and c.owner_id = p_user_id
  for update of ec;
  if v_course.id is null then raise exception 'course_not_owned_or_finished'; end if;
  select club_id into v_club_id from public.employees where id = v_course.employee_id;

  if p_now < v_course.started_at then v_refund := round(v_course.cost * 0.70, 2); end if;
  update public.employee_courses set status = 'cancelled', cancelled_at = p_now where id = p_course_id;
  update public.clubs set cash_balance = cash_balance + v_refund, updated_at = now() where id = v_club_id;
  return v_refund;
end;
$$;

revoke all on function public.cancel_employee_course(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.cancel_employee_course(uuid, uuid, timestamptz) to service_role;

create or replace function public.resolve_employee_promise(
  p_user_id uuid,
  p_promise_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_promise public.employee_promises%rowtype;
  v_sat numeric;
  v_trust numeric;
begin
  if p_status not in ('fulfilled', 'broken') then raise exception 'invalid_promise_status'; end if;
  select ep.* into v_promise from public.employee_promises ep
  join public.clubs c on c.id = ep.club_id
  where ep.id = p_promise_id and ep.status = 'active' and c.owner_id = p_user_id
  for update of ep;
  if v_promise.id is null then raise exception 'promise_not_owned_or_active'; end if;

  v_sat := case when p_status = 'fulfilled' then greatest(1, v_promise.importance) else -greatest(3, v_promise.importance + 2) end;
  v_trust := case when p_status = 'fulfilled' then greatest(2, v_promise.importance + 1) else -greatest(5, v_promise.importance + 3) end;
  update public.employee_promises set
    status = p_status,
    fulfilled_at = case when p_status = 'fulfilled' then now() else null end,
    broken_at = case when p_status = 'broken' then now() else null end
  where id = p_promise_id;

  if v_promise.employee_id is not null then
    update public.employee_status set
      satisfaction_score = greatest(0, least(100, satisfaction_score + v_sat)),
      trust_in_leadership = greatest(0, least(100, trust_in_leadership + v_trust)),
      updated_at = now()
    where employee_id = v_promise.employee_id;
    insert into public.employee_memories (employee_id, memory_type, importance, summary, structured_data)
    values (v_promise.employee_id, 'promise', v_promise.importance,
      format('Promessa %s: %s', case when p_status = 'fulfilled' then 'cumprida' else 'quebrada' end, v_promise.description),
      jsonb_build_object('promiseId', v_promise.id, 'status', p_status, 'satisfactionDelta', v_sat, 'trustDelta', v_trust));
  end if;
  return v_promise.id;
end;
$$;

revoke all on function public.resolve_employee_promise(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.resolve_employee_promise(uuid, uuid, text) to service_role;

create or replace function public.cancel_courses_for_inactive_employee()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.status = 'active' and new.status <> 'active' then
    update public.employee_courses set status = 'cancelled', cancelled_at = now()
    where employee_id = new.id and status in ('scheduled', 'in_progress');
  end if;
  return new;
end;
$$;

create or replace trigger employees_cancel_courses_when_inactive
after update of status on public.employees
for each row execute function public.cancel_courses_for_inactive_employee();

revoke all on function public.cancel_courses_for_inactive_employee() from public, anon, authenticated;
