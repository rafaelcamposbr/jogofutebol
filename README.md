# Simulador Online de Gestao de Clube - Beta

Beta online do jogo de gestao de clubes de futebol. A aplicacao migrou o prototipo HTML/CSS/JS para uma base Next.js com TypeScript e App Router, preservando o jogo legado em `public/legacy` enquanto adiciona autenticacao, Supabase, rotas reais e deploy-ready para Vercel.

## Tecnologias

- Next.js 16 com App Router
- TypeScript
- React 19
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage preparado para escudos, uniformes e anexos de feedback
- Vercel

Tailwind CSS nao foi adicionado porque o projeto original nao usava Tailwind.

## Requisitos

- Node.js 20.9 ou superior
- npm
- Projeto Supabase do jogo
- Conta Vercel
- Repositorio GitHub, quando quiser habilitar deploy automatico por push

## Instalacao local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Variaveis de ambiente

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_ENV=beta
NEXT_PUBLIC_APP_VERSION=0.1.0
```

`SUPABASE_SERVICE_ROLE_KEY` e somente servidor e hoje e opcional no codigo. Nunca use essa chave em componentes client-side nem em variaveis `NEXT_PUBLIC_`.

## Supabase

1. Use o projeto Supabase exclusivo do jogo: `Projeto Jogo de Futebol Beta`.
2. Aplique `supabase/migrations/20260724103000_initial_beta_schema.sql`.
3. Rode `supabase/seed.sql` para carregar dados demonstrativos.
4. Em Authentication, habilite e-mail/senha.
5. Cadastre a URL do app em Auth URL Configuration:
   - Local: `http://localhost:3000`
   - Producao: `https://projeto-jogo-futebol-beta.vercel.app`
   - Redirect: `/auth/callback`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Fluxos implementados

- Cadastro por e-mail/senha via Supabase Auth
- Login
- Logout
- Recuperacao de senha
- Redirecionamento para `/criar-clube` quando o usuario autenticado nao possui clube
- Criacao de clube real no Supabase
- Registro de evento de fundacao
- Modo visitante em `/experimentar`
- Rotas principais: `/central`, `/imprensa`, `/elenco`, `/mercado`, `/escritorio`, `/calendario`
- Subrotas do prototipo preservadas por catch-all
- Perfil publico em `/imprensa/clube/[slug]`
- Comunicados oficiais com sincronizacao para `/api/press-releases`
- Feedback fixo com gravacao em `/api/feedback`
- Status publico em `/status`
- Ambiente Beta e versao no cabecalho

## Dados demonstrativos

Os dados demo servem apenas para interface: Arquibancada, Mercado da Bola, Jornal Horizonte, busca, hashtags, perfis publicos e comunicados. Eles sao marcados com `is_demo = true` nas tabelas correspondentes.

## Reiniciar dados demonstrativos

No navegador, use o modo visitante novamente em `/experimentar`. Para banco, reaplique `supabase/seed.sql`; ele usa `on conflict do nothing`.

## Limitacoes atuais

- O prototipo principal ainda roda como camada legada em `public/legacy`.
- Algumas acoes do jogo continuam locais no navegador durante a beta.
- Multiplayer esportivo, partidas, campeonatos, mercado real entre clubes e economia definitiva nao foram implementados nesta etapa.
- Deploy automatico por GitHub ainda depende da criacao/conexao de um repositorio remoto.

## Deploy

Beta publicada: `https://projeto-jogo-futebol-beta.vercel.app`.

Veja `docs/deployment.md` e `docs/infrastructure.md`.
