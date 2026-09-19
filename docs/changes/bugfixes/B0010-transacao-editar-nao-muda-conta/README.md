# B0010 — Editar Transação não aplica a nova Conta/Cartão/etc. selecionada

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/transacao-editar-nao-muda-conta` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | 1 método de serviço (`TransacaoService.updateTransacao`) + testes, contexto `Transacao` |
| **Verificação** | `cd backend && npm run build` + `npm run lint` + `npm test` |

## 1. Situação

Issue [#52](https://github.com/DiogoMMP/poupa-me/issues/52): *"Quando editamos uma transação e mudamos
a conta (única coisa testada) não funciona!"* — ao editar uma Transação existente e escolher outra
Conta no formulário, a alteração não é aplicada; a transação continua associada à conta antiga.

**Evidência:**

O fluxo desde o formulário até ao pedido HTTP está correto — não é aqui que o valor se perde:

- `transacoes-editar.view-model.ts:104-112` inclui `contaId: formData.contaId || undefined` no
  payload de update, refletindo a seleção do formulário.
- `transacoes.service.ts:217-219` faz `PATCH /transacao/:id` com esse payload tal como está.
- `TransacaoController.updateTransacao` (`backend/src/controllers/Transacao/TransacaoController.ts:123-132`)
  passa `req.body as ITransacaoUpdateDTO` ao service sem filtrar campos.
- `ITransacaoUpdateDTO` (`backend/src/dto/ITransacaoDTO.ts:53-56`) já declara `contaId`,
  `cartaoCreditoId`, `contaDestinoId` e `contaPoupancaId`.

O valor perde-se em `backend/src/services/Transacao/TransacaoService.ts`, método `updateTransacao`
(STEP 2, linhas 470-499). Para `categoria`, o método lê corretamente o novo id do DTO e vai buscá-la
ao repositório:

```ts
// linhas 477-482 — padrão correto, usado para categoria
let categoria = existing.categoria;
if (updateDTO.categoriaId) {
    const cat = await this.categoriaRepo.findById(updateDTO.categoriaId);
    if (!cat) return Result.fail<ITransacaoDTO>('Category not found');
    categoria = cat;
}
```

Mas para os quatro campos relacionais que também podem mudar num update — `conta`, `cartaoCredito`,
`contaDestino`, `contaPoupanca` — não existe equivalente. A entidade atualizada é construída sempre
com os valores da transação **antiga**, ignorando por completo `updateDTO.contaId` (e os outros três):

```ts
// linhas 484-496 — bug: nenhum dos quatro campos é recalculado a partir do updateDTO
const updatedOrError = Transacao.create({
    descricao, data, valor, tipo: tipoVO, categoria, status,
    conta: existing.conta,                 // ignora updateDTO.contaId
    cartaoCredito: existing.cartaoCredito,  // ignora updateDTO.cartaoCreditoId
    contaDestino: existing.contaDestino,    // ignora updateDTO.contaDestinoId
    contaPoupanca: existing.contaPoupanca,  // ignora updateDTO.contaPoupancaId
    isPagamentoCartao: existing.isPagamentoCartao
}, existing.id);
```

O mapper de persistência (`TransacaoMap.toPersistence`, `backend/src/mappers/TransacaoMap.ts:222-246`)
deriva sempre `conta_id` a partir de `transacao.conta.id` — está correto, mas recebe sempre o id
antigo porque o service nunca o substitui. O repositório (`TransacaoRepo.update`,
`backend/src/repos/Transacao/TransacaoRepo.ts:202-298`) já está preparado para persistir uma mudança
de FK — também não é a causa. O bug está isolado às linhas 470-499 do service.

**Efeito colateral:** como `updatedTransacao.conta` (e equivalentes) nunca mudam, o STEP 3
(`applyEntradaSaidaImpact`/`applyCreditoImpact`/etc., linhas 504-531) aplica sempre o impacto de saldo
na conta/cartão antigos — não há saldo duplicado ou incorreto, só a associação que nunca muda, exatamente
como reportado.

**Inventário (superfícies afetadas por este único bug estrutural):**

- **A.** `conta` — campo testado e reportado na issue (transações Entrada/Saída/Crédito/Reembolso).
- **B.** `cartaoCredito` — mesmo padrão de bug, mesmo bloco de código (transações Crédito/Reembolso).
- **C.** `contaDestino` — mesmo padrão de bug (Despesa Mensal/Semanal/Anual).
- **D.** `contaPoupanca` — mesmo padrão de bug (Poupança).

Nenhum teste cobre `updateTransacao` hoje: `TransacaoService.spec.ts` só testa o guard
`isPagamentoCartao` de `applyReembolsoImpact`/`revertReembolsoImpact`. A CI também não corre `npm test`
(ver `CLAUDE.md`), pelo que este bug não seria apanhado automaticamente.

**Escala:** 1 método (4 blocos de código repetidos, mesmo padrão) + 1 ficheiro de testes.

## 2. Resultado pretendido

Ao editar uma Transação e escolher uma Conta (ou Cartão de Crédito, Conta Destino, Conta Poupança)
diferente, a nova associação é persistida e o impacto de saldo é aplicado à entidade correta — igual
ao que já acontece hoje para `categoria`.

**Decisões:**

- **Corrigir os quatro campos relacionais (`conta`, `cartaoCredito`, `contaDestino`,
  `contaPoupanca`), não só `contaId`.** A issue só reporta e testa a mudança de conta, mas a
  investigação confirma que os quatro sofrem exatamente do mesmo bug estrutural, no mesmo bloco de
  código, pelo mesmo motivo. **Alternativa rejeitada:** corrigir só `contaId`, por ser o único caso
  citado na issue — rejeitada porque deixaria três bugs já diagnosticados, idênticos, no mesmo
  método, a léguas de distância de uma nova issue; o custo adicional de os corrigir agora é mínimo
  (mesma forma de código já usada para `categoria`).
- **Seguir exatamente o padrão já usado para `categoria`** (ler o id do DTO, ir buscar a entidade ao
  repositório, falhar com `Result.fail` se não existir) em vez de introduzir uma abstração nova — é o
  padrão que o resto do método já usa, com os mesmos repositórios (`contaRepo`, `cartaoCreditoRepo`)
  já injetados no service.
- **Mensagens de erro alinhadas com as já usadas no resto do ficheiro/contexto**, para consistência:
  `'Target Account not found'` (conta, como em `createEntrada`), `'Target Credit Card not found'`
  (cartão, como em `createCredito`), `'Destination Account not found'` (contaDestino, como em
  `TransacaoDespesasRecorrentesService`), `'Savings Account not found'` (contaPoupanca, idem).

## 3. Implementação

Fase única — a correção é um só bloco coeso no mesmo método, pequeno o suficiente para um único
commit revisável.

1. **`backend/src/services/Transacao/TransacaoService.ts`** — em `updateTransacao`, STEP 2 (depois do
   bloco de `categoria`, linha 482, antes da chamada a `Transacao.create` na linha 484): acrescentar
   quatro blocos análogos ao de `categoria`, um por campo:
   - `conta` a partir de `updateDTO.contaId` via `this.contaRepo.findById(...)`, falha
     `'Target Account not found'`.
   - `cartaoCredito` a partir de `updateDTO.cartaoCreditoId` via
     `this.cartaoCreditoRepo.findById(...)`, falha `'Target Credit Card not found'`.
   - `contaDestino` a partir de `updateDTO.contaDestinoId` via `this.contaRepo.findById(...)`, falha
     `'Destination Account not found'`.
   - `contaPoupanca` a partir de `updateDTO.contaPoupancaId` via `this.contaRepo.findById(...)`,
     falha `'Savings Account not found'`.

   Depois, na chamada a `Transacao.create` (linhas 484-496), substituir `existing.conta`,
   `existing.cartaoCredito`, `existing.contaDestino`, `existing.contaPoupanca` pelas quatro variáveis
   acima (cada uma por defeito igual a `existing.<campo>` quando o id correspondente não vem no
   update, exatamente como já acontece para `categoria`).

2. **`backend/src/services/Transacao/tests/TransacaoService.spec.ts`** — acrescentar um novo
   `describe('TransacaoService — updateTransacao aplica novas associações', ...)` com dois testes que
   falham contra o código atual e passam depois da correção:
   - **Conta (reprodução direta da issue #52):** uma transação `Saída` existente associada a
     `contaA`; `updateTransacao(id, { contaId: contaB.id })`; verificar que `contaRepo.findById` é
     chamado com o id de `contaB` durante o STEP 2 e que a transação passada a
     `transacaoRepo.update` (e o DTO devolvido) tem `conta.id === contaB.id`, não `contaA.id`.
   - **Cartão de crédito:** uma transação `Crédito` (`isPagamentoCartao: false`) existente associada
     a `cartaoA`; `updateTransacao(id, { cartaoCreditoId: cartaoB.id })`; mesma verificação para
     `cartaoCredito.id`.

   `contaDestino`/`contaPoupanca` (Despesa Recorrente/Poupança) partilham o mesmo bloco de código
   corrigido mas dependem de `transacaoDespesasRecorrentesService` para o impacto de saldo — cobri-los
   exigiria mockar esse serviço delegado, que hoje não tem testes próprios; ver §5 Riscos.

## 4. Verificação

- `cd backend && npm run build` — sem baseline de erros pré-existente a esta data.
- `cd backend && npm run lint` — sem baseline de erros/warnings pré-existente a esta data.
- `cd backend && npm test` — sem baseline de testes a falhar previamente; os dois novos testes devem
  falhar contra o código atual (não corrigido) e passar depois da correção.
- Verificação manual (não automatizável nesta sessão, ver `RESULT.md` §4): editar uma transação
  Entrada/Saída existente, mudar a conta associada, guardar, reabrir e confirmar que a nova conta
  aparece selecionada e que o saldo foi ajustado na conta correta (débito/crédito revertido na conta
  antiga, aplicado na nova).

## 5. Riscos

- **Risco:** a correção nos quatro campos altera o comportamento de `contaDestino`/`contaPoupanca` em
  fluxos (Despesa Recorrente, Poupança) sem teste automatizado dedicado a essa combinação. **Mitigação:**
  o bloco de código é estruturalmente idêntico ao de `conta`/`cartaoCredito` (cobertos pelos novos
  testes) e ao já existente para `categoria`; risco residual fica registado em `RESULT.md` como
  verificação manual não executada.
- **Risco:** `updateDTO.contaId`/`cartaoCreditoId`/`contaDestinoId`/`contaPoupancaId` apontarem para
  um id que já não existe (entretanto eliminado). **Mitigação:** cada bloco falha explicitamente com
  `Result.fail` antes de chegar a `Transacao.create`, tal como já acontece hoje para `categoriaId`
  inválido — nenhum comportamento novo de erro introduzido.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Corrige `updateTransacao` para aplicar as novas associações (conta/cartão/contaDestino/contaPoupanca) | `TransacaoService.ts`, `TransacaoService.spec.ts` | A, B, C, D |

## 7. Fora de âmbito / handoff

- **Testes automatizados dedicados a `contaDestino`/`contaPoupanca` em `updateTransacao`** — mesmo
  bug, mesma correção, mas exigiria mockar `ITransacaoDespesasRecorrentesService` por inteiro; fora
  do âmbito para manter o commit pequeno e focado no bug reportado. Fica para quem tocar a seguir em
  `TransacaoDespesasRecorrentesService`.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
