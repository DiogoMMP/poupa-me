# B0010 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/transacao-editar-nao-muda-conta` (base: `develop`, atualizado antes de criar o branch) |
| **Estado** | Implementado |
| **Build** | `cd backend && npm run build` — sem erros (sem baseline de erros pré-existente) |
| **Lint** | `cd backend && npm run lint` — 51 erros/7 avisos pré-existentes, nenhum nos ficheiros tocados (`TransacaoService.ts`, `TransacaoService.spec.ts`) |
| **Testes** | `cd backend && npm test` — 20/20 sucesso (era 17/17 antes do B0010; +3 testes novos no total, todos confirmados a falhar contra o código correspondente antes de cada correção) |
| **Commits** | `83555c0` (correção original) + 1 commit adicional pós-revisão (ver §7) |

## 1. O que foi fechado

- **A.** `conta` — corrigido. Testado e confirmado (reprodução direta da issue #52).
- **B.** `cartaoCredito` — corrigido. Testado e confirmado.
- **C.** `contaDestino` — corrigido (mesmo bloco de código que A/B), sem teste automatizado dedicado —
  ver §4.
- **D.** `contaPoupanca` — corrigido (mesmo bloco de código que A/B), sem teste automatizado dedicado —
  ver §4.

Em `TransacaoService.updateTransacao` (STEP 2), os quatro campos relacionais passaram a seguir
exatamente o padrão já usado para `categoria`: se o id correspondente vier no `updateDTO`, a entidade é
resolvida via o repositório apropriado (`contaRepo`/`cartaoCreditoRepo`, já injetados no service) e
falha explicitamente com `Result.fail` se não existir; caso contrário mantém-se o valor da transação
existente.

## 2. Pontos a precisar de decisão

Nenhum surgiu durante a implementação — o âmbito alargado a `cartaoCredito`/`contaDestino`/
`contaPoupanca` (além do `conta` reportado na issue) já tinha sido decidido e aprovado no plano.

## 3. Desvios do plano aprovado

Nenhum. Implementação, mensagens de erro e testes seguiram exatamente o README aprovado.

## 4. Não verificado

- **Testes automatizados para `contaDestino`/`contaPoupanca`** — já previsto como fora de âmbito no
  README (§7): exercitar estes dois campos passa por `TransacaoDespesasRecorrentesService`, que hoje
  não tem testes próprios, e mocká-lo por inteiro só para este bugfix alargaria o âmbito sem necessidade.
  Consequência operacional: a correção do código está aplicada e é estruturalmente idêntica à de
  `conta`/`cartaoCredito` (cobertos pelos testes novos), mas mudar a conta destino/poupança de uma
  Despesa Recorrente ou Poupança ao editar só fica coberto por verificação manual.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão (sem
  backend/frontend/browser a correr). Consequência operacional: a correção está coberta por testes
  unitários que reproduzem o bug exato reportado na issue #52 (mudar a conta e o cartão ao editar), mas
  a confirmação visual no formulário de edição só fica feita quando alguém abrir a app manualmente.

## 5. Como correr a verificação

- `cd backend && npm run build` — prova que a alteração compila sem quebrar tipos.
- `cd backend && npm run lint` — prova que não foram introduzidos novos erros/avisos.
- `cd backend && npm test` — os dois testes novos em `TransacaoService.spec.ts`
  (`describe('TransacaoService — updateTransacao aplica novas associações (issue #52)', ...)`)
  reproduzem o bug exato: uma transação `Saída` associada a uma conta, editada para outra conta; e uma
  transação `Crédito` associada a um cartão, editada para outro cartão. Ambos falham contra o código
  anterior (confirmado manualmente nesta sessão via `git stash` do ficheiro de produção — a transação
  guardada continuava associada à conta/cartão antigos) e passam depois da correção.

## 6. Inventário de alterações

| Ficheiro | Tipo |
| :--- | :--- |
| `backend/src/services/Transacao/TransacaoService.ts` | alterado (correção original + correção adicional do §7) |
| `backend/src/services/Transacao/tests/TransacaoService.spec.ts` | alterado (+3 testes, +4 helpers de teste) |
| `docs/changes/bugfixes/B0010-transacao-editar-nao-muda-conta/README.md` | novo |
| `docs/changes/bugfixes/B0010-transacao-editar-nao-muda-conta/RESULT.md` | novo, atualizado no §7 |

## 7. Correção adicional (revisão de código, PR #85)

O CodeRabbit apontou, no comentário à linha `if (!c) return Result.fail<ITransacaoDTO>('Target
Account not found');`, que `updateTransacao` reverte o impacto da transação **antiga** (STEP 1
original) e **persiste** essa reversão (via `contaRepo.update`/`cartaoCreditoRepo.update` dentro de
`revertEntradaSaidaImpact`/`revertCreditoImpact`/etc.) **antes** de validar se os novos ids do
`updateDTO` (conta, cartão, contaDestino, contaPoupanca — e também `categoriaId`, que já tinha este
problema antes deste bugfix) realmente existem. Se um desses ids fosse inválido, a função devolvia
`Result.fail` e saía — mas a transação original nunca era atualizada (`transacaoRepo.update` só corre
no fim), deixando o saldo da conta antiga já alterado enquanto a transação continuava a apontar para
essa mesma conta: um `id` de conta inválido no pedido de update deixava a conta com o saldo
incorreto de forma permanente.

**Correção:** o método foi reordenado — toda a resolução/validação dos novos valores (categoria,
conta, cartão, contaDestino, contaPoupanca, e a construção de `Transacao.create`) passou a acontecer
**antes** de reverter o impacto da transação antiga. Só depois de existir uma `updatedTransacao`
válida é que se reverte o impacto antigo (agora STEP 2) e se aplica o novo (STEP 3); se qualquer
validação falhar, nenhuma conta/cartão chega a ser tocado.

Acrescentado o teste `'should not touch any balance when the new contaId is invalid, since
validation must happen before reverting the old impact'`, confirmado a falhar contra o código
anterior (o saldo da conta antiga era efetivamente alterado — 100 → 120 — antes da falha) e a passar
depois da correção.
