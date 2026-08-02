# Rotina de qualidade

Esta rotina cobre o codigo local e a historia completa no ambiente hospedado. Ela deve ser executada antes de cada envio para `main`.

## 1. Verificar Git

```powershell
git branch --show-current
git status --short
git log -1 --oneline
git remote -v
```

Confirme que o remoto e o projeto existentes continuam conectados. Nao crie repositorio, Vercel ou Supabase substitutos.

## 2. Instalar dependencias

```powershell
npm ci
```

## 3. Executar lint

```powershell
npm run lint
```

O lint local verifica botoes sem `type`, retornos dependentes apenas do historico, links vazios, rotas principais, privacidade da partida e ausencia de controles ao vivo.

## 4. Executar TypeScript

```powershell
npm run typecheck
```

## 5. Executar testes

```powershell
npm test
```

Os testes de partida devem cobrir determinismo, decisoes automaticas, conhecimento imperfeito, confianca baixa/alta, divergencias e isolamento QA.

## 6. Executar build

```powershell
npm run build
```

O atalho completo e:

```powershell
npm run qa
```

## 7. Testar rotas

Verifique `/`, `/login`, `/cadastro`, `/criar-clube`, `/escritorio`, `/elenco`, `/mercado`, `/imprensa`, `/calendario`, `/minha-conta` e uma rota direta de jogador, funcionario e partida. Confirme ausencia de 404, 500 e loops.

## 8. Testar sessao

1. Entre com uma conta de QA.
2. Atualize a pagina.
3. Abra uma rota autenticada em nova aba.
4. Use voltar e avancar.
5. Navegue pelos cinco modulos e Minha Conta.
6. Confirme que apenas o botao explicito `Sair` encerra a sessao.

## 9. Testar botoes

Percorra a navegacao, cards, abas, filtros, formularios, modais, breadcrumbs e botoes de retorno. Verifique carregamento, clique duplicado, fechamento e mensagem de erro compreensivel.

## 10. Testar responsividade

Use larguras de `320`, `360`, `390`, `430`, `768`, `1024`, `1280`, `1440` e `1920` px. Em cada uma, confira scroll horizontal, texto cortado, barra inferior, area segura, grids, tabelas, formularios e botoes com pelo menos 44 px.

## 11. Testar acessibilidade

Navegue por teclado, confira foco visivel, labels, fieldsets, `aria-label`, mensagens com `role`, contraste, ordem de tabulacao e reducao de movimento.

## 12. Revisar console

Abra cada modulo principal e confirme que nao ha erros de React, hidratacao, rede, promessas rejeitadas ou consultas repetidas sem necessidade.

## 13. Revisar logs

Revise logs de build e runtime da Vercel, e logs `api`, `auth` e `postgres` do Supabase correto: `Projeto Jogo de Futebol Beta` (`vvoisdgpqbzbncjmnhuq`). Nunca use `dommus-casa commerce`.

## 14. Validar deploy

Na URL de producao, valide login, sessao persistente, criacao de clube e os cinco modulos. Para partidas, execute:

1. criar partida QA;
2. salvar plano e designar funcionarios compativeis;
3. iniciar e confirmar bloqueio das decisoes;
4. confirmar que nao ha placar, minuto, eventos ou estatisticas parciais;
5. fechar e reabrir a pagina sem afetar o processamento;
6. no banco de teste, mover apenas `expected_end_at` desta partida QA para o passado e recarregar a pagina;
7. conferir fatos oficiais, estatisticas basicas, relatorios e divergencias;
8. repetir em mobile e desktop;
9. revisar console e requisicoes;
10. confirmar que o deploy usa o mesmo commit de `main`.
