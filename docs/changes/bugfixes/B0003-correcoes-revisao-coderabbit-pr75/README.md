# B0003 — Corrige os 3 findings reais da revisão do CodeRabbit no PR #75

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/dashboard-banco-endpoint-404` (base: `develop`) — mesma branch do PR #75 |
| **Estado** | Planeado |
| **Âmbito** | 1 método de backend (`DespesaRecorrenteProcessadorService.getDataAgendada`), 1 ficheiro de documentação (`B0001 RESULT.md`), 3 mappers de frontend (`toDto`) |
| **Verificação** | `npm test` + `npm run build` (backend e frontend) |

## 1. Situação

O CodeRabbit reviu o PR #75 e reportou 4 findings. Todos foram verificados manualmente contra o
código atual numa análise anterior nesta conversa, antes de qualquer decisão de implementação. 3
são reais; 1 foi rejeitado como falso positivo (não entra neste âmbito).

**Evidência (confirmada por leitura direta do código nesta branch):**

- **A. `getDataAgendada` normaliza silenciosamente datas inválidas.**
  [`backend/src/services/DespesaRecorrente/DespesaRecorrenteProcessadorService.ts:264-286`](../../../../backend/src/services/DespesaRecorrente/DespesaRecorrenteProcessadorService.ts) —
  para "Despesa Anual" (linha 272-275), `new Date(ano, mes, dia)` normaliza silenciosamente
  combinações inválidas de mês/dia (ex.: 29/Fev num ano não bissexto vira 1/Mar). Confirmado que
  `validateAgendamento` em `DespesaRecorrenteService.ts:283-310` só exige que `mes`+`diaDoMes`
  venham juntos, nunca valida se formam uma data de calendário real. Confirmado que é acionável
  pela UI normal:
  [`despesas-recorrentes-nova-regra.component.html:139-168`](../../../../frontend/src/app/features/despesas-recorrentes/components/nova-regra/despesas-recorrentes-nova-regra.component.html)
  tem "Dia do Mês" (`<input type="number" min="1" max="31">`) e "Mês" (`min="1" max="12"`) como
  dois campos independentes, sem validação cruzada.
  **Achado adicional, não reportado pelo CodeRabbit:** o mesmo mecanismo (`new Date(...)` a
  normalizar silenciosamente) existe também no ramo "Despesa Mensal"/"Poupança"
  (linha 267-269) — um `diaDoMes=31` num mês com menos de 31 dias sofre o mesmo rollover. Mesma
  causa raiz, mesmo ficheiro; confirmado com o utilizador que entra no mesmo âmbito. O ramo
  "Despesa Semanal" (linha 278-283) usa aritmética de dia-da-semana — não tem combinação inválida
  possível, fica de fora.
- **B. Metadados desatualizados em `B0001 RESULT.md`.**
  [`docs/changes/bugfixes/B0001-dashboard-banco-endpoint-404/RESULT.md:9-10`](../../../../docs/changes/bugfixes/B0001-dashboard-banco-endpoint-404/RESULT.md) —
  a linha "Testes" diz só "1/1 passa", sem referir que isso só funciona depois de instalar
  localmente dependências do Karma não declaradas em `package.json` (já documentado no §4 do
  próprio ficheiro) e que falha num checkout limpo; a linha "Commits" ainda diz "Ainda não
  commitado", apesar de o ficheiro estar commitado há várias sessões.
  **Confirmado que o mesmo padrão de campo "Commits" desatualizado existe em todos os outros
  `RESULT.md` já escritos** (B0002 nesta branch, F0001 em `develop`) — fora de âmbito corrigir
  todos agora (ver §7); só o B0001, que foi o especificamente apontado, é corrigido aqui.
- **C. `toDto()` omite `user` em três mappers.**
  [`frontend/src/app/features/contas/mappers/contas.mapper.ts:28-39`](../../../../frontend/src/app/features/contas/mappers/contas.mapper.ts),
  e o mesmo padrão confirmado em
  [`bancos.mapper.ts`](../../../../frontend/src/app/features/bancos/mappers/bancos.mapper.ts) e
  [`cartoes-credito.mapper.ts`](../../../../frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.ts) —
  `toDto()` devolve `banco`/`contaPagamento` mas nunca `user`, ao contrário de `toModel()` que já o
  inclui nos três. Confirmado por grep que `toDto()` **nunca é chamado em lado nenhum da app**
  (código morto — os fluxos de criar/editar usam `*InputDTO`/`*UpdateDTO` diretamente) — sem
  impacto funcional hoje, mas uma armadilha para uso futuro.
- **D (rejeitado, não entra neste âmbito).** O CodeRabbit também apontou o `Estado: Planeado` em
  `B0002 README.md` como inconsistente com `RESULT.md`. Confirmado que isto é a convenção
  deliberada deste projeto — o README fica congelado como o plano aprovado; o estado real vive no
  `RESULT.md` e no índice. B0001 e o F0001 (já em `develop`) seguem o mesmo padrão. Corrigir isto
  quebraria a própria convenção.

**Inventário (superfícies afetadas):**

- **A.** `DespesaRecorrenteProcessadorService.getDataAgendada` + `gerarTransacao` (guarda de
  chamada).
- **B.** `docs/changes/bugfixes/B0001-dashboard-banco-endpoint-404/RESULT.md` (só a tabela de
  metadados).
- **C.** `contas.mapper.ts`, `bancos.mapper.ts`, `cartoes-credito.mapper.ts` (`toDto`).

**Escala:** 1 método de backend com 2 ramos afetados, 1 ficheiro de documentação (2 linhas), 3
mappers de frontend (1 linha cada).

## 2. Resultado pretendido

`getDataAgendada` deixa de poder devolver uma data que não corresponde ao mês/dia configurado na
regra — se a combinação não existir no calendário, a regra é ignorada nesse ciclo (com log de
erro), em vez de gerar uma transação numa data errada silenciosamente. `B0001 RESULT.md` reflete o
estado real. Os três `toDto()` ficam simétricos com os respetivos `toModel()`.

**Decisões:**

- **Reutilizar `Data.createFromParts(dia, mes, ano, allowPastDates=true)`** (já existe, valida
  calendário real incluindo anos bissextos) em vez de escrever uma validação nova. `allowPastDates`
  a `true` porque aqui só interessa validar que a combinação existe — a regra de "não pode ser
  futuro" desse VO não é relevante para este uso.
  **Alternativa rejeitada:** escrever uma verificação manual (`new Date(...)` e comparar
  `getDate()` com o dia pedido). Rejeitada por duplicar lógica que já existe e já está testada
  implicitamente pelo resto do domínio.
- **`getDataAgendada` passa a devolver `Date | null`**; `gerarTransacao` ganha um guard-clause
  (`if (!dataAgendada) { log + return; }`) seguindo exatamente o padrão já usado nesse método para
  as outras validações (valor em falta, contaDestino em falta) — nenhum estilo novo introduzido.
- **Só o `B0001 RESULT.md` é corrigido**, não todos os `RESULT.md` com o mesmo padrão de "Commits"
  desatualizado — era o único apontado pelo CodeRabbit; os outros ficam registados em §7.
- **`README.md` do B0002 não é tocado** (finding D, rejeitado — ver §1).

**Alternativas rejeitadas:**

- *Validar a data no frontend (formulário de nova-regra/editar-regra)*, em vez de (ou além de) no
  backend. Rejeitada para este âmbito: o backend é a fronteira que garante a invariante
  independentemente do cliente (a API pode ser chamada diretamente); validação no frontend é uma
  melhoria de UX separada, não necessária para fechar o finding do CodeRabbit.

## 3. Implementação

1. **`backend/src/services/DespesaRecorrente/DespesaRecorrenteProcessadorService.ts`**
   - Importar `Data` de `../../domain/Shared/ValueObjects/Data.js`.
   - `getDataAgendada`: assinatura passa a `(regra: DespesaRecorrente, hoje: Date): Date | null`.
     Para os ramos "Despesa Mensal"/"Poupança" e "Despesa Anual", validar com
     `Data.createFromParts(dia, mes, ano, true)` antes de construir o `Date`; devolver `null` se
     `isFailure`.
   - `gerarTransacao`: após `const dataAgendada = this.getDataAgendada(regra, hoje);`, adicionar
     `if (!dataAgendada) { this.logger.error(...); return; }`, com uma mensagem de log que
     identifique a regra (`regra.id`).

2. **`docs/changes/bugfixes/B0001-dashboard-banco-endpoint-404/RESULT.md`** — corrigir só as
   linhas "Testes" e "Commits" da tabela de metadados (linhas 9-10), conforme §1.

3. **`frontend/src/app/features/contas/mappers/contas.mapper.ts`,
   `frontend/src/app/features/bancos/mappers/bancos.mapper.ts`,
   `frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.ts`** — adicionar
   `user: model.user,` ao objeto devolvido por `toDto()` em cada um.

4. **Testes novos** (`backend/src/services/DespesaRecorrente/tests/DespesaRecorrenteProcessadorService.spec.ts`,
   primeiro spec deste serviço) — `getDataAgendada` (via acesso ao método privado por cast, ou
   testado indiretamente através de `gerarTransacao` com um repo/serviço mockado): para
   "Despesa Anual" com `mes=2, diaDoMes=29` num ano não bissexto, confirmar que a transação **não**
   é gerada (guard-clause disparado) em vez de ser gerada a 1 de Março. Falha contra o código
   atual (que gera a transação na data errada), passa depois da correção.

## 4. Verificação

- `cd backend && npm run build && npm test` — sem baseline de erros pré-existente; o novo spec deve
  passar.
- `cd frontend && npm run build && npm test` — sem baseline de erros pré-existente; os `toDto()`
  corrigidos não têm teste dedicado nesta correção (código morto, sem consumidor — ver §7).
- Verificação manual do processamento de despesas recorrentes (correr o processador com uma regra
  anual configurada para 29/Fev num ano não bissexto) não é automatizável nesta sessão — ver
  `RESULT.md` §4.

## 5. Riscos

- **Risco:** alguma regra "Despesa Anual"/"Mensal" já existente em produção ter uma combinação
  mes/diaDoMes inválida guardada (criada antes desta correção, sem validação). Depois desta
  mudança, essa regra deixaria de gerar transações silenciosamente (em vez de gerar na data
  errada). **Mitigação:** é o comportamento pretendido — gerar na data errada era o próprio bug;
  o log de erro passa a assinalar claramente qual regra precisa de correção manual pelo
  utilizador. Sem forma de detetar isto sem acesso à BD de produção — fica anotado no handoff (§7).
- **Risco:** `Data.createFromParts` com `allowPastDates=true` aceitar uma combinação que
  `verifyDateLimitations` rejeitaria só por causa da checagem de "não pode ser futuro" que aqui
  queremos ignorar. **Mitigação:** confirmado por leitura do código-fonte de
  `verifyDateLimitations` que a checagem de futuro só corre quando `allowPastDates=false` — com
  `true`, só a validação de calendário real é aplicada, que é exatamente o que se quer aqui.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Validação de data em `getDataAgendada` + teste | `DespesaRecorrenteProcessadorService.ts`, `DespesaRecorrenteProcessadorService.spec.ts` (novo) | A |
| 2 | Metadados do B0001 RESULT.md | `B0001-dashboard-banco-endpoint-404/RESULT.md` | B |
| 3 | Simetria `toDto()`/`toModel()` nos 3 mappers | `contas.mapper.ts`, `bancos.mapper.ts`, `cartoes-credito.mapper.ts` | C |

## 7. Fora de âmbito / handoff

- **`Estado: Planeado` no `B0002 README.md`** — finding rejeitado, convenção deliberada do
  projeto (ver §1, achado D).
- **Campo "Commits" desatualizado nos outros `RESULT.md`** (B0002 nesta branch, F0001 em
  `develop`) — mesmo padrão do B (só o B0001 foi apontado e é corrigido aqui); decisão do
  utilizador se quer uma limpeza geral depois.
- **Validar a combinação mes/diaDoMes no frontend** (formulário de nova-regra/editar-regra), para
  dar feedback imediato ao utilizador em vez de só bloquear silenciosamente no processador —
  melhoria de UX separada, não necessária para fechar o finding do CodeRabbit.
- **Regras já existentes com combinações inválidas** — sem forma de auditar isto sem acesso à BD
  de produção nesta sessão.
