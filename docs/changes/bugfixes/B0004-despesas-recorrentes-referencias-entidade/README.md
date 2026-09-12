# B0004 — DespesaRecorrente por atualizar para as referências de entidade do backend

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/despesas-recorrentes-referencias-entidade` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | 1 feature do frontend (`DespesaRecorrente`): DTO, mapper, 1 view-model; 1 teste novo |
| **Verificação** | `npm test` (frontend, Karma/Jasmine) + `npm run build` (frontend) |

> Registado originalmente como B0001 nesta branch (criada antes de `fix/dashboard-banco-endpoint-404`
> ter mergeado B0001-B0003 em `develop`). Renumerado para B0004 ao trazer `develop` atualizada para
> esta branch, para não colidir com os números já usados — mesmo tipo de colisão já visto antes
> entre estas duas branches, resolvida da mesma forma.

## 1. Situação

A mesma refatoração de backend que motivou o B0002 (commit `f3060fa`, issues #39/#60: DTOs passam
a usar referências de entidade em vez de IDs soltos) também mudou `IDespesaRecorrenteDTO` — mas,
ao contrário de Contas/Cartões/Bancos, o frontend de `DespesaRecorrente` nunca foi atualizado. Isto
é a última peça em falta para fechar a issue #60 ("as respostas do Backend devem vir prontas para
o frontend, sem ids").

**Evidência:**

- [`backend/src/dto/IDespesaRecorrenteDTO.ts:9-26`](../../../../backend/src/dto/IDespesaRecorrenteDTO.ts)
  — `IDespesaRecorrenteDTO` já devolve `user?: IEntityReferenceDTO`, `categoria: ICategoriaDTO`,
  `contaOrigem: IEntityReferenceDTO`, `contaDestino?/contaPoupanca?: IEntityReferenceDTO` — nunca
  ids soltos.
- [`frontend/src/app/features/despesas-recorrentes/dto/despesas-recorrentes.dto.ts:16-33`](../../../../frontend/src/app/features/despesas-recorrentes/dto/despesas-recorrentes.dto.ts)
  — `DespesaRecorrenteDTO` (a interface que consome a resposta) continua a declarar
  `categoriaId`/`contaOrigemId`/`contaDestinoId`/`contaPoupancaId`/`userId` como strings soltas —
  campos que já não existem na resposta real da API.
- **O sítio onde isto parte de facto**, confirmado por leitura direta do fluxo, não por suposição:
  [`despesas-recorrentes-editar-regra.view-model.ts:25`](../../../../frontend/src/app/features/despesas-recorrentes/components/editar-regra/despesas-recorrentes-editar-regra.view-model.ts)
  guarda o `DespesaRecorrenteDTO` **em bruto** em `regra$` (`this.service.getById(id)` sem passar
  pelo mapper), e
  [`despesas-recorrentes-editar-regra.component.ts:96-99`](../../../../frontend/src/app/features/despesas-recorrentes/components/editar-regra/despesas-recorrentes-editar-regra.component.ts)
  lê `regra.categoriaId`/`regra.contaOrigemId`/`regra.contaDestinoId`/`regra.contaPoupancaId`
  diretamente do DTO para pré-preencher o formulário de edição — todos `undefined` hoje. Como estes
  4 campos do formulário têm `Validators.required` (exceto `contaPoupancaId`), abrir "editar regra"
  de uma regra existente traz Categoria/Conta Origem/Conta Destino todos por preencher, obrigando o
  utilizador a escolhê-los de novo só para conseguir guardar qualquer outra alteração.
- **Confirmado por leitura completa, não é um achado ao acaso**: os restantes consumidores de
  `DespesaRecorrenteModel` (`listar-regras`, e as listas "sem valor" em `listar`) **não mostram**
  categoria/conta em lado nenhum hoje — só o filtro de categoria em `despesas-recorrentes-listar.view-model.ts`
  usa um campo chamado `categoriaId`, mas é o valor escolhido num `<select>` alimentado por
  `CategoriasService.getAll()`, sem relação com `DespesaRecorrenteDTO` — não é afetado por este bug.

**Inventário (superfícies afetadas):**

- **A.** `DespesaRecorrenteDTO` (resposta) — tipo desalinhado com o backend.
- **B.** `DespesasRecorrentesMapper.toModel` — lê os campos antigos (soltos), produz `undefined`
  para todos eles hoje; não tem consumidor atual que dependa disto para leitura de dados, mas fica
  incoerente com o próprio Model que declara.
- **C.** `despesas-recorrentes-editar-regra.view-model.ts`/`.component.ts` — único consumidor real
  e visivelmente partido (formulário de edição vem com Categoria/Conta por preencher).

**Escala:** 1 DTO, 1 mapper, 1 view-model, 0 pedidos extra à API necessários (o nome já vem no
payload existente, embora este bugfix não precise de o mostrar em lado nenhum — ver §2).

## 2. Resultado pretendido

`DespesaRecorrenteDTO` passa a refletir o formato real da resposta da API. O formulário de "editar
regra" volta a pré-preencher corretamente Categoria/Conta Origem/Conta Destino/Conta Poupança a
partir de uma regra existente.

**Decisões:**

- **Sem `formatEntityReference`/exibição de nome aqui.** Ao contrário do B0002 (cards de Admin que
  mostram "Nome (id)"), nesta feature não existe hoje nenhum sítio a mostrar o nome da
  categoria/conta — só o id é lido, para pré-selecionar um `<select>`. Adicionar exibição de nome
  seria uma funcionalidade nova, fora do que esta correção (e a issue #60) pedem. Confirmado com o
  utilizador antes de avançar.
- **`DespesaRecorrenteModel` mantém-se com os campos soltos que já tinha** (`categoriaId`,
  `contaOrigemId`, etc.) — só o mapper muda, para ler `.id` dos objetos aninhados do DTO em vez de
  ler campos que deixaram de existir. Isto restaura exatamente o comportamento anterior (funcional),
  sem inflar o Model com dados que ninguém consome.
- **`regra$` passa a `DespesaRecorrenteModel` (via `DespesasRecorrentesMapper.toModel`), não
  `DespesaRecorrenteDTO`.** Isto corrige o bug sem tocar em
  `despesas-recorrentes-editar-regra.component.ts` — o componente já lê os campos certos do Model
  (`regra.categoriaId`, etc.), só parou de funcionar porque o que lhe chegava tinha deixado de ser
  um Model. Também evita duplicar conhecimento do formato do DTO em dois sítios (mapper e
  view-model).
  **Alternativa rejeitada:** corrigir `despesas-recorrentes-editar-regra.component.ts` para ler
  `regra.categoria.id`/`regra.contaOrigem.id` diretamente do DTO. Rejeitada porque duplicaria, no
  componente, o mesmo conhecimento do formato da API que o mapper já existe para encapsular.

## 3. Implementação

1. **`frontend/src/app/features/despesas-recorrentes/dto/despesas-recorrentes.dto.ts`** —
   `DespesaRecorrenteDTO`: `userId: string` → `user?: EntityReference`; `categoriaId: string` →
   `categoria: EntityReference`; `contaOrigemId: string` → `contaOrigem: EntityReference`;
   `contaDestinoId?: string` → `contaDestino?: EntityReference`; `contaPoupancaId?: string` →
   `contaPoupanca?: EntityReference`. `CreateDespesaRecorrenteDTO`/`UpdateDespesaRecorrenteDTO`
   (DTOs de input) não são tocados — mantêm-se corretamente com ids soltos.
2. **`frontend/src/app/features/despesas-recorrentes/models/despesas-recorrentes.model.ts`** —
   `userId: string` → `userId?: string` (para bater certo com o `user?` agora opcional no DTO;
   nenhum consumidor depende de `userId` estar sempre definido).
3. **`frontend/src/app/features/despesas-recorrentes/mappers/despesas-recorrentes.mapper.ts`** —
   `toModel` passa a ler `dto.user?.id`, `dto.categoria.id`, `dto.contaOrigem.id`,
   `dto.contaDestino?.id`, `dto.contaPoupanca?.id`.
4. **`frontend/src/app/features/despesas-recorrentes/mappers/despesas-recorrentes.mapper.spec.ts`**
   (novo) — `toModel` com um DTO no formato atual da API (`categoria`/`contaOrigem`/etc. como
   objeto) produz um Model com os ids certos; falha contra o mapper antigo (que leria
   `dto.categoriaId`/`dto.contaOrigemId`, sempre `undefined` no formato atual da API).
5. **`frontend/src/app/features/despesas-recorrentes/components/editar-regra/despesas-recorrentes-editar-regra.view-model.ts`**
   — `regra$: BehaviorSubject<DespesaRecorrenteDTO | null>` → `BehaviorSubject<DespesaRecorrenteModel | null>`;
   em `load()`, `this.regra$.next(dto)` → `this.regra$.next(DespesasRecorrentesMapper.toModel(dto))`.
   `despesas-recorrentes-editar-regra.component.ts` **não é alterado** — já consome o Model
   corretamente.

Fase única — os 5 pontos são pequenos e diretamente dependentes uns dos outros (o DTO tem de mudar
antes do mapper, que tem de mudar antes do view-model); não há divisão útil em commits adicionais
além do já previsto em §6.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros/warnings pré-existente a esta data.
- `cd frontend && npm test` — o novo spec deve passar; sem baseline de testes a falhar
  previamente nesta feature.
- Verificação manual: com o backend a correr localmente, abrir uma regra existente em
  `/despesas-recorrentes/editar-regra/:id` e confirmar que Categoria, Conta Origem, Conta Destino
  (e Conta Poupança, se aplicável) vêm pré-preenchidos — não automatizável nesta sessão (ver
  `RESULT.md` §4).

## 5. Riscos

- **Risco:** outro código depender do formato antigo (`categoriaId` solto) do
  `DespesaRecorrenteDTO` por engano. **Mitigação:** grep confirmou que
  `despesas-recorrentes-editar-regra.view-model.ts` é o único consumidor direto do DTO de resposta
  fora do mapper e do serviço HTTP; todos os outros passam por `DespesasRecorrentesMapper`.
- **Risco:** o `categoria` do backend (`ICategoriaDTO`) ter `id` opcional (`id?: string`), ao
  contrário do `EntityReference` partilhado que o exige. **Mitigação:** confirmado por leitura de
  `CategoriaMap.toDTO` que `id` é sempre populado na prática; o tipo partilhado `EntityReference`
  já é usado da mesma forma para `categoria` noutros DTOs do projeto (`ITransacaoDTO`).

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | DTO, Model, Mapper + template de teste + view-model de editar-regra | `despesas-recorrentes.dto.ts`, `despesas-recorrentes.model.ts`, `despesas-recorrentes.mapper.ts`, `despesas-recorrentes.mapper.spec.ts` (novo), `despesas-recorrentes-editar-regra.view-model.ts` | A, B, C |

## 7. Fora de âmbito / handoff

- **Mostrar o nome da categoria/conta nos cards de `listar-regras`** — o utilizador confirmou que
  não quer isto agora; ficaria como uma funcionalidade nova, separada, se algum dia for pedida.
- **Verificação manual ponta-a-ponta** (abrir o formulário de editar-regra num browser com backend
  real) — não disponível nesta sessão.
