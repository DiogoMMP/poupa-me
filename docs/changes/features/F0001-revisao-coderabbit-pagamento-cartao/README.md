# F0001 — Corrige os 3 findings do CodeRabbit no PR #73 (pagamento de cartão)

| | |
| :--- | :--- |
| **Tipo** | Feature (correção de revisão de código sobre um PR ainda aberto) |
| **Branch** | `feature/pagamento-cartao-e-referencias-dto` (base: `develop`) — mesma branch do PR #73, por decisão do utilizador |
| **Estado** | Planeado |
| **Âmbito** | Backend: `CartaoCreditoService`, `TransacaoPagarCartaoRepo`, `TransacaoService`, `TransacaoEntity`, `typeorm.ts`; 1 migração nova |
| **Verificação** | `npm test` + `npm run build` (backend) |

## 1. Situação

O PR #73 (`fix: corrige pagamento de cartão e alinha DTOs com referências de entidade`) foi revisto
pelo CodeRabbit, que reportou 3 findings "Major". Todos foram verificados manualmente contra o
código atual (não apenas o texto do CodeRabbit) numa análise anterior nesta conversa, antes de
qualquer decisão de implementação.

**Evidência (confirmada por leitura direta do código nesta branch):**

- **A. Sem migração para `is_pagamento_cartao`.**
  [`backend/src/persistence/entities/TransacaoEntity.ts:84-85`](../../../../backend/src/persistence/entities/TransacaoEntity.ts)
  adiciona a coluna `is_pagamento_cartao`. `backend/src/loaders/typeorm.ts` tem `synchronize:
  !isProduction` (ou seja, `false` em produção) e **nenhuma configuração de `migrations`**. Confirmado
  também que este projeto **nunca teve infraestrutura de migrations, nenhuma vez na sua história**
  (nenhum ficheiro `migration`, nenhum script no `package.json`) — não é uma prática nova que este PR
  introduz, é uma lacuna do projeto todo que este PR expõe pela primeira vez de forma concreta.

- **B. `applyReembolsoImpact` sem guarda `isPagamentoCartao`.**
  Em [`backend/src/services/Transacao/TransacaoService.ts`](../../../../backend/src/services/Transacao/TransacaoService.ts),
  `applyCreditoImpact` (linha 375-376) e `revertCreditoImpact` (linha 302-303) já guardam
  `if (transacao.isPagamentoCartao) return Result.ok<void>();`. `applyReembolsoImpact` (linha 402) **não
  tem essa guarda** — credita sempre a conta de pagamento e pode reduzir a utilização do cartão.
  Achado adicional (não reportado pelo CodeRabbit, mas simétrico): `revertReembolsoImpact` (linha 330)
  tem exatamente a mesma lacuna.
  **Cenário:** editar um registo `isPagamentoCartao=true` (tipo original `Crédito`) alterando `tipo`
  para `'Reembolso'` via `PATCH /transacao/:id` — o revert do tipo antigo é no-op (guarda do Crédito),
  mas o apply do novo tipo move dinheiro de facto. `ITransacaoUpdateDTO.tipo` é aceite sem validação no
  controller. **Confirmado que não é acionável pela app hoje** — nem `transacoes-editar.component.html`
  nem `.view-model.ts` alguma vez enviam `tipo` no payload de update (sem seletor de tipo no ecrã de
  edição); só é explorável via chamada direta à API.

- **C. `pagarCartao` não é atómico.** Confirmada a sequência real em
  [`backend/src/services/CartaoCredito/CartaoCreditoService.ts:314-387`](../../../../backend/src/services/CartaoCredito/CartaoCreditoService.ts)
  e [`backend/src/repos/Transacao/TransacaoPagarCartaoRepo.ts`](../../../../backend/src/repos/Transacao/TransacaoPagarCartaoRepo.ts):
  são **3 escritas separadas na BD, sem transação nenhuma**:
  1. `cartaoRepo.update(...)` grava o novo `saldoUtilizado`/`período` do cartão (linha 365 do service).
  2. `UPDATE transacao SET status='Concluído' WHERE ...` em massa (dentro do repo).
  3. `transacaoRepo.save(paymentDomain)` cria o registo "Pagamento X" (dentro do repo).

  Se a escrita 2 ou 3 falhar depois da 1 já persistida, o cartão fica com saldo/período de "já pago"
  mas as transações antigas continuam `Pendente` e não existe registo do pagamento — inconsistência
  real de dinheiro. **Ao contrário do finding B, este é acionável pelo botão normal "Pagar Cartão" na
  app.** Confirmado por grep que este projeto **nunca usou `dataSource.transaction`/`queryRunner`**
  em lado nenhum — será o primeiro uso deste padrão no código.

**Inventário (superfícies afetadas):**

- **A.** Migração + configuração do `DataSource` (novo ficheiro + `typeorm.ts`).
- **B.** `TransacaoService.applyReembolsoImpact` + `TransacaoService.revertReembolsoImpact`.
- **C.** `CartaoCreditoService.pagarCartao` + `TransacaoPagarCartaoRepo.pagarCartao` +
  `ITransacaoPagarCartaoRepo`.

**Escala:** 3 findings, 2 métodos com guarda em falta, 3 escritas de BD a unificar numa transação, 1
migração nova, 0 infraestrutura de migrations pré-existente para reaproveitar.

## 2. Resultado pretendido

Os 3 findings ficam fechados sem alterar o comportamento observável de nenhum fluxo que já funciona
corretamente hoje (criação/edição normal de transações, listagem de cartões, etc.).

**Decisões:**

- **Migrations ligadas só em produção** (`migrations: [...]`, `migrationsRun: true` apenas quando
  `isProduction`). Em dev/test mantém-se `synchronize: true` como está hoje — ligar as duas coisas ao
  mesmo tempo faria a migração falhar ao tentar recriar uma coluna que o `synchronize` já criou.
  **Alternativa rejeitada:** montar já scripts de CLI (`migration:generate`/`migration:run` no
  `package.json`). Rejeitada porque exigiria uma ligação real a Postgres para verificar que funcionam
  — não disponível nesta sessão — e não é necessária para o `migrationsRun: true` resolver o problema
  real (a coluna passa a ser criada em produção automaticamente no arranque da app, sem passo manual).
  Fica registada como item para decisão em §7.
- **Guardar também `revertReembolsoImpact`**, não só `applyReembolsoImpact` como o CodeRabbit
  reportou — para manter o par Reembolso simétrico ao par Crédito já existente, e para que um
  `revert` futuro sobre um registo que alguma vez tenha ficado com `tipo='Reembolso'` por engano
  também não mova dinheiro.
- **Atomicidade sem tocar em `TransacaoRepo.save()` partilhado.** `TransacaoPagarCartaoRepo.pagarCartao`
  passa a construir e gravar o registo de pagamento diretamente dentro de
  `this.dataSource.transaction(...)`, reaproveitando `TransacaoIdHelper` (utilitário puro, já usado por
  `TransacaoRepo.save()`) para gerar o `domainId` sequencial, e `TransacaoMap.toDomain` para mapear o
  registo persistido de volta a domínio — sem chamar `this.transacaoRepo.save(...)`. Decisão do
  utilizador, entre duas opções apresentadas: mantém o raio de impacto contido a
  `CartaoCreditoService.ts`/`TransacaoPagarCartaoRepo.ts`, sem tocar no método usado por mais 6 pontos
  de chamada (`TransacaoService`, `TransacaoDespesasRecorrentesService`) que hoje não têm rede de
  segurança de testes automatizados.
  **Alternativa rejeitada:** estender `TransacaoRepo.save()` com um `EntityManager` opcional. Rejeitada
  por implicar reescrever ~10 pontos internos desse método partilhado só para este caso.
- **`CartaoCreditoService.pagarCartao` deixa de chamar `cartaoRepo.update(...)` diretamente.** Passa a
  calcular `novoSaldoUtilizado`/`novoPeriodo` (lógica de domínio pura, sem tocar BD — como já faz hoje)
  e a entregá-los a `transacaoRepo.pagarCartao(...)`, que persiste tudo (cartão + transações + registo
  de pagamento) dentro da mesma transação.

## 3. Implementação

1. **`backend/src/repos/Transacao/IRepos/ITransacaoPagarCartaoRepo.ts`** — estender a assinatura de
   `pagarCartao` com `novoSaldoUtilizado: number` e `novoPeriodo: { inicio: Date; fecho: Date }`.

2. **`backend/src/repos/Transacao/TransacaoPagarCartaoRepo.ts`** — envolver as 3 escritas em
   `this.dataSource.transaction(async (manager) => { ... })`:
   - Atualizar `saldoUtilizado`/`periodoInicio`/`periodoFecho` do `CartaoCreditoEntity` via
     `manager.getRepository(CartaoCreditoEntity)`.
   - O `UPDATE transacao SET status='Concluído' ...` em massa passa a usar
     `manager.getRepository(TransacaoEntity)` em vez de `this.dataSource.getRepository(...)`.
   - Construir e gravar o registo de pagamento diretamente via `manager.getRepository(TransacaoEntity)`
     (gerar `domainId` com `TransacaoIdHelper`, inserir, reler com relations `['categoria',
     'cartaoCredito']`, mapear com `TransacaoMap.toDomain`) — sem passar por `this.transacaoRepo.save()`.
   - Qualquer erro dentro do callback faz `dataSource.transaction` reverter tudo automaticamente.

3. **`backend/src/services/CartaoCredito/CartaoCreditoService.ts`** — em `pagarCartao`, remover a
   chamada a `this.cartaoRepo.update(updatedCartaoOrError.getValue())` e passar
   `novoSaldoUtilizado.value` e o novo período (como `Date`, no mesmo formato já usado para
   `periodoAntigoInicio`/`periodoAntigoFecho`) na chamada a `this.transacaoRepo.pagarCartao(...)`.

4. **`backend/src/services/Transacao/TransacaoService.ts`** — adicionar
   `if (transacao.isPagamentoCartao) return Result.ok<void>();` no início de `applyReembolsoImpact`
   (linha ~402) e de `revertReembolsoImpact` (linha ~330), com o mesmo comentário-padrão já usado em
   `applyCreditoImpact`/`revertCreditoImpact`.

5. **Migração (habilitador, pode ser feito em paralelo com 1-4)**
   - `backend/src/persistence/migrations/<timestamp>-AddIsPagamentoCartaoToTransacao.ts` (novo) —
     `up`: `ALTER TABLE transacao ADD COLUMN is_pagamento_cartao boolean NOT NULL DEFAULT false`;
     `down`: `ALTER TABLE transacao DROP COLUMN is_pagamento_cartao`.
   - `backend/src/loaders/typeorm.ts` — adicionar `migrations: [...]` (glob para
     `dist/persistence/migrations/*.js`) e `migrationsRun: true`, ambos só quando `isProduction`.

6. **Testes novos** (`backend/src/services/Transacao/tests/*.spec.ts`,
   `backend/src/services/CartaoCredito/tests/*.spec.ts` — primeiros specs destes dois serviços) —
   repositórios mockados via `jest.fn()`, sem BD real:
   - `TransacaoService.applyReembolsoImpact` e `revertReembolsoImpact`: com `isPagamentoCartao=true`,
     confirmar que nenhum repo de conta/cartão é chamado. Falha contra o código atual (chama sempre),
     passa depois da guarda.
   - `CartaoCreditoService.pagarCartao`: confirmar que `transacaoRepo.pagarCartao` é chamado com
     `novoSaldoUtilizado`/`novoPeriodo` corretos e que `cartaoRepo.update` **não** é chamado
     diretamente pelo service.

## 4. Verificação

- `cd backend && npm run build` — sem baseline de erros/warnings pré-existente a esta data.
- `cd backend && npm test` — os novos specs devem passar; sem baseline de testes a falhar
  previamente (o backend só tinha o spec de `DomainEvents` até esta mudança).
- **Não verificável nesta sessão, por falta de Postgres real:**
  - Que a migração corre de facto em produção (`migrationsRun: true`) e que o `down` reverte
    corretamente.
  - Que `dataSource.transaction(...)` reverte de facto as 3 escritas quando uma falha a meio (só
    posso confirmar isto por leitura de código e pelos testes unitários com mocks, não por um teste
    de integração real).
  - Ver `RESULT.md` §4 para o que fica pendente e como validar manualmente.

## 5. Riscos

- **Risco:** `manager.getRepository(TransacaoEntity)` dentro da transação já não encontrar o
  `CartaoCreditoEntity`/`CategoriaEntity` lidos antes de abrir a transação (leituras feitas fora do
  `manager`). **Mitigação:** mover as leituras necessárias (categoria, cartão) para dentro do
  callback da transação, usando o mesmo `manager`.
- **Risco:** a guarda nova em `applyReembolsoImpact`/`revertReembolsoImpact` esconder um bug
  genuíno se algum dia um registo `isPagamentoCartao=true` precisar legitimamente de tipo
  `Reembolso`. **Mitigação:** confirmado por leitura de `TransacaoPagarCartaoRepo.pagarCartao` que o
  tipo do registo de pagamento é sempre fixo como `'Crédito'` na criação — nunca `'Reembolso'` — logo
  a guarda só bloqueia o caminho de edição indevida, nunca um caso de uso real.
- **Risco:** `migrationsRun: true` correr em produção antes de eu conseguir testar contra uma BD
  real. **Mitigação:** a migração é uma única `ALTER TABLE ... ADD COLUMN ... DEFAULT false`,
  operação padrão e reversível (`down` definido); sem dados a migrar, sem lock prolongado esperado
  numa tabela deste tamanho.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Migração + configuração do DataSource | `<timestamp>-AddIsPagamentoCartaoToTransacao.ts` (novo), `typeorm.ts` | A |
| 2 | Guarda `isPagamentoCartao` no Reembolso + testes | `TransacaoService.ts`, `TransacaoService.spec.ts` (novo) | B |
| 3 | Atomicidade do pagamento de cartão + testes | `ITransacaoPagarCartaoRepo.ts`, `TransacaoPagarCartaoRepo.ts`, `CartaoCreditoService.ts`, `CartaoCreditoService.spec.ts` (novo) | C |

## 7. Fora de âmbito / handoff

- **Scripts de CLI para gerar/correr migrations manualmente** (`migration:generate`,
  `migration:run`, `migration:revert` no `package.json`) — decisão do utilizador, por falta de
  Postgres real para verificar nesta sessão. `migrationsRun: true` já resolve o problema concreto
  deste PR (a coluna passa a ser criada em produção); tooling manual fica para quando o projeto
  precisar de mais migrations.
- **Reconciliação com o branch `fix/dashboard-banco-endpoint-404`** (já com B0001/B0002 mergeados
  nessa branch, tocando alguns dos mesmos ficheiros de frontend deste PR) — decisão explícita do
  utilizador de tratar isto só na altura do merge deste PR, não agora.
- **Verificação de integração real** (transação a reverter de facto contra Postgres, migração a
  correr contra uma BD de produção-like) — não disponível nesta sessão; ver `RESULT.md` §4.
