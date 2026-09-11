# B0002 — Cards de Admin mostram nome (id) em vez do id em bruto

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/dashboard-banco-endpoint-404` (base: `develop`) — partilhada com o B0001 por decisão do utilizador; o slug deste registo não corresponde ao nome do branch |
| **Estado** | Planeado |
| **Âmbito** | 3 features do frontend (`Contas`, `CartõesCrédito`, `Bancos`): DTOs, models, mappers, 3 templates de listagem; 1 tipo e 1 util novos partilhados |
| **Verificação** | `npm test` (frontend, Karma/Jasmine) + `npm run build` (frontend) |

## 1. Situação

Nas secções só-visíveis-para-Admin dos cards de listagem de Contas, Cartões de Crédito e Bancos,
aparece atualmente o id em bruto do utilizador dono (e, para Contas/Cartões, também o id do banco),
sem nome nenhum ao lado.

**Evidência:**

- [`frontend/src/app/features/contas/components/listar/contas-listar.component.html:46-50`](../../../../frontend/src/app/features/contas/components/listar/contas-listar.component.html)
  — `<small><b>User ID:</b> {{ conta.userId }}</small>` e `<small><b>Banco:</b> {{ conta.bancoId }}</small>`.
- [`frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.component.html:62-66`](../../../../frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.component.html)
  — mesmo padrão: `cartao.userId` e `cartao.bancoId`.
- [`frontend/src/app/features/bancos/components/listar/bancos-listar.component.html:60-63`](../../../../frontend/src/app/features/bancos/components/listar/bancos-listar.component.html)
  — só `banco.userId` (o próprio banco já é a entidade, não precisa de "Banco:" próprio).

**Causa raiz (não é só uma questão de UI):** o backend já foi refatorado (commit `f3060fa`,
"DTOs passam a usar referências de entidade em vez de IDs soltos") para devolver `user: { id, nome }`
e `banco: { id, nome }` em vez de `userId`/`bancoId` soltos, e já resolve o nome do lado do servidor:

- [`backend/src/mappers/ContaMap.ts:97-110`](../../../../backend/src/mappers/ContaMap.ts),
  [`backend/src/mappers/CartaoCreditoMap.ts:144-186`](../../../../backend/src/mappers/CartaoCreditoMap.ts) e
  [`backend/src/mappers/BancoMap.ts:95-102`](../../../../backend/src/mappers/BancoMap.ts) — todos os
  `toDTO`/`toSummaryDTO` recebem `userNome` já resolvido e devolvem `user: { id, nome }` (e `banco: { id, nome }`
  para Conta/Cartão).
- [`backend/src/services/Banco/BancoService.ts:209-228`](../../../../backend/src/services/Banco/BancoService.ts),
  o serviço equivalente de `Conta` e `CartaoCredito` (linhas confirmadas por leitura de
  `findAllContas`/`findAllCartoes`) — todos constroem uma cache `userId → nome` e passam-na ao mapper,
  para o `GET` de listagem incluído.
- O frontend nunca foi atualizado para este novo formato: `ContasDto`/`CartoesCreditoDTO`/`BancosDTO`
  continuam a declarar `userId?: string`/`bancoId?: string` soltos
  ([`frontend/src/app/features/contas/dto/contas.dto.ts:4-14`](../../../../frontend/src/app/features/contas/dto/contas.dto.ts),
  equivalentes em `cartoes-credito.dto.ts` e `bancos.dto.ts`), campos que **já não existem** na
  resposta real da API — hoje, em `develop`, estas secções de Admin mostram na prática um valor vazio,
  não o id.
- **Precedente já correto no mesmo repositório:** `frontend/src/app/features/transacoes/dto/transacoes.dto.ts:37-42`
  e [`mappers/transacoes.mapper.ts:25-30`](../../../../frontend/src/app/features/transacoes/mappers/transacoes.mapper.ts)
  já foram migrados para este novo formato (`conta?: EntityReferenceProps`, `user?: EntityReferenceProps`),
  na sequência do mesmo refactor de DTOs — este bugfix aplica o mesmo tratamento, ainda em falta, às
  outras três features.

**Inventário (superfícies afetadas):**

- **A.** `Contas` — `ContasDto`/`ContasModel`/`ContasMapper` + `contas-listar.component.html`/`.ts`.
- **B.** `CartõesCrédito` — `CartoesCreditoDTO`/`CartoesCreditoModel`/`CartoesCreditoMapper` +
  `cartoes-credito-listar.component.html` + `cartoes-credito-listar.view-model.ts`.
- **C.** `Bancos` — `BancosDTO`/`BancosModel`/`BancosMapper` + `bancos-listar.component.html` +
  `bancos-listar.view-model.ts`.
- **D.** Tipo e util novos, partilhados pelas três: `EntityReference` e `formatEntityReference`.

**Escala:** 3 features, 17 ficheiros de produção alterados/criados, 0 chamadas extra à API
necessárias (o nome já vem no payload existente).

## 2. Resultado pretendido

As três secções de Admin passam a mostrar `Nome (id)` (ex.: `Diogo Silva (USR00000000001)`),
lendo o nome já devolvido pelo backend — sem nenhum pedido adicional ao servidor. Se o nome não
vier resolvido (edge case do backend), mostra-se apenas o id, nunca um valor em branco.

**Decisões:**

- **Um único tipo partilhado `EntityReference { id, nome?, descricao?, icon? }`**, novo em
  `frontend/src/app/shared/models/entity-reference.model.ts`, usado tanto para o campo do DTO como
  para o do Model (mesma forma, sem necessidade de duplicar como `...Props`/`...Model`).
  **Alternativa rejeitada:** replicar o padrão de `transacoes.dto.ts`/`transacoes.model.ts`, que
  define `EntityReferenceProps` (DTO) e `EntityReferenceModel` (Model) como duas interfaces
  idênticas separadas — rejeitado por ser a mesma duplicação que este bugfix está a tentar não
  espalhar por mais duas features. `transacoes` não é tocado por este bugfix (ver §7).
- **Um util partilhado `formatEntityReference(ref?: EntityReference): string`**, novo em
  `frontend/src/app/shared/utils/entity-reference.util.ts`, devolve `"Nome (id)"` quando há nome,
  ou só o `id` quando não há, ou `"-"` quando a referência é `undefined` — mesma convenção de
  fallback já usada em `cartoes-credito-listar.view-model.ts` (`getContaNome`) e em
  `bancos-listar.component.html` (`noDetalhe`).
- **`bancoId`/`userId` são substituídos, não mantidos em paralelo**, nos três Models/DTOs afetados.
  Confirmado por grep em todo o `frontend/src/app` que estes campos, nestas três features, só são
  lidos nestes três templates de listagem — não há lógica de negócio (criação, edição, filtros) que
  dependa deles; os fluxos de criar/editar constroem os seus próprios `*InputDTO`/`*UpdateDTO`
  diretamente, sem passar pelo Model.
- **Etiqueta "User ID" passa a "Utilizador"** nos três templates, já que deixa de mostrar só um id.
  "Banco" mantém-se (já não tinha "ID" no texto).

**Alternativas rejeitadas:**

- *Resolver os nomes no cliente*, com um novo pedido a `UtilizadoresService.getAll()`/
  `BancosService.getAll()` e um `Map` local (como já existe para `contaPagamento` em
  `cartoes-credito-listar.view-model.ts`). Rejeitada: o nome já vem resolvido no payload atual — pedir
  de novo seria puro desperdício de pedidos e reintroduziria o mesmo tipo de dessincronização
  frontend/backend que causou este bug.

## 3. Implementação

1. **Tipo e util partilhados (habilitador, primeiro)**
   - `frontend/src/app/shared/models/entity-reference.model.ts` (novo) — `EntityReference`.
   - `frontend/src/app/shared/utils/entity-reference.util.ts` (novo) — `formatEntityReference`.
   - `frontend/src/app/shared/utils/entity-reference.util.spec.ts` (novo) — casos: com nome, sem
     nome (só id), referência `undefined` (`"-"`).

2. **Contas**
   - `frontend/src/app/features/contas/dto/contas.dto.ts` — `ContasDto.userId?: string` →
     `user?: EntityReference`; `ContasDto.bancoId: string` → `banco?: EntityReference`.
   - `frontend/src/app/features/contas/models/contas.model.ts` — mesma alteração em `ContasModel`.
   - `frontend/src/app/features/contas/mappers/contas.mapper.ts` — `toModel` passa `dto.user`/
     `dto.banco` diretamente; `toDto` deixa de mapear os campos removidos (função já não é chamada
     em nenhum lado — confirmado por grep — mas mantém-se coerente com os novos tipos).
   - `frontend/src/app/features/contas/mappers/contas.mapper.spec.ts` (novo) — `toModel` com um DTO
     no formato atual da API (`user`/`banco` como objeto) produz um Model com esses campos; falha
     contra o mapper antigo (que leria `dto.userId`/`dto.bancoId`, sempre `undefined` no formato
     atual da API).
   - `frontend/src/app/features/contas/components/listar/contas-listar.component.ts` — importa
     `formatEntityReference` e expõe-o como propriedade pública para o template.
   - `frontend/src/app/features/contas/components/listar/contas-listar.component.html:48-49` —
     `{{ formatEntityReference(conta.user) }}` / `{{ formatEntityReference(conta.banco) }}`;
     etiqueta "User ID:" → "Utilizador:".

3. **Cartões de Crédito** (mesmo padrão que 2, adaptado aos nomes dos ficheiros desta feature)
   - `dto/cartoes-credito.dto.ts`, `models/cartoes-credito.model.ts`,
     `mappers/cartoes-credito.mapper.ts` — mesma troca de `userId`/`bancoId` por
     `user`/`banco: EntityReference`. `contaPagamentoId` **não é tocado** (já resolvido por outro
     mecanismo, fora de âmbito).
   - `mappers/cartoes-credito.mapper.spec.ts` (novo) — mesmo tipo de caso do ponto 2.
   - `components/listar/cartoes-credito-listar.view-model.ts` — expõe `formatEntityReference`
     (o template já chama tudo via `vm.`, ao contrário de Contas).
   - `components/listar/cartoes-credito-listar.component.html:64-65` —
     `{{ vm.formatEntityReference(cartao.user) }}` / `{{ vm.formatEntityReference(cartao.banco) }}`;
     etiqueta "User ID:" → "Utilizador:".

4. **Bancos** (só o utilizador dono; não há "banco do banco")
   - `dto/bancos.dto.ts`, `models/bancos.model.ts`, `mappers/bancos.mapper.ts` — `userId` →
     `user: EntityReference`.
   - `mappers/bancos.mapper.spec.ts` (novo) — mesmo tipo de caso do ponto 2.
   - `components/listar/bancos-listar.view-model.ts` — expõe `formatEntityReference`.
   - `components/listar/bancos-listar.component.html:62` —
     `{{ vm.formatEntityReference(banco.user) }}`; etiqueta "User ID:" → "Utilizador:".

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros/warnings pré-existente a esta data.
- `cd frontend && npm test` — **nota herdada do B0001**: `karma`/`karma-jasmine`/
  `karma-chrome-launcher`/`karma-jasmine-html-reporter`/`karma-coverage`/`jasmine-core`/
  `@types/jasmine` não constam em `package.json` apesar de serem exigidos por `karma.conf.js`/
  `angular.json`; `npm test` falha de imediato num checkout limpo com `Cannot find module 'karma'`.
  Estes 4 specs novos serão corridos com as mesmas dependências instaladas localmente
  (`--no-save`, mesmas versões documentadas no `RESULT.md` do B0001), até essa lacuna de
  infraestrutura ser corrigida à parte (fora de âmbito — ver §7).
- Verificação manual: com o backend a correr localmente e sessão de Admin, abrir `/contas`,
  `/cartoes-credito` e `/bancos` e confirmar que a secção de Admin mostra `Nome (id)` para cada
  card (não automatizável nesta sessão — ver `RESULT.md` §4).

## 5. Riscos

- **Risco:** algum outro consumidor depender do campo `userId`/`bancoId` solto nestes três Models
  para lógica real (não só apresentação), e a remoção partir algo silenciosamente.
  **Mitigação:** grep a todo o `frontend/src/app` confirmou que, para estas três features, estes
  campos só são lidos nos três templates de listagem alterados aqui; os ecrãs de criar/editar
  constroem os seus próprios DTOs de input e não leem estes campos do Model carregado.
- **Risco:** o backend não devolver `user.nome`/`banco.nome` para algum registo antigo (ex.:
  utilizador entretanto apagado). **Mitigação:** `formatEntityReference` cai para mostrar só o id
  nesse caso — nunca mostra um valor vazio nem parte a renderização.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Tipo e util partilhados + teste | `entity-reference.model.ts` (novo), `entity-reference.util.ts` (novo), `entity-reference.util.spec.ts` (novo) | D |
| 2 | Contas: DTO/Model/Mapper + template + teste | `contas.dto.ts`, `contas.model.ts`, `contas.mapper.ts`, `contas.mapper.spec.ts` (novo), `contas-listar.component.ts`, `contas-listar.component.html` | A |
| 3 | Cartões de Crédito: DTO/Model/Mapper + template + teste | `cartoes-credito.dto.ts`, `cartoes-credito.model.ts`, `cartoes-credito.mapper.ts`, `cartoes-credito.mapper.spec.ts` (novo), `cartoes-credito-listar.view-model.ts`, `cartoes-credito-listar.component.html` | B |
| 4 | Bancos: DTO/Model/Mapper + template + teste | `bancos.dto.ts`, `bancos.model.ts`, `bancos.mapper.ts`, `bancos.mapper.spec.ts` (novo), `bancos-listar.view-model.ts`, `bancos-listar.component.html` | C |

## 7. Fora de âmbito / handoff

- **Consolidar `transacoes.dto.ts`/`transacoes.model.ts`** para usarem o novo `EntityReference`
  partilhado em vez da sua própria `EntityReferenceProps`/`EntityReferenceModel` duplicada — seria
  uma limpeza cosmética à parte, sem comportamento novo; não é necessária para fechar este bug.
- **Corrigir `package.json` do frontend** para incluir as dependências de Karma/Jasmine em falta,
  já identificado como gap pré-existente no `RESULT.md` do B0001 — decisão do utilizador, ainda por
  tratar.
- **Cartão de pagamento (`contaPagamentoId`) em `cartoes-credito`** já é resolvido por um mecanismo
  próprio (`contasNamesMap`/`getContaNome`) não relacionado com este bug — não tocado.
