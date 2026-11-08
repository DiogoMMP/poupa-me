# F0007 — Paginação no servidor para as listas de transações de contas e de cartões

| | |
| :--- | :--- |
| **Tipo** | Feature — parte da [issue #50](https://github.com/DiogoMMP/poupa-me/issues/50) "[Feat] Adição de Paginação a todos os gets" (pedida como "issue 55"; a #55 é "[Fix] Sidebar", já fechada) |
| **Branch** | `feature/paginacao-api-transacoes` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | Backend: infra de paginação partilhada + paginação em `GET /transacao/all-conta` e `GET /transacao/all-cartao`. Frontend: a lista de transações deixa de paginar em memória e passa a pedir cada página à API, com seletor de tamanho de página (10/25/50/100) |
| **Verificação** | `backend`: `npm run build`, `npm run lint`, `npm test` (+ spec nova da paginação). `frontend`: `npm run build`, `npm test` (+ spec nova do service). Teste manual em browser não disponível nesta sessão |

## 1. Situação

Hoje os dois endpoints de listagem de transações devolvem **todas** as transações que batem com os filtros, e o frontend corta-as em páginas de 10 no browser.

**Evidência:**

- [`backend/src/repos/Transacao/TransacaoContaQueryRepo.ts`](../../../../backend/src/repos/Transacao/TransacaoContaQueryRepo.ts) `findAllContaTransactions` — `qb...getMany()` sem `skip`/`take`; o mesmo em [`TransacaoCartaoQueryRepo.ts`](../../../../backend/src/repos/Transacao/TransacaoCartaoQueryRepo.ts) `findAllCartaoTransactions`. Ambos já suportam **todos os filtros combinados** no SQL (`bancoId`, `contaId`/`cartaoCreditoId`, `categoriaId`, `status`, `period`).
- [`TransacaoContaQueryController.ts`](../../../../backend/src/controllers/Transacao/TransacaoContaQueryController.ts) / [`TransacaoCartaoQueryController.ts`](../../../../backend/src/controllers/Transacao/TransacaoCartaoQueryController.ts) devolvem `200` com um array `ITransacaoDTO[]`.
- [`EstatisticasService.ts:32-33`](../../../../backend/src/services/Estatisticas/EstatisticasService.ts) chama os mesmos métodos de repo e **precisa de todas as linhas** para calcular totais — não podem passar a ser paginados.
- [`transacoes-listar.component.ts`](../../../../frontend/src/app/features/transacoes/components/listar/transacoes-listar.component.ts) — `const PAGE_SIZE = 10`, `paginate(items, page)` com `items.slice(...)`; o template passa `[totalItems]="all.length"` ao `app-pagination`.
- [`transacoes-listar.view-model.ts`](../../../../frontend/src/app/features/transacoes/components/listar/transacoes-listar.view-model.ts) — 5 ramos por coluna (conta: 4, cartão: 5) que escolhem um endpoint consoante o filtro ativo e depois aplicam o resto dos filtros **em memória** (`all.filter(...)`, `filterByPeriod(...)`), apesar de o backend já os suportar combinados.
- [`transacoes.service.ts`](../../../../frontend/src/app/features/transacoes/services/transacoes.service.ts) — 8 métodos que chamam `/all-conta` e `/all-cartao` com um único filtro cada (`getContaTransactions`, `getAllContaTransactions`, `getContaTransactionsByCategoria`, `getContaTransactionsByPeriod` e os 4 equivalentes de cartão). Usados **só** pela lista de transações (confirmado por grep).
- [`pagination.component.ts`](../../../../frontend/src/app/shared/components/pagination/pagination.component.ts) — só anterior/seguinte e "`página / total`", calcula `totalPages` a partir de `totalItems`/`pageSize`; esconde-se com `totalPages <= 1`. Documentado em [`pagination.stories.ts`](../../../../frontend/src/stories/pagination.stories.ts).

**Inventário:**

- **A. Infra de paginação partilhada (backend)** — tipo de resposta `IPaginatedDTO<T>`, parsing/validação de `page`/`pageSize` a partir da query e construção da resposta.
- **B. `GET /transacao/all-conta` paginado** — repo, service, controller, Swagger.
- **C. `GET /transacao/all-cartao` paginado** — repo, service, controller, Swagger.
- **D. `app-pagination` com seletor de tamanho de página** — componente partilhado + story.
- **E. Lista de transações usa a paginação da API** — DTO, service, view-model, componente e template.
- **F. Testes** — spec da infra de paginação (backend) e spec do `TransacoesService` (frontend).

**Escala:** 2 endpoints, 1 componente partilhado, 1 ecrã (2 colunas), 8 métodos de service do frontend substituídos por 2.

## 2. Resultado pretendido

`GET /api/transacao/all-conta?bancoId=…&categoriaId=…&period=…&page=2&pageSize=25` devolve:

```json
{
  "items": [ /* ITransacaoDTO, no máximo pageSize */ ],
  "page": 2,
  "pageSize": 25,
  "totalPages": 4,
  "totalItems": 87
}
```

O mesmo para `all-cartao`. A paginação é feita no SQL (`OFFSET`/`LIMIT` + `COUNT` na mesma query). Na lista de transações, cada coluna tem o seu próprio estado de página e tamanho de página; mudar de página, de tamanho ou de filtro faz um novo pedido à API com **todos** os filtros enviados juntos, sem nenhum filtro aplicado em memória.

**Decisões:**

- **Âmbito: só as duas listas de transações** (decisão do utilizador: "é o que cresce mais"). Os restantes GETs da issue #50 ficam fora (§7); a infra A fica pronta para eles.
- **Query params `page` (1-based) e `pageSize`.** Omitidos → `page=1`, `pageSize=10`. `pageSize` só aceita `10`, `25`, `50`, `100`; `page` tem de ser inteiro `>= 1`. Valor inválido → `400` com mensagem de erro, no mesmo estilo da validação de `period` já existente.
- **Resposta `{ items, page, pageSize, totalPages, totalItems }`**, campos em inglês como os restantes nomes técnicos da API (`bancoId`, `period`…). `totalItems` incluído (decisão do utilizador) — vem do mesmo `COUNT`.
- **`totalPages` é `0` quando não há itens**; `page` devolvido é o pedido. Pedir uma página para lá do fim devolve `items: []` (não é erro) — o frontend corrige para a última página (ver abaixo).
- **Estes dois endpoints passam a ser sempre paginados** (mudança de formato da resposta, *breaking*). O único consumidor é a lista de transações do próprio frontend, alterada nesta mesma change.
- **O repo ganha métodos novos `findContaTransactionsPage` / `findCartaoTransactionsPage`** que devolvem `{ items, total }`; os `findAll*` atuais ficam com a mesma assinatura para o `EstatisticasService`. A construção do `QueryBuilder` com filtros é extraída para um método privado partilhado pelos dois, para não duplicar a lógica de filtros.
- **Paginação via `skip`/`take` + `getManyAndCount()`** do TypeORM, a forma suportada com `leftJoinAndSelect`; a ordenação existente (`ano`, `mes`, `dia`, `id` DESC) mantém-se e é determinística (o `id` desempata), o que evita itens repetidos/saltados entre páginas.
- **Frontend: um único método por coluna** — `TransacoesService.getContaTransactionsPage(filtros, page, pageSize)` e `getCartaoTransactionsPage(...)`, que só põem na query os filtros preenchidos. Os 8 métodos antigos de `/all-conta`/`/all-cartao` são removidos (sem outros consumidores). Os métodos de `/despesa-recorrente` e `/all-banco` ficam intactos.
- **O view-model deixa de ter ramos por filtro**: cada coluna faz um único pedido com todos os filtros e guarda a resposta paginada (`items`, `page`, `pageSize`, `totalPages`, `totalItems`) num `BehaviorSubject`. Se a resposta vier vazia com `page > totalPages > 0` (p.ex. depois de apagar o último item da última página), recarrega a última página.
- **Apagar uma transação recarrega a página atual da coluna afetada** em vez de a remover só localmente, para a página voltar a ter `pageSize` itens e os totais baterem certo.
- **Aplicar/limpar filtros e mudar o tamanho de página voltam à página 1.**
- **`app-pagination` ganha seletor de tamanho de página**: novo `@Input() pageSizeOptions` (por omissão `[10, 25, 50, 100]`) e `@Output() pageSizeChanged`; usa o `app-select` partilhado (F0004). Mostra "`página / total de páginas`" (como hoje) e o total de itens. A barra só aparece quando `totalItems` é maior que o menor tamanho de página, para listas pequenas ficarem como hoje. A API atual (`currentPage`, `totalItems`, `pageSize`, `pageChanged`) mantém-se compatível; `totalPages` passa a poder vir de fora (`@Input() totalPages`, opcional) e, se não vier, continua a ser calculado.
- **O tipo `PaginatedDTO<T>` do frontend fica em `shared/dto/paginated.dto.ts`**, por ser genérico e reutilizável pelos outros GETs no futuro.

**Alternativas rejeitadas:**

- **Paginação opt-in (só quando vêm `page`/`pageSize`)** — manteria dois formatos de resposta no mesmo endpoint sem nenhum consumidor que precise do array completo; só faz sentido para os GETs que alimentam selects, que estão fora de âmbito.
- **Paginar no service (cortar o array em memória no backend)** — continuaria a ler e mapear todas as linhas da BD a cada pedido; não resolve o crescimento.
- **Cursor/keyset pagination** — melhor para listas enormes, mas não dá "número de páginas" nem salto para uma página, que foram pedidos.
- **Manter os 8 métodos do service frontend e acrescentar `page`/`pageSize` a cada um** — mantém a lógica de ramos e os filtros em memória, que com paginação no servidor dariam resultados errados (filtrar em memória uma página só esconde itens e quebra os totais).

## 3. Implementação

1. **Infra de paginação (backend, A)**
   - novo `backend/src/dto/shared/IPaginatedDTO.ts` — `IPaginatedDTO<T>` e `IPaginationParams { page; pageSize }`.
   - novo `backend/src/core/logic/Pagination.ts` — `PAGE_SIZE_OPTIONS`, `DEFAULT_PAGE_SIZE`, `parsePagination(query): Result<IPaginationParams>` e `toPaginated(items, totalItems, params): IPaginatedDTO<T>`.
2. **Conta (backend, B)** — `ITransacaoContaQueryRepo` + `TransacaoContaQueryRepo` (método privado `buildContaQuery(filters)` partilhado; novo `findContaTransactionsPage(filters, pagination)`); `ITransacaoContaQueryService` + `TransacaoContaQueryService.findAllContaTransactions(filters, pagination)` passa a devolver `Result<IPaginatedDTO<ITransacaoDTO>>`; `TransacaoContaQueryController.getAllContaTransactions` faz `parsePagination(req.query)` (400 se falhar); Swagger em `TransacaoContaQueryRoute.ts` com os params `page`/`pageSize` e o schema da resposta.
3. **Cartão (backend, C)** — o mesmo para `ITransacaoCartaoQueryRepo`, `TransacaoCartaoQueryRepo` (`buildCartaoQuery`, `findCartaoTransactionsPage`), `ITransacaoCartaoQueryService`, `TransacaoCartaoQueryService`, `TransacaoCartaoQueryController`, `TransacaoCartaoQueryRoute.ts`.
4. **Teste backend (F)** — novo `backend/src/core/logic/tests/Pagination.spec.ts`: defaults, `pageSize` fora da lista → falha, `page` inválido → falha, cálculo de `totalPages` (incluindo `0` itens).
5. **`app-pagination` (frontend, D)** — `pagination.component.{ts,html}`: `pageSizeOptions`, `pageSizeChanged`, `totalPages` opcional, total de itens; estilos do seletor em `frontend/src/styles/_components.css` junto a `.pagination`; story nova `WithPageSizeSelector` em `pagination.stories.ts`.
6. **Lista de transações (frontend, E)**
   - novo `frontend/src/app/shared/dto/paginated.dto.ts`.
   - `transacoes.service.ts`: `getContaTransactionsPage` / `getCartaoTransactionsPage` substituem os 8 métodos antigos.
   - `transacoes-listar.view-model.ts`: um pedido por coluna, estado `page`/`pageSize` por coluna, `BehaviorSubject<PaginatedModel>` por coluna, delete recarrega a página.
   - `transacoes-listar.component.{ts,html}`: remove `PAGE_SIZE`, `paginate()`, `totalPages()`; liga o `app-pagination` ao estado do view-model.
7. **Teste frontend (F)** — novo `frontend/src/app/features/transacoes/services/transacoes.service.spec.ts`, no estilo de `bancos.service.spec.ts`: confirma os query params enviados (`page`, `pageSize`, só os filtros preenchidos).

## 4. Verificação

- `cd backend && npm run build && npm run lint && npm test` — baseline medido antes de qualquer alteração (registado em `RESULT.md`); passa se não houver erros novos e a spec nova passar.
- `cd frontend && npm run build && npm test -- --watch=false --browsers=ChromeHeadless` — baseline idem; passa se a build não tiver erros e a spec nova passar.
- `grep -rn "paginate(\|PAGE_SIZE" frontend/src/app/features/transacoes` → zero resultados.
- **Não verificável nesta sessão (sem Postgres/browser):** query paginada real contra a BD (contagem com os `JOIN`s, ordem estável entre páginas), e o fluxo no browser (trocar página/tamanho/filtros, apagar o último item de uma página). Ficará em `RESULT.md` §4 com os passos para correr.

## 5. Riscos

- **A semântica de `period` passa a ser sempre a do backend.** Hoje, nos ramos combinados (p.ex. conta + período), o frontend aplica `filterByPeriod` (mês civil: "Este Mês" = mês corrente) enquanto o backend usa uma janela móvel ("Este Mês" = desde a mesma data do mês anterior; "Últimos 3 Meses" = `mês - 4`). O caso por omissão (só período "Este Mês") **já usa hoje a semântica do backend**, por isso a vista inicial não muda; só os filtros combinados podem passar a mostrar mais itens. **Validação:** registado em `RESULT.md` §2 como decisão em aberto (corrigir a janela do backend é outra change); comparar manualmente a contagem com e sem filtro de conta.
- **`skip`/`take` com `leftJoinAndSelect` devolver contagem ou páginas erradas.** As relações são todas *many-to-one* (`categoria`, `conta`, `cartaoCredito`), por isso não há multiplicação de linhas. **Validação:** teste manual com BD (§4) — somar os itens de todas as páginas = `totalItems`, sem repetidos.
- **Partir o `EstatisticasService`** ao mexer nos repos. **Validação:** os `findAll*` mantêm assinatura e comportamento (só o `QueryBuilder` é extraído); `EstatisticasService.spec.ts` continua a passar.
- **Ficar algum consumidor dos 8 métodos removidos do frontend ou do array antigo.** **Validação:** `npm run build` do frontend (erro de compilação se algum ficar) e grep por `all-conta`/`all-cartao` no frontend.
- **Pedidos concorrentes fora de ordem** (mudar de página depressa). **Validação:** cada coluna faz `unsubscribe` do pedido anterior antes de lançar o novo, como o view-model já faz hoje (`contaSub`/`cartaoSub`).

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Infra de paginação + spec | `backend/src/dto/shared/IPaginatedDTO.ts`, `backend/src/core/logic/Pagination.ts`, `backend/src/core/logic/tests/Pagination.spec.ts` | A, F |
| 2 | `all-conta` paginado | `ITransacaoContaQueryRepo`, `TransacaoContaQueryRepo`, `ITransacaoContaQueryService`, `TransacaoContaQueryService`, `TransacaoContaQueryController`, `TransacaoContaQueryRoute.ts` | B |
| 3 | `all-cartao` paginado | `ITransacaoCartaoQueryRepo`, `TransacaoCartaoQueryRepo`, `ITransacaoCartaoQueryService`, `TransacaoCartaoQueryService`, `TransacaoCartaoQueryController`, `TransacaoCartaoQueryRoute.ts` | C |
| 4 | `app-pagination` com seletor de tamanho | `pagination.component.{ts,html}`, `_components.css`, `pagination.stories.ts` | D |
| 5 | Lista de transações usa a API + spec | `shared/dto/paginated.dto.ts`, `transacoes.service.ts`, `transacoes.service.spec.ts`, `transacoes-listar.view-model.ts`, `transacoes-listar.component.{ts,html}` | E, F |

Os commits 2–3 mudam o formato da resposta e o 5 adapta o frontend: entre o 3 e o 5 a lista de transações fica partida, por isso devem ir no mesmo PR.

## 7. Fora de âmbito / handoff

- **Paginação dos restantes GETs da issue #50** (bancos, contas, cartões, categorias, despesas recorrentes, users, `/transacao/despesa-recorrente`) — fica para uma change seguinte, reaproveitando `Pagination.ts`/`IPaginatedDTO`; vários alimentam selects e precisarão de paginação opt-in. A issue #50 fica aberta.
- **Corrigir as janelas de `period` do backend** para mês civil (ver §5) — outra change.
- **Persistir página/tamanho de página entre navegações** — relacionado com a [issue #61](https://github.com/DiogoMMP/poupa-me/issues/61) "Filtros devem persistir entre páginas".
- **Botões numerados de página** — mantém-se "anterior / `página / total` / seguinte".
