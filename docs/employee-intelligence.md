# Sistema inicial de inteligencia dos funcionarios

## Limites de responsabilidade

O motor TypeScript calcula satisfacao, confianca, moral, fadiga, tolerancia, ganho de aptidao, saturacao, custos e efeitos. O texto da reuniao passa por uma interpretacao estruturada e validada, mas nunca fornece valores numericos ao banco.

Quando `OPENAI_API_KEY` esta configurada, a interpretacao usa a Responses API com Structured Outputs, `store: false` e schema estrito. Sem credencial ou diante de erro/timeout, usa as regras deterministicas de `lib/staff/engine.ts`. Nos dois casos, o modelo nao controla os numeros do jogo.

## Persistencia

- `employees`: entidade canonica, contrato, aptidoes e talentos naturais ocultos.
- `employee_personality_concepts`: treze conceitos em escala de zero a cinco e tres a cinco conceitos centrais.
- `employee_status`: satisfacao, confianca, moral, carga e fadigas.
- `employee_relationships`: relacao, confianca e conflito por alvo.
- `meetings`, `meeting_participants`, `meeting_results`: texto original, interpretacao, participantes e efeitos.
- `employee_memories`, `employee_promises`: memoria estruturada e compromissos acompanhaveis.
- `employee_courses`: metodo, conteudo, saturacao, custo, prazo e resultado.
- `advisor_messages`: orientacoes agrupadas, priorizadas e reabriveis.
- `tutorial_progress`: progresso por usuario e clube, retomado entre dispositivos.

Todas as tabelas possuem RLS por propriedade do clube. `anon` e `authenticated` nao recebem grants diretos; as operacoes passam por rotas autenticadas e funcoes concedidas somente a `service_role`. A coluna `natural_talents` nunca e retornada pelas APIs.

## Migracao do prototipo

Os funcionarios existentes permanecem no estado legado. `StaffSyncBridge` envia apenas campos permitidos para `/api/staff/sync`; o servidor gera personalidade e talento a partir de uma semente estavel por clube e funcionario. Sincronizacoes posteriores atualizam contrato, cargo e status, mas nao reescrevem talento, personalidade ou aptidoes persistentes.

## Reunioes

`classifyMeeting()` produz um objeto validado com tipo, tom, topicos, instrucoes, promessas, elogios e reclamacoes. `evaluateMeeting()` aplica personalidade, carga, fadiga, frequencia e absorcao dinamica. `apply_employee_meeting_result()` limita os deltas e persiste resultado, memoria, relacao e promessa em uma transacao.

O relatorio prioriza gerente ou coordenador administrativo, auxiliar administrativo, gerente ou diretor de futebol. O psicologo pode acrescentar observacao quando moral, conflito ou satisfacao forem afetados.

## Cursos

- EAD: 3,27%, R$ 12.598,80, quatro dias.
- Fim de semana: 6,41%, R$ 19.638,32, um dia, iniciado no domingo.
- Imersao: 9,62%, R$ 26.104,71, sete dias.

A repeticao do mesmo conteudo em 180 dias aplica 100%, 65%, 35% e 15%. Outro conteudo com o mesmo metodo nao recebe penalidade. A contratacao desconta o caixa de forma atomica; a conclusao e processada ao carregar o sistema. Desligar o funcionario cancela o curso ativo.

## Orientacoes e tutorial

Orientacoes comuns sao limitadas a tres por hora e mensagens semelhantes sao agrupadas. Alertas criticos ignoram esse limite. A Central permite filtrar, ler, resolver, dispensar e reabrir o historico.

Marina Azevedo, Coordenadora Administrativa Interina, conduz dez etapas persistentes. Ela nao e uma linha de `employees`, nao ocupa vaga e nao recebe salario. O tutorial pode ser pausado, encerrado, reaberto e retomado em outro dispositivo.
