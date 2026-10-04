# B0015 — Deletes físicos em entidades com FK e flag `is_active` por usar

| | |
| :--- | :--- |
| **Tipo** | Bugfix (issue [#89](https://github.com/DiogoMMP/poupa-me/issues/89), label `bug`) |
| **Branch** | `fix/soft-delete-entidades-com-fk` (base: `develop` — não existe nenhum `release/*`; ver decisão D0) |
| **Estado** | Planeado — **aguarda aprovação** (nenhum código alterado) |
| **Âmbito** | Backend apenas: repos e services de `Banco`, `Conta`, `CartaoCredito`, `Categoria`, `User` e `DespesaRecorrente`, mais o gate de login e a migração de schema. `Transacao` mantém delete físico. |
| **Verificação** | `cd backend && npm run build && npm test && npm run lint` — linha de base medida: build OK, 5 suites / 20 testes a passar, lint com 51 erros e 7 avisos **já existentes** |

## 1. Situação

Issue #89: *"Neste momento existem deletes que apagam mesmo a linha da tabela e não o deviam fazer
mas sim colocar com a flag de ativo a false."*

**Evidência:**

- **A flag existe mas nunca é escrita nem lida.** Coluna `is_active` (boolean, default `true`) em
  [`BancoEntity.ts:26-27`](../../../../backend/src/persistence/entities/BancoEntity.ts),
  [`CategoriaEntity.ts:18-19`](../../../../backend/src/persistence/entities/CategoriaEntity.ts),
  [`ContaEntity.ts:39-40`](../../../../backend/src/persistence/entities/ContaEntity.ts),
  [`CartaoCreditoEntity.ts:66-67`](../../../../backend/src/persistence/entities/CartaoCreditoEntity.ts),
  [`UserEntity.ts:24-25`](../../../../backend/src/persistence/entities/UserEntity.ts). Em
  `DespesaRecorrenteEntity` a flag chama-se `ativo`
  ([`DespesaRecorrenteEntity.ts:70-71`](../../../../backend/src/persistence/entities/DespesaRecorrenteEntity.ts)).
  Pesquisa por `isActive|is_active` em `repos/`, `services/`, `controllers/` e `api/`: **nenhuma
  ocorrência**, exceto `isAuth.ts`, que lê `isActive` do utilizador de sessão, não da tabela.
- **Todos os deletes são físicos:**
  - Banco — [`BancoRepo.ts:91-97`](../../../../backend/src/repos/Banco/BancoRepo.ts) (`repo.delete`), chamado por [`BancoService.ts:174`](../../../../backend/src/services/Banco/BancoService.ts)
  - Conta — [`ContaRepo.ts:195`](../../../../backend/src/repos/Conta/ContaRepo.ts) (`createQueryBuilder().delete()`), chamado por [`ContaService.ts:132`](../../../../backend/src/services/Conta/ContaService.ts)
  - CartaoCredito — [`CartaoCreditoRepo.ts:275`](../../../../backend/src/repos/CartaoCredito/CartaoCreditoRepo.ts), chamado por [`CartaoCreditoService.ts:201`](../../../../backend/src/services/CartaoCredito/CartaoCreditoService.ts)
  - Categoria — [`CategoriaRepo.ts:101`](../../../../backend/src/repos/Categoria/CategoriaRepo.ts) (`deleteById`)
  - User — [`UserRepo.ts:133`](../../../../backend/src/repos/User/UserRepo.ts) (`deleteByEmail`), exposto em [`AuthRoute.ts:350`](../../../../backend/src/api/routes/AuthRoute.ts)
  - DespesaRecorrente — [`DespesaRecorrenteRepo.ts:245`](../../../../backend/src/repos/DespesaRecorrente/DespesaRecorrenteRepo.ts), chamado por [`DespesaRecorrenteService.ts:242`](../../../../backend/src/services/DespesaRecorrente/DespesaRecorrenteService.ts)
  - Transacao — [`TransacaoRepo.ts:354`](../../../../backend/src/repos/Transacao/TransacaoRepo.ts), chamado por [`TransacaoService.ts:608`](../../../../backend/src/services/Transacao/TransacaoService.ts) (após reverter saldos)
- **Referências por FK (que impedem um delete físico):** nenhuma relação tem `onDelete` explícito, por
  isso o TypeORM usa `NO ACTION` e o Postgres recusa apagar o pai enquanto houver filhos (a confirmar
  com o erro real em dev):
  - `Conta` ← `banco_id` ([`ContaEntity.ts:32-33`](../../../../backend/src/persistence/entities/ContaEntity.ts))
  - `CartaoCredito` ← `conta_pagamento_id` ([`CartaoCreditoEntity.ts:46-47`](../../../../backend/src/persistence/entities/CartaoCreditoEntity.ts)) e `banco_id` (`:56-57`)
  - `Transacao` ← `categoria_id`, `conta_id`, `conta_destino_id`, `conta_poupanca_id`, `cartao_credito_id` ([`TransacaoEntity.ts:46-75`](../../../../backend/src/persistence/entities/TransacaoEntity.ts))
  - `DespesaRecorrente` ← `categoria_id`, `conta_origem_id`, `conta_destino_id`, `conta_poupanca_id` ([`DespesaRecorrenteEntity.ts:36-58`](../../../../backend/src/persistence/entities/DespesaRecorrenteEntity.ts))
- **Unicidade que um soft delete mantém:** `@Unique(['nome', 'bancoId'])` em
  [`ContaEntity.ts:6`](../../../../backend/src/persistence/entities/ContaEntity.ts) e
  [`CartaoCreditoEntity.ts:17`](../../../../backend/src/persistence/entities/CartaoCreditoEntity.ts);
  `@Unique(['nome'])` em [`CategoriaEntity.ts:4`](../../../../backend/src/persistence/entities/CategoriaEntity.ts);
  `@Unique(['email'])` em [`UserEntity.ts:4`](../../../../backend/src/persistence/entities/UserEntity.ts).
  Com soft delete, a linha inativa continua a ocupar o nome/email.
- **Posse sem FK:** o dono é um `user_domain_id` em texto (ex.: [`BancoEntity.ts:23-24`](../../../../backend/src/persistence/entities/BancoEntity.ts),
  [`ContaEntity.ts:26-27`](../../../../backend/src/persistence/entities/ContaEntity.ts)). Apagar um `User`
  não é bloqueado pela BD e deixa bancos/contas/transações desse utilizador sem dono ativo.
- **Login e JWT não olham para `isActive`:** [`AuthService.ts:80`](../../../../backend/src/services/Auth/AuthService.ts)
  faz `findByEmail` e valida a password sem verificar a flag; [`isAuth.ts:57`](../../../../backend/src/api/middlewares/isAuth.ts)
  fixa `isActive: true` no ramo JWT, por isso um token emitido antes de desativar continua válido até expirar.
- **Schema:** `synchronize` em dev; migrações só em produção ([`loaders/typeorm.ts:37-42`](../../../../backend/src/loaders/typeorm.ts)).
  Existe uma única migração ([`1788718762000-AddIsPagamentoCartaoToTransacao.ts`](../../../../backend/src/persistence/migrations/1788718762000-AddIsPagamentoCartaoToTransacao.ts)).
- **Leituras a rever:** cerca de 78 linhas com `find`/`createQueryBuilder` só nos 5 repos de
  `Banco`, `Conta`, `CartaoCredito`, `Categoria` e `User`. Nenhuma filtra por flag.

**Inventário (superfícies afetadas):**

- **A.** `Banco` — `BancoRepo.delete` → soft; `BancoService.deleteBanco` com regra de filhos (D2); leituras (`findAll`, `findById`, mapas) a filtrar ativos.
- **B.** `Conta` — `ContaRepo.delete` → soft; `ContaService.deleteConta` com regra de filhos (D2); leituras a filtrar ativos.
- **C.** `CartaoCredito` — `CartaoCreditoRepo.delete` → soft; `CartaoCreditoService.deleteCartao` com regra de filhos (D2); leituras a filtrar ativos.
- **D.** `Categoria` — `CategoriaRepo.deleteById` → soft; leituras (listas de categorias para os selects) a filtrar ativos.
- **E.** `User` — `UserRepo.deleteByEmail` → soft; `AuthService.login` e `isAuth` (JWT) a rejeitar inativos (D4); listagem de utilizadores para Admin.
- **F.** `DespesaRecorrente` — nova coluna `is_active` (D3), `delete` → soft, `DespesaRecorrenteQueryRepo` e processador de regras a ignorar inativas.
- **G.** Schema — migração: coluna `is_active` em `despesa_recorrente` e índices únicos **parciais** (`WHERE is_active`) em `conta(nome, banco_id)`, `cartao_credito(nome, banco_id)`, `categoria(nome)` e `user(email)` (D5).
- **H.** `Transacao` — **fora do âmbito**: continua delete físico (ver D1).
- **I.** Leituras internas que resolvem nomes de contas/cartões/bancos em transações antigas — têm de continuar a devolver registos inativos (ver D6).

**Escala:** 6 entidades de origem (5 com `is_active`, 1 com `ativo`), 7 métodos de delete,
cerca de 78 linhas de leitura a rever nos 5 repos principais, 1 migração nova, 0 alterações de
frontend previstas.

## 2. Intenção e opinião

**Opinião:** a issue está certa no princípio, mas "trocar o `delete` por `is_active = false`" não chega.
Há cinco coisas que a issue não diz e que mudam o trabalho:

1. **A flag é invisível para o resto do código.** Hoje nenhuma leitura a filtra. Ativar o soft delete
   sem rever as leituras faz com que registos apagados continuem a aparecer em todos os selects e listagens.
2. **Unicidade.** Recriar uma conta, cartão, categoria ou utilizador com o mesmo nome/email passaria a dar
   erro de unicidade. Resolve-se com índices únicos parciais, o que obriga a migração.
3. **Filhos ativos.** Apagar um banco com contas, ou uma conta com regras recorrentes ativas, não pode
   deixar os filhos a funcionar em silêncio.
4. **`ativo` em `DespesaRecorrente` não serve para "apagado".** Se o delete só puser `ativo = false`,
   uma regra apagada fica indistinguível de uma regra **pausada** pelo utilizador. Precisa de flag própria.
5. **Utilizador desativado ainda entra.** Sem verificação no login e no JWT, o soft delete de `User`
   não bloqueia acesso.

Concordo com a separação que a issue sugere: **entidades com dependências por FK ou com histórico
financeiro passam a soft delete; `Transacao` continua a ser apagada fisicamente**, porque apagar uma
transação já reverte o saldo da conta (`TransacaoService.ts:608`) e não há registos filhos a proteger.

### Decisões (propostas — a confirmar na aprovação)

- **D0 — Branch e base.** `fix/soft-delete-entidades-com-fk` a partir de `develop`. O skill sugere
  `bugfix/<slug>`, mas o repo usa `fix/<slug>` em todas as branches de bugfix já registadas (B0001–B0014);
  segue-se a convenção do repo. Não há `release/*`, por isso a base é `develop`. **Nenhuma branch criada nesta fase.**
- **D1 — Quais entidades mudam.** Soft delete em `Banco`, `Conta`, `CartaoCredito`, `Categoria`, `User` e
  `DespesaRecorrente`. `Transacao` mantém delete físico (concordância com a issue).
- **D2 — Banco/Conta/Cartão com filhos ativos.** *Decidido (opinião delegada pelo utilizador na aprovação):*
  **aviso primeiro, cascata só com confirmação explícita.**
  - Sem `?cascade=true`, o delete de um `Banco` com contas/cartões ativos, ou de uma `Conta` com cartões
    de pagamento ou regras recorrentes ativas, **não é executado**: devolve `409 Conflict` com a contagem
    dos filhos ativos (ex.: `{ contasAtivas, cartoesAtivos, regrasAtivas }`).
  - A UI mostra o aviso ("Este banco tem 3 contas e 1 cartão ativos. Desativar também os seus registos?")
    e, se o utilizador confirmar, repete o pedido com `?cascade=true`.
  - Com `cascade=true`, numa só transação, desativam-se os filhos (contas, cartões, regras recorrentes
    ligadas à conta) e depois o registo pai. Nunca se apaga fisicamente.
  - `CartaoCredito` não tem filhos bloqueantes (só transações). As **transações** nunca bloqueiam: uma
    conta apagada mantém o histórico visível.
  - *Porquê:* recusar sem aviso esconde o problema; cascata silenciosa esconde saldos. O aviso com
    contagem torna a consequência visível antes de a ação acontecer.
- **D3 — `DespesaRecorrente`.** *Recomendado:* nova coluna `is_active` (default `true`), separada de
  `ativo`. `ativo` continua a significar pausa; `is_active` significa apagado. As listagens filtram `is_active = true`.
  *Alternativa:* reutilizar `ativo` — rejeitada pelo ponto 4 acima.
- **D4 — Utilizador desativado.** *Recomendado:* `AuthService.login` recusa utilizadores inativos
  (mensagem genérica, igual à de password errada, para não revelar contas existentes) e `isAuth` (ramo JWT)
  confirma `is_active` na BD em cada pedido. *Alternativa:* só bloquear o login; o JWT já emitido continua
  válido até expirar.
- **D5 — Unicidade após soft delete.** *Recomendado:* índices únicos parciais `WHERE is_active = true`
  em `conta`, `cartao_credito`, `categoria` e `user`. Permite recriar com o mesmo nome e mantém a
  unicidade entre registos ativos. *Alternativa:* manter o `@Unique` e devolver erro claro ao recriar.
- **D6 — Filtragem.** Listagens e `GET /:id` expostos na API devolvem só ativos. Resoluções internas
  (nome da conta numa transação antiga, mapas de bancos/contas no `ContaService`/`CartaoCreditoService`,
  `TransacaoService`, `Estatisticas`) continuam a incluir inativos. Implementação: métodos de repo com
  flag explícita (`includeInactive`), não filtro implícito global.
- **D7 — Dados já apagados.** Não há recuperação nem backfill: o que já foi apagado fisicamente não volta.
- **D8 — Saldos.** Uma conta inativa **sai** dos totais de património/estatísticas. Decisão a validar na
  implementação ao ler `Estatisticas`.

**Rejeitado:**

- **Apagar a `DespesaRecorrente` com `ativo = false`** — confunde apagado com pausado (ponto 4).
- **Filtro global automático no TypeORM (`@DeleteDateColumn`/subscriber)** — esconderia registos inativos
  também nas resoluções internas que precisam deles (D6) e obrigaria a mudar o tipo de todas as colunas.
  Preferido o filtro explícito por método.
- **Não mexer no schema, só no código** — deixa a unicidade a bloquear recriações e mantém a flag sem ser
  usada como fonte de verdade.

## 3. Implementação

Ordem de execução; cada fase é compilável e verificável sozinha.

1. **Schema.** Adicionar `is_active` a `DespesaRecorrenteEntity` (D3). Migração em
   `backend/src/persistence/migrations/` com: `is_active` em `despesa_recorrente`; remoção dos
   `UNIQUE` existentes em `conta`, `cartao_credito`, `categoria` e `user` (nome do constraint lido
   de `pg_constraint` antes de escrever a migração); criação dos índices únicos parciais (D5). Espelhar
   no `synchronize` de dev (as entidades têm de refletir a migração).
2. **Repos — delete.** `delete`/`deleteById`/`deleteByEmail`/`DespesaRecorrenteRepo.delete` passam a
   `UPDATE ... SET is_active = false` (ou `ativo`-equivalente para `DespesaRecorrente`, D3). Métodos
   `find*` ganham filtro explícito; ver D6.
3. **Repos — leituras.** Listagens e `findAll` dos 5 repos filtram `is_active = true`; resoluções
   internas recebem `includeInactive`. `DespesaRecorrenteQueryRepo` já filtra `ativo = true` (`:75-77`) — acrescentar `is_active`.
4. **Services — regras de delete.** `deleteBanco` e `deleteConta` devolvem falha tipada "filhos ativos" com
   a contagem quando há filhos e `cascade` não está ativo; com `cascade`, desativam os filhos e o pai numa
   transação (D2). `deleteDespesa` passa a soft. `TransacaoService` mantém o delete físico após reverter saldos.
   **Controllers/rotas:** `DELETE /banco/:id` e `DELETE /conta/:id` aceitam `?cascade=true` e mapeiam a
   falha "filhos ativos" para `409` (o mapeamento atual só conhece 404/401/400).
4b. **Frontend — confirmação (D2).** `bancos-listar.view-model.ts` e `contas-listar.view-model.ts`: ao
   receber `409`, abrem o popup de confirmação já existente (B0005) com a contagem e, se confirmado,
   repetem o `DELETE` com `cascade=true`. Ver o `ConfirmService`/popup usado em B0005 antes de implementar.
5. **Auth.** `AuthService.login` e `isAuth` (JWT) respeitam `is_active` (D4). `isAuth` sessão já lê `isActive` (`isAuth.ts:88`).
6. **Testes** (ver §4): specs em `tests/` ou `services/*/tests/` no padrão existente
   (ex.: [`DespesaRecorrenteProcessadorService.spec.ts`](../../../../backend/src/services/DespesaRecorrente/tests/DespesaRecorrenteProcessadorService.spec.ts)),
   com repos mockados. Não há testes de repo com BD no projeto; ver §4.

## 4. Verificação

- `cd backend && npm run build` — linha de base: **OK**.
- `cd backend && npm test` — linha de base: **5 suites, 20 testes a passar**. Depois: os novos testes
  somam-se; nenhum existente pode ser enfraquecido.
- `cd backend && npm run lint` — linha de base: **51 erros e 7 avisos já existentes**. O critério é não
  aumentar o número nos ficheiros tocados, não zero.
- **Testes novos (no mínimo, cada um tem de falhar contra o código atual):**
  - `deleteBanco` com contas ativas → recusa; sem contas → marca inativo e não chama `delete`.
  - `deleteConta` / `deleteCartao` com regras recorrentes ativas → recusa.
  - `DespesaRecorrente`: apagar marca `is_active = false`, não altera `ativo`.
  - `AuthService.login` com utilizador inativo → falha com a mensagem genérica.
- **Não verificado nesta fase (vai para RESULT §4):** migração contra Postgres com dados reais;
  comportamento ponta-a-ponta no frontend (listas e selects após apagar); confirmação do erro FK atual em dev.

## 5. Riscos

| # | Risco | Como validar que não aconteceu |
| :--- | :--- | :--- |
| R1 | Uma leitura esquecida continua a mostrar registos apagados | Grep de `find`/`createQueryBuilder` nos 5 repos, com a lista de decisão por método, e teste de listagem |
| R2 | Nome do constraint `UNIQUE` em produção diferente do previsto → migração falha | Ler os constraints de `pg_constraint` antes; testar a migração numa cópia dos dados |
| R3 | Regra recorrente ativa continua a gerar transações numa conta apagada | Teste: `deleteConta` recusa com regras ativas (D2); e o processador ignora contas inativas |
| R4 | Token JWT de utilizador desativado continua válido | Teste de `isAuth` com utilizador inativo, se D4 for "recomendado" |
| R5 | Conta inativa continua a contar em saldos/estatísticas | Ler `Estatisticas` e confirmar que filtra `is_active` (D8) |
| R6 | Mudança de `UNIQUE` para índice parcial não é suportada pelo `@Unique` do TypeORM | Declarar o índice com `@Index(..., { unique: true, where: ... })` e confirmar o SQL gerado pelo `synchronize` em dev |

## 6. Ordem de commits

Projeto sem hooks de formatação (sem `.husky/`, `.githooks/` nem `pre-commit`); ainda assim um commit por unidade revisável.

| # | Unidade | Ligação ao inventário |
| :--- | :--- | :--- |
| 1 | `fix(schema): adiciona is_active a despesa recorrente e índices únicos parciais` | G, F |
| 2 | `fix(repos): delete passa a soft e leituras filtram ativos` | A–F, I |
| 3 | `fix(services): aviso e cascata explícita ao apagar com filhos ativos (409)` | A, B, C, F |
| 3b | `fix(frontend): confirma cascata ao apagar banco/conta com filhos` | A, B |
| 4 | `fix(auth): rejeita utilizadores desativados no login e no JWT` | E |
| 5 | `test(backend): cobre soft delete e bloqueios` | A–F |

## 7. Fora do âmbito e handoff

- **`Transacao`** continua com delete físico (decisão da issue).
- **Restaurar** registos apagados (endpoint ou UI) — não pedido; fica para outra issue.
- **Purga** de registos inativos antigos — não pedido.
- **Frontend** — alterações limitadas ao fluxo de confirmação de D2 (`bancos-listar` e `contas-listar`
  view-models e respetivos serviços, que passam a aceitar `cascade`). As restantes listagens não mudam.
- **Dados já apagados** não são recuperáveis (D7).
- **Índice de bugfixes** (`docs/changes/bugfixes/README.md`) só é atualizado no fim, com a linha da B0015.
