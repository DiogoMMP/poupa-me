# B0015 — Resultado: deletes físicos em entidades com FK e flag `is_active` por usar

| | |
| :--- | :--- |
| **Tipo** | Bugfix (issue [#89](https://github.com/DiogoMMP/poupa-me/issues/89)) |
| **Branch** | `fix/soft-delete-entidades-com-fk`, criada a partir de `develop` (alterações **não commitadas**) |
| **Estado** | Implementado parcialmente — ver §2 (decisões em aberto) e §4 (não verificado) |
| **Build** | Backend `npm run build`: OK (linha de base: OK). Frontend `ng build`: OK |
| **Testes** | Backend: **34 testes, 11 suites a passar** (linha de base: 20 testes, 5 suites). +14 testes novos em 6 specs; 3 specs existentes atualizados (mocks de `findById` → `findActiveById`, asserções de resultado inalteradas). Frontend `npm test`: não executado (infraestrutura quebrada no baseline, ver B0001) |
| **Lint** | Backend: **51 erros e 7 avisos — igual à linha de base, zero novos** |
| **Commits** | Nenhum. Próximo passo: `commit-push`, depois `create-pr` |

> Escrito para: quem revê a branch antes de a integrar em `develop`.

## 1. O que foi fechado

Mesma numeração do README (A–I).

- **A. `Banco`** — `BancoRepo.delete` passa a `is_active = false`. `findAll` devolve só ativos por defeito (`includeInactive` para o contrário). `BancoService.deleteBanco` recusa com `ACTIVE_CHILDREN` se houver contas, cartões ou regras ativas; com `cascade` desativa tudo numa sequência. Controller: `409` com as contagens.
- **B. `Conta`** — `ContaRepo.delete` soft; `findAll` filtra ativas; `countActiveByBanco` para o aviso do banco. `ContaService.deleteConta(id, cascade)` recusa se houver cartões pagos a partir dela ou regras que a referenciem; com `cascade` desativa-os. Controller: `409`.
- **C. `CartaoCredito`** — `delete` soft; `findAll` filtra; métodos `countActiveByContaPagamento`, `countActiveByBanco`, `deactivateByContaPagamento`, `deactivateByBanco`. Sem bloqueio próprio (cartão não tem filhos que bloqueiem).
- **D. `Categoria`** — `deleteById` soft; `findAll(includeInactive)`. O mapa de nomes das regras usa `findAll(true)`, porque uma regra pode continuar a apontar para uma categoria apagada.
- **E. `User`** — `deleteByEmail` soft; `findAll` só ativos; novos `findActiveByEmail` (usado no login) e `findActiveByDomainId` (usado pelo middleware). `isAuth` rejeita `401` a token JWT **e** a sessão de utilizador inativo ou inexistente, logo a seguir à verificação.
- **F. `DespesaRecorrente`** — nova coluna `is_active` (separada de `ativo`). `delete` escreve só `is_active`, por isso `ativo` (pausa) não é tocado. `DespesaRecorrenteQueryRepo` filtra `d.isActive = true` em todas as listagens; o processamento automático (`findActiveByUserId`) continua a filtrar `ativo`.
- **G. Schema** — `@Unique` de `conta`, `cartao_credito`, `categoria` e `user` substituído por índice único parcial (`WHERE is_active = true`). Migração `1791100000000-SoftDeleteEntidades.ts`. **SQL validado numa base descartável** (ver §4).
- **H. `Transacao`** — inalterado, como aprovado (delete físico, reverte saldos).
- **I. Leituras internas** — `findById` **não** foi alterado: as reversões de saldo de transações antigas de uma conta desativada continuam a funcionar (ver §3).
- **J. Criação e alteração de alvos (segunda ronda)** — `findActiveById` nos repositórios de Conta, Categoria, CartaoCredito e DespesaRecorrente, usado nos caminhos de criação de movimentos, de cartões e de regras, e na alteração de alvo de uma transação (lista completa em §2.2).
- **K. Controlo de acesso (segunda ronda)** — `DELETE /conta/:id` exige Admin (rota). `deleteCartao` exige dono ou Admin (service e controller).
- **L. Regra apagada** — `gerarTransacaoSemValor` recusa regras apagadas.
- **Frontend** — `bancos` e `contas`: o `DELETE` aceita `cascade`; no `409` abre o diálogo de confirmação com as contagens e, se confirmado, repete com `cascade=true`.

## 2. Pontos em aberto — estado após a segunda ronda de decisões

Decisões do utilizador (segunda ronda), por ordem da lista anterior:

1. **Segurança de `deleteConta` / `deleteCartao` — RESOLVIDO.**
   - **Conta: só Admin.** `DELETE /conta/:id` passa a ter `authorize([Role.Admin])` na rota (mesmo padrão de `CategoriaRoute`). O botão de apagar conta no frontend já estava escondido para não-Admin (`*ngIf` em `contas-listar.component.html`).
   - **Cartão: dono ou Admin.** O pedido só falava de contas. Apliquei aos cartões a regra que já existe para bancos (`BancoService.deleteBanco`), porque um cartão pertence a um utilizador. **Se a intenção era Admin-only também para cartões, é uma linha em `CartaoCreditoRoute`.**
   - Cartão alheio → `401 Unauthorized`. Cartão inexistente → sucesso (não revela ids).
2. **Criação de movimentos em registos apagados — RESOLVIDO.** Nos caminhos de criação e de alteração de alvo, as lookups passam a `findActiveById` (novo, nos repositórios de Conta, Categoria, CartaoCredito e DespesaRecorrente): `createEntrada`, `createSaida`, `createCredito`, `createReembolso`, `updateTransacao` (novos alvos), `createDespesaMensal/Semanal/Anual`, `createPoupanca`, `pagarCartao` (cartão e conta de pagamento), `createCartao` (conta de pagamento) e criação/atualização de regras (categoria e contas). Um alvo apagado devolve `… not found`. Reversões e leituras de saldo continuam com `findById`.
   - **Ainda não coberto:** `concluirDespesaRecorrente` e `concluirPoupanca` — concluem um movimento **pendente já existente**. Se a conta foi apagada depois de o pendente ser criado, a conclusão ainda a atualiza. **Consequência:** saldo de conta apagada pode mudar por esta via. **Decisão em aberto:** bloquear a conclusão ou aceitar.
3. **Email de utilizador apagado — MANTIDO (resposta "correto").** O registo com um email de utilizador apagado continua a responder "já existe". **Consequência:** a mesma pessoa não se consegue voltar a registar com esse email, até haver decisão (reativar no registo, ou apagar fisicamente).
4. **Geração manual a partir de regra apagada — RESOLVIDO.** `gerarTransacaoSemValor` usa `findActiveById` e devolve `Despesa not found` para regras apagadas. Regras pausadas (`ativo = false`) continuam a poder ser geridas, porque a pausa não é apagar.
5. **Custo do `isAuth` — sem decisão, mantém-se.** A resposta à issue não tocou neste ponto. Cada pedido autenticado faz uma query a `user`. **Consequência:** latência extra por pedido; medir se for relevante.

## 2b. Decisão sobre `GET /:id` — MANTIDA (resposta "quero que devolva mesmo que esteja inativo")

`GET /banco/:id`, `GET /conta/:id`, `GET /cartao/:id` e `GET /categoria/:id` continuam a devolver registos inativos. Não houve alteração de código: `findById` nunca foi filtrado, e os novos filtros só existem em `findActiveById` (usado apenas na criação e na alteração de alvos).

## 3. Desvios do plano aprovado

- **D6 (`GET /:id`) — desvio aceite pelo utilizador.** O plano dizia que `GET /:id` devolve só ativos. Não foi implementado, e agora fica assim de propósito (ver §2b): `GET /:id` devolve registos inativos. **Consequência:** `GET /banco/:id` de um registo apagado devolve `200`. A UI não o pede.
- **Cascade não é atómico.** O plano dizia "numa só transação". Os repositórios usam `DataSource` por método, sem transação partilhada. A ordem é: filhos primeiro, pai depois. **Consequência:** uma falha a meio deixa filhos desativados e o pai ativo. Repetir o pedido é seguro, porque cada passo é idempotente.
- **Migração não executada pelo runner do TypeORM.** `migrationsRun` só está ativo em produção. Foi validado o **SQL** da migração (ver §4), não o wrapper TypeScript.
- **Testes de repositório não escritos.** O projeto não tem infraestrutura de teste com BD. Os testes novos cobrem services e login, com repositórios mockados.
- **"Falha no código antigo" não foi executado.** Os novos testes foram escritos para falhar contra o código antigo (os métodos e parâmetros novos não existem lá), mas não se correu a suite contra uma cópia do código antigo.
- **Frontend: escolha de texto.** O aviso de cascata e o botão "Eliminar tudo" são propostas minhas (PT-PT); não foram revistos pelo utilizador.
- **Índices com nomes explícitos** (`UQ_conta_nome_banco_ativo`, etc.) em vez dos nomes gerados pelo TypeORM, para que a migração e o `synchronize` de dev usem o mesmo nome.

## 4. Não verificado

- **Ponta-a-ponta na app em execução.** Falta: apagar um banco com contas → aviso → confirmar → listas atualizadas. O stack Docker está a correr (backend na porta 3000), mas não foi reconstruído com estas alterações: é preciso `docker compose up --build backend` antes de testar.
- **Base de dados real.** A migração foi validada numa base descartável (`b0015_scratch`) criada no servidor Postgres do contentor `poupame_postgres_local` (`postgres:16`) e removida no fim. Resultados: `pg_constraint` sem UNIQUE nas 4 tabelas; `is_active` criada em `despesa_recorrente`; duplicado **ativo** bloqueado; duplicado **inativo** permitido, nas tabelas `conta` e `user`. As bases de dados de desenvolvimento não foram alteradas.
- **Totais e património (D8).** Assumiu-se que o frontend só soma contas ativas porque a listagem já as filtra. Não foi verificado no ecrã de Estatísticas.
- **Processamento automático.** O filtro `is_active` no processamento não tem teste.
- **Controlo de acesso das rotas.** `authorize([Role.Admin])` em `DELETE /conta/:id` e a verificação de dono em `deleteCartao` estão cobertos por leitura do código e por testes de serviço (no cartão). Não foram testados por HTTP com tokens reais de Admin e de utilizador.
- **Conclusão de movimentos pendentes** (`concluirDespesaRecorrente`, `concluirPoupanca`) em conta apagada — não coberto, ver §2.2.
- **Frontend unit tests.** `npm test` não foi executado: a infraestrutura de teste do frontend está quebrada no baseline (B0001).

## 5. Como correr a verificação

```bash
cd backend
npm run build      # tsc: prova que os tipos fecham (inclui a migração e as entidades)
npm test           # 34 testes; os 14 novos estão em services/{Banco,Conta,Auth,Transacao,CartaoCredito,DespesaRecorrente}/tests/
npm run lint       # 51 erros / 7 avisos = linha de base; não deve subir

cd ../frontend
npx ng build       # prova que os view-models e os serviços compilam
```

O que cada comando prova: o build fecha os tipos das entidades e dos repositórios novos; os testes provam as regras de bloqueio/cascata e o login de utilizador inativo; o lint prova que não há erros novos; o `ng build` prova que o fluxo do `409` compila.

## 6. Inventário de alterações

**Novos**

- `backend/src/dto/IFilhosAtivosDTO.ts`
- `backend/src/persistence/migrations/1791100000000-SoftDeleteEntidades.ts`
- `backend/src/services/Banco/tests/BancoService.softDelete.spec.ts`
- `backend/src/services/Conta/tests/ContaService.softDelete.spec.ts`
- `backend/src/services/Auth/tests/AuthService.login.spec.ts`
- `backend/src/services/Transacao/tests/TransacaoService.activeTargets.spec.ts`
- `backend/src/services/CartaoCredito/tests/CartaoCreditoService.deleteCartao.spec.ts`
- `backend/src/services/DespesaRecorrente/tests/DespesaRecorrenteProcessadorService.softDelete.spec.ts`
- `docs/changes/bugfixes/B0015-soft-delete-entidades-com-fk/RESULT.md`

**Alterados na segunda ronda (além dos listados abaixo)**

- `api/routes/ContaRoute.ts` — `authorize([Role.Admin])` no delete
- `controllers/CartaoCredito/CartaoCreditoController.ts`, `services/CartaoCredito/CartaoCreditoService.ts`, `ICartaoCreditoService.ts` — `deleteCartao(id, userId, userRole)`
- `repos/Conta/ContaRepo.ts`, `IContaRepo.ts`, `repos/Categoria/CategoriaRepo.ts`, `ICategoriaRepo.ts`, `repos/CartaoCredito/CartaoCreditoRepo.ts`, `ICartaoCreditoRepo.ts`, `repos/DespesaRecorrente/DespesaRecorrenteRepo.ts`, `IRepos/IDespesaRecorrenteRepo.ts` — `findActiveById`
- `services/Transacao/TransacaoService.ts`, `TransacaoDespesasRecorrentesService.ts` — lookups de criação e de alteração de alvo com `findActiveById`
- `services/DespesaRecorrente/DespesaRecorrenteService.ts` — `validarReferenciasAtivas` na criação e atualização
- `services/DespesaRecorrente/DespesaRecorrenteProcessadorService.ts` — `gerarTransacaoSemValor` com `findActiveById`
- Specs existentes atualizados (mocks e a verificação de `findById` → `findActiveById`): `services/Transacao/tests/TransacaoService.spec.ts`, `services/CartaoCredito/tests/CartaoCreditoService.spec.ts`

**Alterados — backend**

- `api/middlewares/isAuth.ts` — verifica utilizador ativo (JWT e sessão)
- `api/routes/BancoRoute.ts`, `api/routes/ContaRoute.ts` — Swagger: `cascade` e `409`
- `controllers/Banco/BancoController.ts`, `controllers/Conta/ContaController.ts` — `cascade`, `409`
- `persistence/entities/ContaEntity.ts`, `CartaoCreditoEntity.ts`, `CategoriaEntity.ts`, `UserEntity.ts` — `@Unique` → `@Index` parcial
- `persistence/entities/DespesaRecorrenteEntity.ts` — coluna `is_active`
- `repos/Banco/BancoRepo.ts`, `IBancoRepo.ts`
- `repos/Conta/ContaRepo.ts`, `IContaRepo.ts`
- `repos/CartaoCredito/CartaoCreditoRepo.ts`, `ICartaoCreditoRepo.ts`
- `repos/Categoria/CategoriaRepo.ts`, `ICategoriaRepo.ts`
- `repos/User/UserRepo.ts`, `IUserRepo.ts`
- `repos/DespesaRecorrente/DespesaRecorrenteRepo.ts`, `DespesaRecorrenteQueryRepo.ts`, `IRepos/IDespesaRecorrenteRepo.ts`
- `services/Auth/AuthService.ts` — login com `findActiveByEmail`
- `services/Banco/BancoService.ts`, `IBancoService.ts`
- `services/Conta/ContaService.ts`, `IContaService.ts`
- `services/DespesaRecorrente/DespesaRecorrenteService.ts` — mapa de categorias com `findAll(true)`

**Alterados — frontend**

- `features/bancos/services/bancos.service.ts` — `delete(id, cascade)`
- `features/bancos/components/listar/bancos-listar.view-model.ts` — `409` → confirmação → cascata
- `features/contas/services/contas.service.ts` — `delete(id, cascade)`
- `features/contas/components/listar/contas-listar.view-model.ts` — `409` → confirmação → cascata

**Não alterados (de propósito)**

- `TransacaoRepo`, `TransacaoService` — delete físico mantido (decisão aprovada)
- `findById` de todos os repositórios — ver §3
