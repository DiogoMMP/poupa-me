# B0015 — Admin deve filtrar as Regras de Despesas Recorrentes pelo banco selecionado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/admin-regras-filtro-banco` (base: `develop`) — a criar após aprovação |
| **Estado** | Planeado |
| **Âmbito** | 1 view-model do frontend (`despesas-recorrentes`), sem alterações ao backend |
| **Verificação** | `cd frontend && npm run build && npm test` + `cd backend && npm run build && npm test` (regressão) |
| **Corrige** | Comportamento introduzido no B0014 (PR #87), que o utilizador não pretende |

## 1. Situação

O B0014 (PR #87, já mergeado em `develop`) fez com que o Admin ignorasse o banco selecionado na
sidebar na página de Regras: `loadData()` chama `service.getAll()` sem `bancoId` para o Admin e vê
todas as regras de todos os utilizadores. Na decisão com o utilizador, essa opção foi escolhida, mas
o acordo real é que as regras **filtram por banco também para o Admin**, tal como as Contas e os
Cartões.

**Evidência:**

- [`despesas-recorrentes-listar-regras.view-model.ts:69-88`](../../../../frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts) —
  `const isAdmin = ...`, `if (!isAdmin && !bancoId)` e `this.service.getAll(isAdmin ? undefined : bancoId)`.
- O backend já suporta o filtro para o Admin, sem alterações:
  [`DespesaRecorrenteService.getAllDespesas`](../../../../backend/src/services/DespesaRecorrente/DespesaRecorrenteService.ts)
  só zera o `filterUserId` para Admin e mantém o `bancoId`; e
  [`DespesaRecorrenteQueryRepo.findAll`](../../../../backend/src/repos/DespesaRecorrente/DespesaRecorrenteQueryRepo.ts)
  aplica `contaOrigem.banco_id = :bancoId` independentemente do `userId`.
- Os cards com `Utilizador:`/`Banco:` (B0014) continuam válidos e não mudam.

**Inventário:**

- **A.** `DespesasRecorrentesListarRegrasViewModel.loadData()` — remover o bypass de Admin; a guarda
  de banco passa a aplicar-se a todos os roles, e o `getAll` recebe sempre o `bancoId` selecionado.

**Escala:** 1 ficheiro de produção, 0 alterações ao backend.

## 2. Resultado pretendido

Qualquer role (Admin incluído) vê as regras do banco selecionado na sidebar. Sem banco selecionado, a
lista fica vazia (comportamento do B0013). Como o Admin pode selecionar qualquer banco (a lista do
header inclui os bancos de todos os utilizadores), continua a conseguir ver as regras de qualquer
utilizador, um banco de cada vez, com `Utilizador:`/`Banco:` no card.

**Decisões:**

- **Admin usa a mesma guarda e o mesmo filtro que os outros roles.** Remove-se o ramo `isAdmin` de
  `loadData()`, e o `auth` continua a ser usado apenas pelo template.
- **Alternativa rejeitada:** manter o Admin a ver tudo (B0014). Rejeitada pelo utilizador.

## 3. Implementação

1. `despesas-recorrentes-listar-regras.view-model.ts` — `loadData()`:
   - remover `isAdmin` e o comentário associado;
   - `if (!bancoId) { regras$ vazio; isLoading false; return; }`;
   - `this.service.getAll(bancoId)`.
   - Manter `public auth = inject(AuthService)` (usado pelo template e pelos cards).

## 4. Verificação

- `cd frontend && npm run build` e `npm test` — 13 specs a passar (sem spec novo: o view-model não tem
  precedente de teste no projeto, ver B0013).
- `cd backend && npm run build` e `npm test` — regressão, 20 testes a passar.
- Manual (não executável nesta sessão): Admin sem banco selecionado vê lista vazia; com um banco
  selecionado vê só as regras desse banco; `User` normal inalterado.

## 5. Riscos

- **Risco:** o Admin pode interpretar a lista vazia (sem banco) como "não há regras". **Mitigação:**
  é o mesmo comportamento de Contas/Cartões e da guarda do B0013; aceite.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Admin filtra as regras pelo banco selecionado | `despesas-recorrentes-listar-regras.view-model.ts` | A |

## 7. Fora de âmbito / handoff

- Mudar o bloqueio global do `AppLayoutComponent` (B0013) — fora de âmbito.
- Spec do view-model — sem precedente no projeto.
