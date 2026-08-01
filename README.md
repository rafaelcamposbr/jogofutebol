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
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
OPENAI_API_KEY=
OPENAI_STAFF_MODEL=gpt-5.6
NEXT_PUBLIC_APP_ENV=beta
NEXT_PUBLIC_APP_VERSION=0.1.0
ENABLE_PROBLEM_REPORTING=false
```

`SUPABASE_SECRET_KEY` e obrigatoria para cadastro e login unificado. Ela e somente servidor; nunca use essa chave em componentes client-side ou variaveis `NEXT_PUBLIC_`. O codigo aceita `SUPABASE_SERVICE_ROLE_KEY` apenas como compatibilidade legada. A disponibilidade de nome usa uma RPC booleana com acesso publico controlado.

`ENABLE_PROBLEM_REPORTING` permanece `false`: o botao e a API de reporte estao desativados e o banco preserva apenas o historico existente.

## Supabase

1. Use o projeto Supabase exclusivo do jogo: `Projeto Jogo de Futebol Beta`.
2. Aplique as migrations de `supabase/migrations` na ordem dos timestamps.
3. Rode `supabase/seed.sql` para carregar dados demonstrativos.
4. Em Authentication, habilite e-mail/senha e deixe a confirmacao nativa desativada.
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
- Perfil completo com usuario unico e WhatsApp E.164
- Login por nome de usuario, e-mail ou WhatsApp
- Logout
- Recuperacao de senha
- Verificacao propria de e-mail para liberar Imprensa
- Verificacao por WhatsApp para liberar Escritorio
- Minha Conta com troca segura de e-mail e WhatsApp
- Redirecionamento para `/criar-clube` quando o usuario autenticado nao possui clube
- Criacao de clube real no Supabase
- Registro de evento de fundacao
- Modo visitante em `/experimentar`
- Rotas principais: `/imprensa`, `/elenco`, `/mercado`, `/escritorio`, `/calendario`; `/central` e mantida apenas como redirecionamento de compatibilidade
- Subrotas do prototipo preservadas por catch-all
- Perfil publico em `/imprensa/clube/[slug]`
- Comunicados oficiais com sincronizacao para `/api/press-releases`
- Funcionarios persistentes com personalidade, satisfacao, confianca, moral e talento natural oculto
- Reunioes com interpretacao estruturada, memoria, promessas e efeitos deterministas
- Cursos com custos, tolerancia, repeticao e saturacao por conteudo
- Central de Orientacoes e tutorial progressivo com coordenador interino
- Reporte de problema desativado por flag de servidor e bloqueado no banco
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
- Envio real de e-mail exige Resend configurado.
- OTP real de WhatsApp exige Twilio Verify, WhatsApp Sender e credenciais configuradas.

## Deploy

Beta publicada: `https://projeto-jogo-futebol-beta.vercel.app`.

Veja `docs/authentication.md`, `docs/deployment.md`, `docs/infrastructure.md` e `docs/employee-intelligence.md`.
