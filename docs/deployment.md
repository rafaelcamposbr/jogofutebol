# Deploy da Beta

Este guia publica a beta na Vercel usando Supabase como Auth, banco e storage futuro.

## 1. GitHub

Se ainda nao houver remoto:

```bash
git init
git add .
git commit -m "Preparar beta online do simulador"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
git push -u origin main
```

Nao envie `.env`, `.env.local`, `.next` ou `node_modules`.

## 2. Supabase

Crie um projeto Supabase exclusivo para o jogo.

No SQL Editor, aplique:

```text
supabase/migrations/20260724103000_initial_beta_schema.sql
```

Depois aplique:

```text
supabase/seed.sql
```

Ative e-mail/senha em Authentication.

Configure Redirect URLs:

```text
http://localhost:3000/auth/callback
https://SEU-PROJETO.vercel.app/auth/callback
```

## 3. Variaveis na Vercel

Cadastre em Project Settings > Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_ENV=beta
NEXT_PUBLIC_APP_VERSION=0.1.0
```

Use `SUPABASE_SERVICE_ROLE_KEY` somente como server-side secret.

## 4. Vercel

Conecte o repositorio GitHub na Vercel.

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
npx vercel deploy
```

Producao:

```bash
npx vercel deploy --prod
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
