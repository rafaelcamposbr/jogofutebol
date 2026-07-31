create policy "verification_challenges_deny_public"
on public.verification_challenges
for all
to anon, authenticated
using (false)
with check (false);
