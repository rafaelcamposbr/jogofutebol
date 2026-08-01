alter function public.start_club_tryout(uuid,uuid,integer,jsonb)
  set search_path = pg_catalog, public, extensions;

alter function public.process_due_bankruptcies(timestamptz)
  set search_path = pg_catalog, public, extensions;
