# Infraestrutura da Beta

Ultima atualizacao: 2026-07-31.

## Supabase

Projeto criado exclusivamente para o jogo:

```text
Nome: Projeto Jogo de Futebol Beta
Ref: vvoisdgpqbzbncjmnhuq
URL: https://vvoisdgpqbzbncjmnhuq.supabase.co
Regiao: sa-east-1
Status: ACTIVE_HEALTHY
Postgres: 17
```

O projeto `dommus-casa commerce` nao foi alterado.

Aplicado:

- `supabase/migrations/20260724142221_initial_beta_schema.sql`
- `supabase/migrations/20260724142422_harden_rls_and_indexes.sql`
- `supabase/migrations/20260724142626_restrict_public_table_grants.sql`
- `supabase/migrations/20260725142511_fix_clubs_rls_infinite_recursion.sql`
- `supabase/migrations/20260731154908_complete_auth_profiles_and_verifications.sql`
- `supabase/migrations/20260731155028_explicitly_deny_verification_challenges.sql`
- `supabase/migrations/20260731155259_fix_whatsapp_e164_validation.sql`
- `supabase/seed.sql`

Tabelas publicas com RLS ativo:

- `profiles`
- `clubs`
- `club_members`
- `press_releases`
- `news`
- `events`
- `feedback`
- `app_versions`
- `verification_challenges`

Buckets:

- `club-crests`: publico, imagens PNG/JPEG/WebP, 5 MB
- `club-uniforms`: publico, imagens PNG/JPEG/WebP, 5 MB
- `feedback-attachments`: privado, imagens PNG/JPEG/WebP, 10 MB

Validacoes feitas:

- Security advisor sem alerta de RLS nas tabelas da aplicacao. A protecao contra senhas vazadas permanece como recomendacao do Auth e nao esta disponivel no plano Free atual.
- `verification_challenges` tem RLS habilitado, politica explicita de negacao e nenhum grant para `anon` ou `authenticated`.
- Performance advisor apenas com `unused_index`, esperado em banco novo sem trafego.
- API publica retorna `app_versions`.
- API publica retorna `public_club_profiles`.
- API publica nega `clubs.cash_balance` para `anon`.
- API publica nega `profiles` para `anon`.
- Insert anonimo valido em `feedback` funciona com retorno minimo.
- Insert anonimo invalido em `feedback` e bloqueado por RLS/checks.

## Vercel

Projeto criado:

```text
Team: rcawork
Project: projeto-jogo-futebol-beta
Production URL: https://projeto-jogo-futebol-beta.vercel.app
```

Variaveis configuradas em Production, Preview e Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` (somente servidor)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_APP_VERSION`

Dependem dos provedores externos e devem permanecer ausentes ate haver credenciais reais:

- `RESEND_API_KEY` e `EMAIL_FROM`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_VERIFY_SERVICE_SID`

`SUPABASE_SERVICE_ROLE_KEY` e aceito apenas como nome legado. A configuracao preferida e `SUPABASE_SECRET_KEY`, nunca exposta como `NEXT_PUBLIC_`.

Deploy de producao realizado via CLI:

```bash
npx vercel deploy --prod --yes --scope rcawork
```

Rotas validadas em producao:

- `/`
- `/login`
- `/cadastro`
- `/status`
- `/api/status`
- `/imprensa/clube/atletico-do-vale`

`/api/status` retornou `appStatus: online` e `supabaseStatus: configured`.

## GitHub

Repositorio existente:

```text
Owner: rafaelcamposbr
Repo: jogofutebol
URL: https://github.com/rafaelcamposbr/jogofutebol
Branch: main
```
