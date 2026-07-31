create index if not exists meetings_created_by_idx on public.meetings(created_by);
create index if not exists meeting_results_employee_id_idx on public.meeting_results(employee_id);
create index if not exists employee_promises_meeting_id_idx on public.employee_promises(meeting_id);
create index if not exists employee_promises_employee_id_idx on public.employee_promises(employee_id);
create index if not exists advisor_messages_employee_id_idx on public.advisor_messages(employee_id);
create index if not exists tutorial_progress_club_id_idx on public.tutorial_progress(club_id);
