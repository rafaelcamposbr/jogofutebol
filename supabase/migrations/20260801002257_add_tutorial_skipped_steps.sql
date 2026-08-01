alter table public.tutorial_progress
  add column if not exists skipped_steps integer[] not null default '{}';

comment on column public.tutorial_progress.skipped_steps is
  'Tutorial steps explicitly skipped by the user; kept separate from completed_steps.';
