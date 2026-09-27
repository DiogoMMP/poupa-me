# B0014 — Admin não consegue ver as Regras de Despesas Recorrentes

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/admin-regras-despesas-recorrentes` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | Backend (`DespesaRecorrente`: DTO, mapper, service) + Frontend (`despesas-recorrentes`: DTO, model, mapper, view-model, template) |
| **Verificação** | `cd backend && npm run build && npm test` + `cd frontend && npm run build && npm test` |

## 1. Situação

Issue [#38](https://github.com/DiogoMMP/poupa-me/issues/38): *"O admin no frontend não consegue ver
as regras das despesas recorrentes"*.

**Evidência:**

- [`frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts:69-89`](../../../../frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts) —
  `loadData()` só chama o backend quando há um `bancoId` selecionado na sidebar
  (`SelectedBancoService.currentBancoId`); sem isso, esvazia `regras$` e para, para **qualquer**
  role, Admin incluído. Esta guarda foi acrescentada deliberadamente no B0013
  (`docs/changes/bugfixes/B0013-bloqueio-app-sem-banco-selecionado/README.md`) para impedir fuga de
  dados entre bancos do **mesmo** utilizador normal — mas nunca foi pensada para o caso do Admin.
- Quando há um `bancoId` selecionado, `loadData()` passa-o sempre a `service.getAll(bancoId)`
  ([`despesas-recorrentes.service.ts:14-20`](../../../../frontend/src/app/features/despesas-recorrentes/services/despesas-recorrentes.service.ts)),
  que o backend usa para filtrar **um único banco de cada vez**
  ([`DespesaRecorrenteQueryRepo.findAll`](../../../../backend/src/repos/DespesaRecorrente/DespesaRecorrenteQueryRepo.ts):37-43,
  filtra por `contaOrigem.banco_id`). Como o seletor de banco na sidebar só permite escolher um
  banco por vez — mesmo sendo Admin e a lista de bancos incluir os de todos os utilizadores
  ([`BancoService.getAllBancos`](../../../../backend/src/services/Banco/BancoService.ts):209-213,
  `filterUserId` fica `undefined` para Admin) — o Admin nunca consegue ter uma visão de conjunto das
  regras de todos os utilizadores; só vê, de cada vez, as de um banco/utilizador escolhido a monte.
  Confirmado com o utilizador que o comportamento esperado é o Admin ver **todas** as regras, sem
  filtro de banco (ver decisão em §2).
- **Causa raiz de fundo (o que o Admin veria mesmo depois de escolher um banco):** os cards da
  listagem de regras não mostram nenhuma informação de utilizador/banco — ao contrário do padrão já
  aplicado em `Contas`/`CartõesCrédito`/`Bancos` no B0002
  (`docs/changes/bugfixes/B0002-admin-cards-nome-utilizador-banco/README.md`):
  [`despesas-recorrentes-listar-regras.component.html:22-53`](../../../../frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.component.html)
  não tem nenhuma secção `*ngIf="auth.user()?.role === 'Admin'"`, nem o componente
  ([`.component.ts`](../../../../frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.component.ts))
  nem a view-model injetam sequer `AuthService`. Sem essa informação, mesmo com regras de vários
  utilizadores à vista, o Admin não consegue distinguir a quem pertence cada uma — o pedido do
  utilizador é replicar aqui exatamente o padrão já usado em `contas-listar.component.html:39-49`
  (`Utilizador:`/`Banco:` com `formatEntityReference`).
- **`DespesaRecorrenteModel` (frontend) ainda não usa `EntityReference`** para o utilizador, ao
  contrário de `ContasModel`/`CartoesCreditoModel`/`BancosModel` (já migrados no B0002):
  [`despesas-recorrentes.model.ts:9`](../../../../frontend/src/app/features/despesas-recorrentes/models/despesas-recorrentes.model.ts)
  ainda declara `userId?: string`, e o mapper
  ([`despesas-recorrentes.mapper.ts:12`](../../../../frontend/src/app/features/despesas-recorrentes/mappers/despesas-recorrentes.mapper.ts))
  achata `dto.user?.id` para essa string solta — perdendo o nome já devolvido pelo backend em
  `dto.user.nome`.
- **Não existe hoje nenhum campo `banco` no DTO de DespesaRecorrente**, nem no backend
  ([`IDespesaRecorrenteDTO`](../../../../backend/src/dto/IDespesaRecorrenteDTO.ts):9-26) nem no
  frontend ([`despesas-recorrentes.dto.ts:18-35`](../../../../frontend/src/app/features/despesas-recorrentes/dto/despesas-recorrentes.dto.ts)).
  Ao contrário de `Conta`/`CartaoCredito`, que têm `bancoId` diretamente, `DespesaRecorrente` só
  referencia `contaOrigemId` — o banco tem de ser resolvido transitivamente via
  `contaOrigem.bancoId` (confirmado em
  [`Conta.ts:56-58`](../../../../backend/src/domain/Conta/Entities/Conta.ts), campo opcional/nullable
  em BD). O backend já resolve exatamente este padrão para `Conta`
  ([`ContaService.getBancoMap`](../../../../backend/src/services/Conta/ContaService.ts):36-43 +
  `ContaMap.toDTO`:97-108) — este bugfix replica o mesmo mecanismo para `DespesaRecorrente`.

**Inventário (superfícies afetadas):**

- **A.** Backend — `IDespesaRecorrenteDTO`, `DespesaRecorrenteMap.toDTO`, `DespesaRecorrenteService`
  (resolver `banco` por despesa, igual ao que já existe para `Conta`).
- **B.** Frontend — `DespesaRecorrenteDTO`, `DespesaRecorrenteModel`, `DespesasRecorrentesMapper`
  (trocar `userId` solto por `user`/`banco: EntityReference`, mesmo padrão do B0002).
  Inclui o spec já existente do mapper (`despesas-recorrentes.mapper.spec.ts`), que fica desatualizado.
- **C.** Frontend — `DespesasRecorrentesListarRegrasViewModel.loadData()`: Admin deixa de precisar de
  banco selecionado e passa a ver todas as regras de todos os utilizadores/bancos; restantes roles
  mantêm a guarda do B0013 sem alteração.
- **D.** Frontend — cards em `despesas-recorrentes-listar-regras.component.html`/`.ts`: secção
  Admin-only com `Utilizador:`/`Banco:`, réplica do padrão de `contas-listar`.

**Escala:** 2 features (backend `DespesaRecorrente` + frontend `despesas-recorrentes`), 8 ficheiros
de produção alterados, 1 spec atualizado, 0 chamadas extra ao backend introduzidas (a listagem já
fazia 1 pedido; passa a fazer o mesmo pedido, só que sem `bancoId` quando é Admin).

## 2. Resultado pretendido

O Admin abre `/despesas-recorrentes/listar-regras` e vê **todas** as regras de despesa recorrente de
**todos** os utilizadores, com cada card a mostrar, na secção só-visível-para-Admin (por baixo do
botão "Editar", igual às outras features), `Utilizador: Nome (id)` e `Banco: Nome (id)`. Um
utilizador normal (`User`) continua a precisar de escolher um banco na sidebar para ver as suas
próprias regras desse banco — comportamento do B0013, não alterado aqui.

**Decisões:**

- **Confirmado com o utilizador:** para o Admin, a listagem de regras ignora o banco selecionado na
  sidebar e mostra sempre as regras de todos os utilizadores/bancos, tal como a página `Bancos` já
  faz hoje — em vez de continuar limitada a um banco de cada vez com informação extra nos cards
  apenas para consistência visual.
- **Resolução do `banco` replica exatamente o mecanismo já existente para `Conta`**
  (`ContaService.getBancoMap` + `ContaMap.toDTO`), em vez de inventar um novo padrão: um
  `getBancoMap(userId?)` novo em `DespesaRecorrenteService`, e o `bancoId` de cada despesa resolvido
  a partir da `Conta` de origem (`contaOrigemId` → `conta.bancoId` → `banco.nome`/`banco.icon`).
  Isto implica estender o `Map` interno já existente (`getInfoMap`) para também guardar o
  `bancoId` de cada conta (não só nome/ícone), e passar um `bancoMap` adicional a
  `enrichDespesaDTO`/`enrichDespesaDTOList` — tocando os 6 métodos de serviço que devolvem
  `IDespesaRecorrenteDTO` (`create`, `update`, `get`, `getAll`, `getComValor`, `getSemValor`), para
  que o campo `banco` fique consistente em toda a API, e não só na listagem usada pelos cards.
  **Alternativa rejeitada:** resolver `banco` só dentro de `getAllDespesas` (o único caminho
  realmente exercido pelos cards agora) — rejeitada por deixar o DTO com um campo `banco?` que só é
  preenchido nalguns endpoints, uma inconsistência que confundiria o próximo bug.
- **`DespesaRecorrenteModel` passa a ter `user?: EntityReference` e `banco?: EntityReference`**,
  substituindo `userId?: string` (não mantido em paralelo) — mesmo tratamento do B0002, reutilizando
  o tipo `EntityReference`/`formatEntityReference` partilhados já existentes (não recriados).
  Confirmado por grep que `userId` do `DespesaRecorrenteModel` só é lido no spec do mapper (a
  atualizar) — nenhum ecrã de criar/editar/gerar-transação depende dele.
- **A guarda "banco selecionado obrigatório" mantém-se para `User`**, só é contornada para `Admin`
  (`auth.user()?.role === 'Admin'`), replicando a forma como o resto da app já distingue os dois
  papéis (`contas-listar.component.html`, etc.) — não se toca no mecanismo global de bloqueio do
  B0013 (`AppLayoutComponent`), que continua a exigir *algum* banco selecionado para desbloquear a
  rota `/despesas-recorrentes/*` (ver §5, risco aceite).

**Alternativas rejeitadas:**

- *Adicionar `bancoId` diretamente à entidade `DespesaRecorrente`* (desnormalizar), para evitar o
  join transitivo via `contaOrigem`. Rejeitada: exigiria migração de esquema e passaria a haver duas
  fontes de verdade para o banco de uma regra (a da própria regra e a da conta de origem, que podem
  divergir se a conta mudar de banco) — fora de âmbito para corrigir uma issue de visualização.

## 3. Implementação

**Fase 1 — Backend: resolver e expor `banco` no DTO de DespesaRecorrente:**

1. `backend/src/dto/IDespesaRecorrenteDTO.ts` — `IDespesaRecorrenteDTO.banco?: IEntityReferenceDTO`
   (junto a `user?`).
2. `backend/src/mappers/DespesaRecorrenteMap.ts` — `toDTO` ganha um 4º parâmetro opcional
   `banco?: IEntityReferenceDTO`, incluído no objeto devolvido como `banco`.
3. `backend/src/services/DespesaRecorrente/DespesaRecorrenteService.ts`:
   - Injetar `@Inject('BancoRepo') private bancoRepo: IBancoRepo` (já registado no DI — usado por
     `ContaService`).
   - `getInfoMap(userId?)` passa a guardar também `bancoId` por cada conta (`c.bancoId`), no mesmo
     `Map` (valor `{ nome?, icon?, bancoId? }`).
   - Novo `getBancoMap(userId?)`, cópia direta de `ContaService.getBancoMap`.
   - `enrichDespesaDTO`/`enrichDespesaDTOList` passam a receber também `bancoMap`, resolvem
     `bancoId = map.get(despesa.contaOrigemId.toString())?.bancoId` e constroem
     `{ id: bancoId, nome, icon }` (ou `undefined` se a conta de origem não tiver banco associado),
     passando-o a `DespesaRecorrenteMap.toDTO`.
   - `createDespesa`, `updateDespesa`, `getDespesa`, `getAllDespesas`, `getDespesasComValor`,
     `getDespesasSemValor` — cada um passa a chamar também `getBancoMap` com o mesmo `userId`/
     `filterUserId` já usado para `getInfoMap`, e a passar o resultado a `enrichDespesaDTO`/
     `enrichDespesaDTOList`.
4. `backend/src/api/routes/DespesaRecorrente/DespesaRecorrenteRoute.ts` — Swagger: acrescentar
   `banco: { $ref: '#/components/schemas/EntityReference' }` ao schema `DespesaRecorrente`.

**Fase 2 — Frontend: `EntityReference` no DTO/Model/Mapper (habilita os cards):**

5. `frontend/src/app/features/despesas-recorrentes/dto/despesas-recorrentes.dto.ts` —
   `DespesaRecorrenteDTO.banco?: EntityReference` (junto a `user?`).
6. `frontend/src/app/features/despesas-recorrentes/models/despesas-recorrentes.model.ts` —
   `userId?: string` → `user?: EntityReference; banco?: EntityReference;`.
7. `frontend/src/app/features/despesas-recorrentes/mappers/despesas-recorrentes.mapper.ts` —
   `toModel` passa `dto.user`/`dto.banco` diretamente (em vez de `dto.user?.id`).
8. `frontend/src/app/features/despesas-recorrentes/mappers/despesas-recorrentes.mapper.spec.ts` —
   atualizar as asserções de `model.userId` para `model.user`/`model.banco` (objeto), e acrescentar
   `banco` ao DTO de teste.

**Fase 3 — Frontend: Admin vê todas as regras, sem filtro de banco:**

9. `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts`
   — injetar `AuthService` (`private auth = inject(AuthService)`); em `loadData()`, quando
   `auth.user()?.role === 'Admin'`, chamar `service.getAll()` sem `bancoId` (ignora o banco
   selecionado); para os restantes roles, mantém a guarda existente do B0013 sem alteração.

**Fase 4 — Frontend: cards mostram Utilizador/Banco para o Admin:**

10. `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.component.ts`
    — expor `auth` (da view-model) e `formatEntityReference` (util partilhado) ao template, mesmo
    padrão de `contas-listar.component.ts`.
11. `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.component.html`
    — dentro de `.card-actions`, acrescentar `<ng-container *ngIf="auth.user()?.role === 'Admin'">`
    com `<small><b>Utilizador:</b> {{ formatEntityReference(regra.user) }}</small>` e
    `<small><b>Banco:</b> {{ formatEntityReference(regra.banco) }}</small>`, réplica do bloco em
    `contas-listar.component.html:39-49`.

## 4. Verificação

- `cd backend && npm run build` — sem baseline de erros pré-existente a esta data.
- `cd backend && npm test` — sem baseline de testes a falhar previamente; não há specs dedicados a
  `DespesaRecorrenteService` hoje (só `DespesaRecorrenteProcessadorService.spec.ts`, de outro
  serviço) — não introduzido um spec novo aqui por não haver precedente de teste de serviço nesta
  feature e para não alargar o âmbito de um bugfix de visualização; ver §7.
- `cd frontend && npm run build` — sem baseline de erros pré-existente a esta data.
- `cd frontend && npm test` — corre o `despesas-recorrentes.mapper.spec.ts` atualizado. **Nota
  herdada do B0001/B0002**: dependências de Karma/Jasmine em falta em `package.json`; pode falhar
  num `npm ci` limpo com `Cannot find module 'karma'` até esse gap ser corrigido (fora de âmbito,
  já registado).
- Verificação manual (não automatizável nesta sessão): com o backend a correr localmente, sessão de
  Admin, selecionar um banco qualquer na sidebar (necessário só para passar o bloqueio global do
  B0013) e abrir `/despesas-recorrentes/listar-regras`; confirmar que aparecem regras de mais do que
  um utilizador/banco (se existirem em BD) e que cada card mostra `Utilizador: Nome (id)` /
  `Banco: Nome (id)`. Repetir com sessão de `User` normal e confirmar que o comportamento existente
  (precisa de banco selecionado, só vê as suas próprias regras desse banco, sem secção Admin) não
  mudou.

## 5. Riscos

- **Risco:** alguma `Conta` de origem não ter `bancoId` associado (campo opcional em BD — dados
  antigos ou migração incompleta). **Mitigação:** `banco` fica `undefined` nesse caso;
  `formatEntityReference` já trata isso mostrando `"-"`, nunca um erro de renderização.
- **Risco:** o Admin continua a precisar de selecionar *algum* banco na sidebar para passar o
  bloqueio global do B0013 antes de chegar a `/despesas-recorrentes/listar-regras`, mesmo que essa
  escolha deixe de influenciar a lista de regras que vê. **Aceite**: alterar o mecanismo do
  `AppLayoutComponent` para excluir o Admin do bloqueio, ou para esta rota especificamente, é uma
  mudança maior e transversal (afeta também Contas/Cartões/Dashboard/Estatísticas para o Admin), fora
  do âmbito desta correção pontual — ver §7.
- **Risco:** expor `banco` em todos os métodos do serviço (não só na listagem) aumenta ligeiramente o
  número de queries por pedido (`getBancoMap` a mais). **Mitigação:** mesmo custo que `ContaService`
  já paga hoje por operação — não é uma query por despesa, é uma query `findAll` por pedido,
  independente do número de despesas devolvidas.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Backend: resolve e expõe `banco` no DTO de DespesaRecorrente | `IDespesaRecorrenteDTO.ts`, `DespesaRecorrenteMap.ts`, `DespesaRecorrenteService.ts`, `DespesaRecorrenteRoute.ts` | A |
| 2 | Frontend: `EntityReference` no DTO/Model/Mapper de despesas recorrentes + teste | `despesas-recorrentes.dto.ts`, `despesas-recorrentes.model.ts`, `despesas-recorrentes.mapper.ts`, `despesas-recorrentes.mapper.spec.ts` | B |
| 3 | Frontend: Admin vê todas as regras sem filtro de banco | `despesas-recorrentes-listar-regras.view-model.ts` | C |
| 4 | Frontend: cards mostram Utilizador/Banco para o Admin | `despesas-recorrentes-listar-regras.component.ts`, `despesas-recorrentes-listar-regras.component.html` | D |

## 7. Fora de âmbito / handoff

- **Excluir o Admin do bloqueio global "banco selecionado obrigatório" do B0013** para todas as
  rotas banco-dependentes (não só despesas recorrentes) — mudança maior e transversal, própria de um
  bugfix dedicado se vier a ser pedida.
- **Corrigir `package.json` do frontend** para incluir as dependências de Karma/Jasmine em falta —
  gap de infraestrutura já identificado no B0001, decisão do utilizador, ainda por tratar.
- **Testes de serviço para `DespesaRecorrenteService`** — não existe precedente nesta feature
  (só o `Processador`); introduzir um novo padrão de teste de serviço fica fora deste bugfix.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
