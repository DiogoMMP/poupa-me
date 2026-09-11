# B0003 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/dashboard-banco-endpoint-404` |
| **Estado** | Implementado |
| **Build** | `npm run build` (backend e frontend) — passa nos dois, sem baseline de erros/warnings pré-existente |
| **Testes** | Backend: `npm test` — 14/14 passa (**3 testes novos**, primeiro spec de `DespesaRecorrenteProcessadorService`). Frontend: `npm test` — 7/7 passa (sem testes novos — ver §3) |
| **Commits** | Ainda não commitado (ver `commit-push`) |

## 1. O que foi fechado

- **A.** `getDataAgendada` passa a validar, com `Data.createFromParts(..., allowPastDates=true)`,
  se a combinação mes/diaDoMes forma uma data de calendário real — para "Despesa Mensal"/
  "Poupança" **e** "Despesa Anual" (extensão acordada com o utilizador, além do que o CodeRabbit
  apontou só para o Anual). `gerarTransacao` ignora a regra (com log) em vez de gerar a transação
  numa data normalizada silenciosamente errada. **Fechado**, confirmado por 3 testes novos: 2
  casos que provam que o código antigo gerava a data errada (29/Fev→1/Mar; 31/Abril→1/Maio) e
  agora devolvem `null`; 1 caso que confirma que uma combinação válida continua a funcionar como
  antes.
- **B.** `B0001 RESULT.md` — linhas "Testes" e "Commits" da tabela de metadados corrigidas para
  refletir o estado real (gap de infraestrutura do Karma; hash do commit real). **Fechado.**
- **C.** `toDto()` em `contas.mapper.ts`, `bancos.mapper.ts` e `cartoes-credito.mapper.ts` passam a
  incluir `user: model.user`, simétrico com `toModel()`. **Fechado.**

## 2. Pontos que precisam de decisão

Nenhum. A única decisão relevante (estender a correção A também ao ramo Mensal/Poupança) foi
tomada pelo utilizador antes de implementar.

## 3. Desvios do plano aprovado

- Nenhum desvio de implementação. Os 3 pontos do §3 do README foram seguidos exatamente como
  descrito.
- **Não adicionado teste de frontend para o item C**, como já previsto no README §4 — `toDto()` é
  código morto (nenhum consumidor), pelo que não há um caminho de execução real para exercitar num
  teste sem inventar um consumidor só para esse efeito.

## 4. Não verificado / achado durante a verificação

- Verificação manual do processamento de despesas recorrentes com uma regra real configurada para
  uma combinação de data inválida (correr o `DespesaRecorrenteProcessadorService` contra uma BD
  real) não foi executada nesta sessão — sem Postgres disponível. A prova de correção assenta nos
  3 testes unitários novos (§5) e na confirmação, por `git stash` temporário, de que falham contra
  o código antigo.
- **Regras já existentes em produção com combinações mes/diaDoMes inválidas** — sem forma de
  auditar isto sem acesso à BD de produção nesta sessão (já assinalado no README §5/§7).

## 5. Como correr a verificação

- `cd backend && npm run build && npm test` — corre o novo
  `DespesaRecorrenteProcessadorService.spec.ts`.
- `cd frontend && npm run build && npm test` — confirma que os 3 mappers continuam a compilar e a
  passar nos testes já existentes.
- Confirmado nesta sessão (via `git stash` só ao ficheiro do processador) que os 2 primeiros casos
  do novo spec **falham** contra o código antigo (recebem `2026-03-01`/data de Maio em vez de
  `null`) e **passam** com a correção.

## 6. Inventário de alterações

| Ficheiro | Estado |
| :--- | :--- |
| `backend/src/services/DespesaRecorrente/DespesaRecorrenteProcessadorService.ts` | alterado |
| `backend/src/services/DespesaRecorrente/tests/DespesaRecorrenteProcessadorService.spec.ts` | novo |
| `docs/changes/bugfixes/B0001-dashboard-banco-endpoint-404/RESULT.md` | alterado |
| `frontend/src/app/features/contas/mappers/contas.mapper.ts` | alterado |
| `frontend/src/app/features/bancos/mappers/bancos.mapper.ts` | alterado |
| `frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.ts` | alterado |
| `docs/changes/bugfixes/B0003-correcoes-revisao-coderabbit-pr75/README.md` | novo |
| `docs/changes/bugfixes/B0003-correcoes-revisao-coderabbit-pr75/RESULT.md` | novo |
| `docs/changes/bugfixes/README.md` | alterado (nova linha do índice) |
