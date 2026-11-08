# F0007 — Resultado: paginação no servidor para as listas de transações

| | |
| :--- | :--- |
| **Tipo** | Feature — fecha a [issue #50](https://github.com/DiogoMMP/poupa-me/issues/50) (PR [#95](https://github.com/DiogoMMP/poupa-me/pull/95)) |
| **Branch** | `feature/paginacao-api-transacoes` (base: `develop`) |
| **Estado** | Implementado — testes manuais em browser feitos pelo utilizador; Cypress não corrido (ver §4) |
| **Build** | Backend `npm run build` ✅ (baseline ✅). Frontend `npm run build` ✅ sem erros nem warnings novos (baseline ✅). `build-storybook` ✅ |
| **Lint** | Backend `npm run lint`: 58 problemas (51 erros, 7 warnings) — **igual ao baseline**, nos mesmos 18 ficheiros, nenhum deles tocado por esta change |
| **Testes** | Backend 77/77 (baseline 59/59; **+18** em `Pagination.spec.ts`, 6 deles da revisão do PR, ver §7). Frontend 15/15 (baseline 13/13; **+2** em `transacoes.service.spec.ts`) |
| **Commits** | `862464a`..`57c6d61` (7 commits, PR #95) + os commits da revisão CodeRabbit (§7) |

## 1. O que foi fechado

- **A. Infra de paginação partilhada (backend)** — ✅ `IPaginatedDTO<T>`, `IPaginationParams`, `IPagedRows<T>` em `dto/shared/IPaginatedDTO.ts`; `parsePagination` / `toPaginated` / `PAGE_SIZE_OPTIONS` / `DEFAULT_PAGE_SIZE` em `core/logic/Pagination.ts`.
- **B. `GET /transacao/all-conta` paginado** — ✅ `?page=&pageSize=`, resposta `{ items, page, pageSize, totalPages, totalItems }`, `400` para `page`/`pageSize` inválidos; Swagger atualizado com o schema `PaginatedTransacao` (validado com `swagger-jsdoc`, `failOnErrors: true`).
- **C. `GET /transacao/all-cartao` paginado** — ✅ idem.
- **D. `app-pagination` com seletor de tamanho** — ✅ `pageSizeOptions` (10/25/50/100), `pageSizeChanged`, `[totalPages]` opcional, total de itens; story `WithPageSizeSelector`.
- **E. Lista de transações usa a paginação da API** — ✅ um pedido por coluna com todos os filtros, estado de página/tamanho por coluna, delete recarrega a página, salto para a última página se a atual ficar para lá do fim.
- **F. Testes** — ✅ backend (parsing/validação e cálculo de `totalPages`) e frontend (query params enviados). Não há teste do repo contra BD (ver §4).

## 2. Pontos que precisam de decisão

- **Semântica de `period` diferente entre backend e o antigo filtro do frontend.** Com todos os filtros no servidor, `period` usa sempre a janela móvel do backend: "Este Mês" = desde o mesmo dia do mês anterior; "Últimos 3 Meses" = desde o mesmo dia de há **4** meses (`getMonth() - 4`); "Último Ano" = desde o mesmo dia de há um ano. O `filterByPeriod` do frontend, que antes era aplicado nos filtros combinados (p.ex. conta + período), usava o mês civil e "Últimos 3 Meses" = desde dia 1 de há 2 meses. **Consequência:** a vista por omissão (só "Este Mês") não muda, porque já usava o backend; mas quem combinar período com conta, categoria ou estado passa a ver mais transações do que antes (p.ex. os últimos dias do mês anterior em "Este Mês"). E o `-4` em "Últimos 3 Meses" parece mesmo um bug. Até alguém decidir, "Este Mês" na lista não quer dizer "mês civil".
  - **Decidido na revisão do PR #95 (finding #4 do CodeRabbit):** o utilizador quis manter a janela móvel e corrigir só o `-4`, que passou a `-3` (ver §7). Fica assim: "Este Mês" = desde o mesmo dia do mês anterior, "Últimos 3 Meses" = desde o mesmo dia de há 3 meses, "Último Ano" = desde o mesmo dia de há um ano. Deixa de haver decisão em aberto. Fica só uma consequência: a etiqueta "Este Mês" não quer dizer mês civil.
  - **O mesmo `-4` existia em `TransacaoDespesasRecorrentesRepo.ts:48`** (`/transacao/despesa-recorrente`). Também foi corrigido para `-3` neste PR, a pedido do utilizador, e já não há nenhum `getMonth() - 4` no backend.

## 3. Desvios do plano aprovado

Alterações pedidas pelo utilizador depois da aprovação:

- **O tamanho de página por omissão passou de 10 para 25**, no backend (`DEFAULT_PAGE_SIZE` em `Pagination.ts`, `default` no Swagger, spec) e no frontend (`DEFAULT_PAGE_SIZE` exportado de `pagination.component.ts`, usado pelo view-model e pelo input `pageSize`).
- **A barra de paginação aparece sempre**, seja qual for o número de itens. O plano escondia-a quando havia poucos itens.
- **Layout da barra:** à esquerda, o seletor (só com o número: "10", "25", "50", "100") e a seguir o total ("N itens"); à direita, a navegação ‹ `página / total` ›. Usa `justify-content: space-between` com `flex-wrap`.
- **Mudar de página faz scroll instantâneo para o topo**, na `window` e no `main.content` do layout, porque qualquer um dos dois pode ser o elemento com scroll. Isto fica nos handlers `onContaPageChange`/`onCartaoPageChange` do componente da lista e não no `app-pagination` partilhado. Tem guarda para SSR (`isPlatformBrowser`). Mudar o tamanho de página não faz scroll.
- **A issue #50 fica fechada por esta change.** O plano (§7 do README) deixava-a aberta para os restantes GETs, mas o utilizador esclareceu que a intenção da issue era só paginar as transações. Paginar os outros GETs deixa de ser trabalho pendente; se um dia for preciso, a infra de `Pagination.ts` serve para isso.

Desvios encontrados durante a implementação:

- **Foram removidos 9 métodos do `TransacoesService` do frontend, não 8** — a contagem no README falhou o `getCartaoTransactionsByStatus`. Os 9: `getContaTransactions`, `getAllContaTransactions`, `getContaTransactionsByCategoria`, `getContaTransactionsByPeriod`, `getCartaoTransactions`, `getAllCartaoTransactions`, `getCartaoTransactionsByCategoria`, `getCartaoTransactionsByStatus`, `getCartaoTransactionsByPeriod`. Nenhum tinha outros consumidores (o build confirma).
- **Os filtros do service do frontend foram tipados** como `ContaTransactionsQuery` / `CartaoTransactionsQuery` (exportados de `transacoes.service.ts`). O plano não os nomeava.
- **`transacoes-listar.filter.ts` deixou de reexportar `filterByPeriod`**, que esta change deixou sem uso. A função continua em `shared/utils/period-filter.util.ts` e é usada pelas despesas recorrentes através do seu próprio ficheiro de filtros.
- **Os repos também ganharam um helper privado `toDomainList`** (entidade → domínio), usado pelos métodos novos e pelos existentes, incluindo `findAllByBanco`. Substitui três cópias do mesmo ciclo; o comportamento fica igual.
- **No `app-pagination`, a propriedade da classe chama-se `totalPagesInput`** (com o alias de template `totalPages`), porque o getter `totalPages` já existia. Por isso a story usa o arg `totalPagesInput`.

## 4. Por verificar

**Dados de teste já inseridos** na BD de dev local (contentor `poupame_postgres_local`, BD `poupame_dev_db`), para o admin (`USR00000000001`, banco `BNC00000000001`): 120 transações de conta (108 Saída, 12 Entrada, contas 1–3) e 60 de cartão (Crédito, cartão 2, metade dos últimos 30 dias como Pendente). Todas têm a descrição a começar por `[TESTE F0007]` e IDs que continuam a sequência `TRN-<ano>-N` de cada ano. Foram inseridas diretamente em SQL, por isso **não atualizam os saldos** das contas nem o saldo utilizado do cartão. Para as apagar: `docker exec poupame_postgres_local psql -U postgres -d poupame_dev_db -c "DELETE FROM transacao WHERE descricao LIKE '[TESTE F0007]%'"`. O contentor do backend foi reiniciado para correr o código novo.

Totais esperados, calculados em SQL com as mesmas condições do repo (admin, Santander, a 2026-11-08):

| Vista | Itens | Páginas de 25 |
| :--- | :---: | :---: |
| Conta / Este Mês (vista por omissão) | 50 | 2 |
| Conta / Último Ano | 125 | 5 |
| Conta / Qualquer período | 128 | 6 |
| Cartão / Este Mês | 30 | 2 |
| Cartão / Este Mês / Pendente | 15 | 1 |
| Cartão / Último Ano | 65 | 3 |

- **Testes manuais em browser — feitos pelo utilizador** sobre estes dados de teste, antes de abrir o PR #95. Assim a query paginada (`skip`/`take` + `getManyAndCount()`) e o fluxo da lista ficam validados contra a BD real. Os casos concretos que foram percorridos não ficaram registados nesta sessão. Da minha parte não fiz nenhum pedido autenticado à API: não há credenciais de seed, e não gerei tokens com o segredo do `.env`.
- **Cypress (`npm run test:ci`)** — não corrido; precisa do backend e do frontend a correr.
- **Outros clientes da API** — a resposta de `all-conta`/`all-cartao` deixou de ser um array. No repo não há mais nenhum consumidor; um cliente externo (script, Postman) parte.

## 5. Como correr a verificação

- `cd backend && npm run build && npm test` — compila e corre as 71 specs; `Pagination.spec.ts` prova os defaults, a validação de `page`/`pageSize` e o cálculo de `totalPages`.
- `cd backend && npm run lint` — deve continuar em 58 problemas, todos pré-existentes.
- `cd frontend && npm run build && npm test -- --watch=false --browsers=ChromeHeadless` — compila e corre as 15 specs; `transacoes.service.spec.ts` prova os query params enviados.
- **Manual com BD:** `docker compose up`, abrir `/api-docs` (com os dados de teste de §4) e chamar `GET /transacao/all-conta?bancoId=BNC00000000001&period=Este%20Mês`: sem `pageSize` tem de vir 25 itens e `totalItems: 50`; depois `page=2`, `pageSize=5` (tem de dar 400) e `page=0` (tem de dar 400). Na app, `/transacoes`: percorrer as páginas e trocar o tamanho nas duas colunas.

## 6. Inventário de alterações

- `backend/src/dto/shared/IPaginatedDTO.ts` — novo
- `backend/src/core/logic/Pagination.ts` — novo
- `backend/src/core/logic/tests/Pagination.spec.ts` — novo
- `backend/src/repos/Transacao/IRepos/ITransacaoContaQueryRepo.ts` — alterado
- `backend/src/repos/Transacao/TransacaoContaQueryRepo.ts` — alterado
- `backend/src/repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.ts` — alterado
- `backend/src/repos/Transacao/TransacaoCartaoQueryRepo.ts` — alterado
- `backend/src/services/Transacao/IServices/ITransacaoContaQueryService.ts` — alterado
- `backend/src/services/Transacao/TransacaoContaQueryService.ts` — alterado
- `backend/src/services/Transacao/IServices/ITransacaoCartaoQueryService.ts` — alterado
- `backend/src/services/Transacao/TransacaoCartaoQueryService.ts` — alterado
- `backend/src/controllers/Transacao/TransacaoContaQueryController.ts` — alterado
- `backend/src/controllers/Transacao/TransacaoCartaoQueryController.ts` — alterado
- `backend/src/api/routes/Transacao/TransacaoContaQueryRoute.ts` — alterado (Swagger + schema `PaginatedTransacao`)
- `backend/src/api/routes/Transacao/TransacaoCartaoQueryRoute.ts` — alterado (Swagger)
- `frontend/src/app/shared/dto/paginated.dto.ts` — novo
- `frontend/src/app/shared/components/pagination/pagination.component.ts` — alterado
- `frontend/src/app/shared/components/pagination/pagination.component.html` — alterado
- `frontend/src/styles/_components.css` — alterado (`.pagination` com `flex-wrap`, `.pagination-size`, `.pagination-total`)
- `frontend/src/stories/pagination.stories.ts` — alterado
- `frontend/src/app/features/transacoes/services/transacoes.service.ts` — alterado
- `frontend/src/app/features/transacoes/services/transacoes.service.spec.ts` — novo
- `frontend/src/app/features/transacoes/components/listar/transacoes-listar.view-model.ts` — alterado (reescrito)
- `frontend/src/app/features/transacoes/components/listar/transacoes-listar.component.ts` — alterado
- `frontend/src/app/features/transacoes/components/listar/transacoes-listar.component.html` — alterado
- `frontend/src/app/features/transacoes/components/listar/transacoes-listar.filter.ts` — alterado
- `docs/changes/features/F0007-paginacao-api-transacoes/README.md` — novo
- `docs/changes/features/F0007-paginacao-api-transacoes/RESULT.md` — novo
- `docs/changes/features/README.md` — alterado (linha da F0007)

## 7. Revisão do CodeRabbit (PR #95)

8 findings (6 inline + 2 nitpicks), todos verificados contra o código antes de corrigir.

| # | Finding | Verificação | Resolução |
| :--- | :--- | :--- | :--- |
| 1 | `page=1e308` dá offset `Infinity` e o endpoint responde 500 | Válido: `Number.isInteger(1e308)` é `true`, e `page=1e20` dá offset `2.5e+21` | `parsePagination` exige `Number.isSafeInteger(page)` e um offset `(page - 1) * pageSize` que seja inteiro seguro; senão 400. Testes para `1e308`, `1e20` e `4e14` com `pageSize=25` |
| 2 | Os mocks de `EstatisticasService.spec.ts` não têm os métodos novos do repo | **Confirmado:** `tsc` dava TS2322 nas linhas 45 e 49. O Jest passava porque o ts-jest compila com outro tsconfig | Mocks com `findContaTransactionsPage` e `findCartaoTransactionsPage`. Os 3 TS2532 que restam no ficheiro já existiam |
| 3 | Uma Entrada/Saída com conta **e** cartão conta para `totalItems`, mas o mapper descarta-a | Válido: o domínio rejeita-a (`Transacao.ts:105`). Na BD local há 0 linhas assim | `buildContaQuery` filtra `t.cartao_credito_id IS NULL`. As Estatísticas não mudam: essas linhas já eram descartadas pelo mapper |
| 4 | `period` não segue o mês civil e "Últimos 3 Meses" recua 4 meses | É o ponto que estava em aberto em §2 | Decisão do utilizador: manter a janela móvel e corrigir só o `-4` para `-3`, nos dois repos do PR e também no `TransacaoDespesasRecorrentesRepo` (lista de despesas recorrentes), que tinha o mesmo bug |
| 5 | Com total 0 na página 3, a barra mostra `3 / 1` | Válido, mas só se as transações forem apagadas noutro sítio | Se `page > max(totalPages, 1)`, o view-model recarrega a página `max(totalPages, 1)` |
| 6 | O seletor de itens por página não tem nome acessível | Válido: o `app-select` não tinha `aria-label` | Novo `@Input() ariaLabel` no `app-select`, que anuncia "<nome>: <valor>"; o `app-pagination` passa "Itens por página" |
| N1 | O teste de `parsePagination` só cobre `pageSize=25` | Válido | `it.each([10, 25, 50, 100])` |
| N2 | O teste de cartão do service não verifica `bancoId` nem `categoriaId` | Válido | Mais duas asserções |

**Gate depois da revisão:**
- **Backend:** build OK, testes 77/77, lint igual ao baseline (58).
- **Frontend:** build OK, testes 15/15.
- **Por fazer:** não foi feito novo teste manual em browser depois destas correções. O `aria-label` também não foi testado com um leitor de ecrã real.

**Ficheiros alterados na revisão:**
- `backend/src/core/logic/Pagination.ts`
- `backend/src/core/logic/tests/Pagination.spec.ts`
- `backend/src/services/Estatisticas/tests/EstatisticasService.spec.ts`
- `backend/src/repos/Transacao/TransacaoContaQueryRepo.ts`
- `backend/src/repos/Transacao/TransacaoCartaoQueryRepo.ts`
- `backend/src/repos/Transacao/TransacaoDespesasRecorrentesRepo.ts`
- `frontend/src/app/features/transacoes/components/listar/transacoes-listar.view-model.ts`
- `frontend/src/app/shared/components/select/select.component.ts`
- `frontend/src/app/shared/components/select/select.component.html`
- `frontend/src/app/shared/components/pagination/pagination.component.html`
- `frontend/src/app/features/transacoes/services/transacoes.service.spec.ts`
- este `RESULT.md` e o índice
