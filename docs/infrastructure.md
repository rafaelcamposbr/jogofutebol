# Infraestrutura da Beta

Ultima atualizacao: 2026-07-24.

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

- `supabase/migrations/20260724103000_initial_beta_schema.sql`
- `supabase/seed.sql`
- Migracao remota `harden_rls_and_indexes`
- Migracao remota `restrict_public_table_grants`

Tabelas publicas com RLS ativo:

- `profiles`
- `clubs`
- `club_members`
- `press_releases`
- `news`
- `events`
- `feedback`
- `app_versions`

Buckets:

- `club-crests`: publico, imagens PNG/JPEG/WebP, 5 MB
- `club-uniforms`: publico, imagens PNG/JPEG/WebP, 5 MB
- `feedback-attachments`: privado, imagens PNG/JPEG/WebP, 10 MB

Validacoes feitas:

- Security advisor sem lints.
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
Inspect URL: https://vercel.com/rcawork/projeto-jogo-futebol-beta/2RGtXoNvbYB5bWRodZQ4EtDn3oWq
```

Variaveis configuradas em Production, Preview e Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_APP_VERSION`

Nao foi configurada:

- `SUPABASE_SERVICE_ROLE_KEY`: chave service-role nao estava disponivel nas ferramentas atuais e o codigo nao depende dela nesta beta.

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

Planejado:

```text
Owner: rafaelcamposbr
Repo: projeto-jogo-futebol
Visibilidade: private
Branch: main
```

Status: nao criado. O conector GitHub autenticou `rafaelcamposbr`, mas nao tinha conta/repo instalado e nao expos ferramenta de criacao de repositorio. O ambiente local tambem nao tinha `gh`, `GITHUB_TOKEN` ou `GH_TOKEN`. A tentativa via navegador em `https://github.com/new` caiu em tela de login no in-app browser e no Chrome.

Quando o repositorio for criado, conecte-o a Vercel para deploy automatico por push.
