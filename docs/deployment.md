# Deploy da Beta

Este guia publica a beta na Vercel usando Supabase como Auth, banco e storage futuro.

Estado atual em 2026-07-31:

- Supabase criado: `Projeto Jogo de Futebol Beta` (`vvoisdgpqbzbncjmnhuq`, `sa-east-1`)
- Vercel criado: `rcawork/projeto-jogo-futebol-beta`
- Producao: `https://projeto-jogo-futebol-beta.vercel.app`
- GitHub remoto: `https://github.com/rafaelcamposbr/jogofutebol.git`

## 1. GitHub

Repositorio:

```bash
git branch -M main
git remote add origin https://github.com/rafaelcamposbr/jogofutebol.git
git push -u origin main
```

Nao envie `.env`, `.env.local`, `.next` ou `node_modules`.

## 2. Supabase

Use somente o projeto exclusivo do jogo:

```text
Nome: Projeto Jogo de Futebol Beta
Ref: vvoisdgpqbzbncjmnhuq
URL: https://vvoisdgpqbzbncjmnhuq.supabase.co
Regiao: sa-east-1
```

No SQL Editor, MCP ou CLI, aplique todas as migrations versionadas e depois:

```text
supabase/seed.sql
```

E-mail/senha deve permanecer ativo em Authentication.

Configure Redirect URLs:

```text
http://localhost:3000/auth/callback
https://projeto-jogo-futebol-beta.vercel.app/auth/callback
```

## 3. Variaveis na Vercel

Ja foram cadastradas em Production, Preview e Development:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_ENV=beta
NEXT_PUBLIC_APP_VERSION=0.1.0
```

Obrigatoria para cadastro e login unificado:

```text
SUPABASE_SECRET_KEY
NEXT_PUBLIC_SITE_URL=https://projeto-jogo-futebol-beta.vercel.app
```

Necessarias para verificacoes reais:

```text
RESEND_API_KEY
EMAIL_FROM
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
```

## 4. Vercel

Projeto Vercel atual:

```text
Team: rcawork
Project: projeto-jogo-futebol-beta
Production URL: https://projeto-jogo-futebol-beta.vercel.app
```

O repositorio remoto ja existe. Confirme no painel da Vercel que a integracao Git aponta para `rafaelcamposbr/jogofutebol`, branch de producao `main`; nao crie outro projeto.

Configuracoes esperadas:

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output: automatico
```

Deploy via CLI, se preferir:

```bash
npm install
npm run build
npx vercel deploy --scope rcawork
```

Producao:

```bash
npx vercel deploy --prod --scope rcawork
```

## 5. Validacao

Antes de compartilhar o link:

```bash
npm run build
npm run typecheck
```

Teste:

- `/login`
- `/cadastro`
- `/recuperar-senha`
- `/experimentar`
- `/central`
- `/imprensa`
- `/imprensa/clube/atletico-do-vale`
- `/status`

## 6. Usuario de teste

Crie um usuario pelo fluxo `/cadastro`. Depois entre, crie um clube em `/criar-clube` e confirme o redirecionamento para `/central`.
