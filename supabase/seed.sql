insert into public.clubs (
  id,
  name,
  short_name,
  abbreviation,
  hashtag,
  city,
  state,
  legal_model,
  primary_color,
  secondary_color,
  accent_color,
  mascot,
  institutional_reputation,
  financial_reputation,
  sporting_reputation,
  is_demo
) values
  ('00000000-0000-4000-8000-000000000101', 'Atletico do Vale Futebol Clube', 'Atletico do Vale', 'ADV', '#atleticodovale', 'Campinas', 'SP', 'association', '#0b7a53', '#ffffff', '#d8a21a', 'Lobo do Vale', 2.70, 2.10, 2.40, true),
  ('00000000-0000-4000-8000-000000000102', 'Uniao Central Esporte Clube', 'Uniao Central', 'UCE', '#uniaocentral', 'Jundiai', 'SP', 'association', '#1d4f91', '#ffffff', '#d8a21a', 'Estrela', 2.30, 2.60, 2.20, true),
  ('00000000-0000-4000-8000-000000000103', 'Aurora Litoranea SAF', 'Aurora Litoranea', 'AUR', '#auroralitoranea', 'Santos', 'SP', 'saf', '#7b1f4d', '#f7f6ef', '#19a7a8', 'Farol', 3.10, 3.30, 2.80, true)
on conflict (id) do nothing;

insert into public.press_releases (
  club_id,
  title,
  content,
  category,
  status,
  published_at,
  institutional_impact,
  financial_impact,
  sporting_impact,
  is_demo
) values
  ('00000000-0000-4000-8000-000000000101', 'Atletico do Vale anuncia projeto social com atletas da cidade', 'O clube informou que iniciara atividades comunitarias nas proximas semanas.', 'Comunicado institucional', 'published', now() - interval '4 days', 0.04, 0, 0, true),
  ('00000000-0000-4000-8000-000000000103', 'Aurora Litoranea apresenta patrocinio regional', 'A SAF divulgou acordo comercial e ampliacao das acoes de marca no litoral.', 'Anuncio de patrocinio', 'published', now() - interval '6 days', 0.03, 0.05, 0, true)
on conflict do nothing;

insert into public.news (
  type,
  source_name,
  title,
  summary,
  content,
  relevance_score,
  scope,
  city,
  state,
  related_club_ids,
  is_demo,
  published_at
) values
  ('important_feed', 'Arquibancada', 'Promessa de 16 anos chama atencao apos subir ao profissional', 'O jovem atacante Lucas Martins foi promovido apos se destacar na categoria de base.', null, 82, 'state', 'Campinas', 'SP', array['00000000-0000-4000-8000-000000000101']::uuid[], true, now() - interval '14 minutes'),
  ('transfer_market', 'Mercado da Bola', 'Uniao Central confirma chegada de Joao Silva', 'Meia de 20 anos troca de clube em transferencia publica entre diretorias humanas simuladas.', null, 56, 'state', 'Jundiai', 'SP', array['00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000103']::uuid[], true, now() - interval '1 day'),
  ('newspaper', 'Jornal Horizonte', 'Aurora Litoranea inaugura modulo moderno de estadio', 'O clube apresentou uma ampliacao que aumenta a visibilidade da SAF no litoral.', null, 86, 'state', 'Santos', 'SP', array['00000000-0000-4000-8000-000000000103']::uuid[], true, now() - interval '2 days')
on conflict do nothing;
