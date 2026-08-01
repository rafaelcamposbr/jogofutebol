# Autenticacao e verificacoes da Beta

## Persistencia

- Credenciais e sessoes: `auth.users`, gerenciadas exclusivamente pelo Supabase Auth.
- Dados de cadastro: `public.profiles`, criados pelo trigger `public.handle_new_user`.
- Clubes: `public.clubs`.
- Vinculo do proprietario: `public.club_members` com role `owner`.
- Evento de fundacao: `public.events`.
- Desafios de canal: `public.verification_challenges`, com RLS e policy de negacao para `anon` e `authenticated`.

Senhas, hashes manuais de senha e OTPs em texto puro nao sao gravados em `profiles`.

## Cadastro

O endpoint `POST /api/auth/signup` valida e normaliza usuario, nome, sobrenome, e-mail, WhatsApp e senha no servidor. O trigger do banco repete as garantias essenciais e os indices unicos resolvem concorrencia para usuario, e-mail de perfil e WhatsApp.

A confirmacao nativa de e-mail do Supabase deve permanecer desativada. Se ela for ativada por engano e o cadastro nao gerar sessao, o endpoint remove a conta parcial criada naquela tentativa.

## Login unificado

`POST /api/auth/login` classifica o identificador e consulta `profiles` com `SUPABASE_SECRET_KEY` somente no servidor. Em seguida, autentica pelo e-mail associado usando `signInWithPassword`. Falhas de lookup e senha retornam a mesma mensagem.

## Verificacao de e-mail

- Provedor: Resend.
- Variaveis: `RESEND_API_KEY` e `EMAIL_FROM`.
- Token aleatorio de 256 bits; apenas SHA-256 e armazenado.
- Uso unico, validade de 30 minutos, cooldown de 60 segundos e limite de 5 envios por hora.
- Trocar o e-mail invalida desafios anteriores e bloqueia novamente a Imprensa.

## Verificacao de WhatsApp

- Provedor: Twilio Verify com canal `whatsapp`.
- Variaveis: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_VERIFY_SERVICE_SID`.
- O OTP e gerado e armazenado pelo Twilio; a aplicacao nunca grava nem exibe o codigo.
- Validade local de 10 minutos, no maximo 5 tentativas, cooldown de 60 segundos e limite de 5 envios por hora.
- Trocar o numero invalida desafios anteriores e bloqueia novamente o Escritorio.

Para habilitar o envio real, o Twilio exige um Verify Service e um WhatsApp Sender proprio aprovado. Contas Trial so enviam para numeros previamente verificados.

## Acesso progressivo

- `email_game_verified = false`: redireciona rotas privadas de `/imprensa` para `/verificar-email`.
- `whatsapp_game_verified = false`: redireciona `/escritorio` e subrotas para `/verificar-whatsapp`.
- Perfis publicos em `/imprensa/clube/[slug]` continuam acessiveis.
- Elenco, Mercado e Calendario continuam disponiveis sem as confirmacoes; `/central` redireciona para Mercado ou Escritorio conforme o status do WhatsApp.
