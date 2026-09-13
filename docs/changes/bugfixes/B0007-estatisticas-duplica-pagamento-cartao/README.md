# B0007 — Estatísticas duplicam a despesa: compra a crédito + pagamento do cartão

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/estatisticas-duplica-pagamento-cartao` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | 1 método de serviço, backend (`Estatisticas`) |
| **Verificação** | `npm run build` (backend) + `npm test` (backend) |

## 1. Situação

Issue [#33](https://github.com/DiogoMMP/poupa-me/issues/33) — "o gráfico está a aparecer com o
pagamento do cartão por exemplo, quando o dinheiro já foi saindo a crédito": o gráfico/estatísticas
conta a mesma despesa duas vezes — uma vez quando cada compra é feita a crédito, e outra vez quando o
cartão é pago (o registo automático "Pagamento X").

**Evidência:**

Quando um cartão é pago, `TransacaoPagarCartaoRepo.pagarCartao`
([`TransacaoPagarCartaoRepo.ts:114-133`](../../../../backend/src/repos/Transacao/TransacaoPagarCartaoRepo.ts))
cria um registo `TransacaoEntity` com `tipo: 'Crédito'` e `isPagamentoCartao: true`, representando o
pagamento em si (não uma nova compra). O domínio documenta explicitamente o propósito deste campo
([`Transacao.ts:25-27`](../../../../backend/src/domain/Transacao/Entities/Transacao.ts)):

```ts
// True for the auto-generated "Pagamento X" record created when a credit card is paid off. Its valor already
// reflects money movements applied directly by the payment flow, so it must never carry its own balance impact.
isPagamentoCartao?: boolean;
```

Esse contrato ("nunca deve ter impacto próprio no saldo") já está garantido em 3 métodos de
`TransacaoService` ([`TransacaoService.ts:299-411`](../../../../backend/src/services/Transacao/TransacaoService.ts),
implementados na F0001), que fazem `if (transacao.isPagamentoCartao) return Result.ok<void>();` antes
de mexer em qualquer saldo. Mas esse cuidado nunca chegou ao cálculo de **Estatísticas**.

`EstatisticasService.getEstatisticas`
([`EstatisticasService.ts:61-98`](../../../../backend/src/services/Estatisticas/EstatisticasService.ts))
busca todas as transações do cartão via `findAllCartaoTransactions` (que devolve tanto as compras
como o registo de pagamento — corretamente, porque essa mesma query alimenta a listagem de
transações do cartão, onde o "Pagamento X" **deve** continuar a aparecer) e agrega-as sem excluir
`isPagamentoCartao`:

```ts
const totalOut = sumValor(contasNoMes, ['Saída']) + sumValor(cartoesNoMes, ['Crédito']);
...
const despesasCartao = cartoesNoMes.filter(t => ['Crédito'].includes(t.tipo.value));
```

Como o registo de pagamento também tem `tipo: 'Crédito'`, passa por este filtro e é somado outra vez
— junto de cada compra individual que já tinha contribuído para o mesmo `totalOut`, para `categorias`
e para `historicoDiario`. Resultado: a despesa de um período de cartão aparece nas estatísticas com
(compras + pagamento), em vez de só (compras).

**Inventário (superfícies afetadas):**

- **A.** `EstatisticasService.getEstatisticas` — `totalOut` (cashflow mensal).
- **B.** `EstatisticasService.getEstatisticas` — `despesasCartao`/`categorias` (agregação por
  categoria).
- **C.** `EstatisticasService.getEstatisticas` — `historicoDiario` (histórico diário).

As três derivam da mesma variável `cartoesNoMes`; a correção é um único ponto no código que afeta os
três.

**Escala:** 1 ficheiro, 1 método.

**Verificado que a correção não pode ir no repo:** `findAllCartaoTransactions`
([`TransacaoCartaoQueryRepo.ts`](../../../../backend/src/repos/Transacao/TransacaoCartaoQueryRepo.ts))
também alimenta `TransacaoCartaoQueryController`/`TransacaoCartaoQueryService`
(`GET` de transações de um cartão, usado na listagem/extrato) — excluir `isPagamentoCartao` a esse
nível esconderia o "Pagamento X" também da listagem, onde o utilizador precisa de o ver. A correção
tem de ficar isolada em `EstatisticasService`.

## 2. Resultado pretendido

O cashflow mensal, a agregação por categoria e o histórico diário das Estatísticas refletem apenas as
compras a crédito reais — o registo automático "Pagamento X" deixa de ser somado. O extrato/listagem
de transações do cartão continua a mostrar o "Pagamento X" normalmente (não tocado por este fix).

**Decisões:**

- **Filtrar `isPagamentoCartao` uma única vez, logo a seguir a `cartoesNoMes`, em vez de em cada um
  dos 3 usos (`totalOut`, `despesasCartao`, `historicoDiario`).** Um único ponto de filtragem elimina
  a possibilidade de esquecer um dos três ao corrigir, e mantém `cartoesNoMes` como a lista "pronta a
  agregar" que já é hoje.
  **Alternativa rejeitada:** adicionar `.andWhere('t.is_pagamento_cartao = false')` na query SQL de
  `TransacaoCartaoQueryRepo`. Rejeitada porque esse repo é partilhado com a listagem/extrato de
  transações do cartão, que precisa de continuar a mostrar o registo de pagamento.
- **Usar o getter de domínio `transacao.isPagamentoCartao`** (já tipado em `Transacao`, sem
  necessidade de cast) em vez de aceder a um campo cru do DTO — `cartaoTransacoes`/`cartoesNoMes` são
  `Transacao[]` (entidades de domínio), não DTOs.

## 3. Implementação

1. **`backend/src/services/Estatisticas/EstatisticasService.ts`** — em `getEstatisticas`, logo após o
   filtro de intervalo de datas que produz `cartoesNoMes` (linha 61-64), encadear um `.filter(t =>
   !t.isPagamentoCartao)` (ou aplicar o filtro dentro do mesmo `.filter` já existente). `totalOut`
   (linha 71), `despesasCartao` (linha 95) e `historicoDiario` (linhas 121-122, via `despesasCartao`)
   passam a derivar da lista já sem o registo de pagamento.
2. **`backend/src/services/Estatisticas/tests/EstatisticasService.spec.ts`** (novo) — segue o padrão
   de `backend/src/services/Transacao/tests/TransacaoService.spec.ts` (mocks de `jest.Mocked<...Repo>`
   injetados diretamente no construtor, sem `typedi`). Casos:
   - Uma compra a crédito (`isPagamentoCartao: false`, `tipo: 'Crédito'`) + o registo de pagamento
     correspondente (`isPagamentoCartao: true`, `tipo: 'Crédito'`, mesmo valor) no mesmo mês →
     `cashflowMensal.totalOut` deve refletir só a compra, não (compra + pagamento).
   - O mesmo par de transações → `categorias` deve ter um único total, igual ao valor da compra.
   - O mesmo par → `historicoDiario` não deve somar o valor do pagamento no dia em que o cartão foi
     pago.
   Este teste falha contra o código atual (soma as duas) e passa depois da correção do ponto 1 —
   prova a correção do bug da issue #33.

Fase única — a correção é um único ponto de código; o teste acompanha-a no mesmo commit.

## 4. Verificação

- `cd backend && npm run build` — sem baseline de erros/warnings pré-existente a esta data.
- `cd backend && npm test` — sem baseline de testes a falhar previamente; o novo
  `EstatisticasService.spec.ts` deve passar.
- Verificação manual (não automatizável nesta sessão, ver `RESULT.md` §4): com dados reais, pagar um
  cartão com compras no período e confirmar no ecrã de Estatísticas que o total de despesas não
  duplica o valor do pagamento.

## 5. Riscos

- **Risco:** algum outro consumidor de `EstatisticasService.getEstatisticas` espera o comportamento
  atual (incluindo o pagamento). **Mitigação:** grep confirmou que `getEstatisticas` só é chamado a
  partir de `EstatisticasController` (endpoint de estatísticas) — sem outro consumidor.
- **Risco:** cartões com um `Reembolso` associado a `isPagamentoCartao` (caso já tratado no
  `TransacaoService` para o impacto de saldo) também poderem duplicar em `totalIn`/`sumValor(...,
  ['Reembolso'])`. **Mitigação:** fora do âmbito reportado na issue #33 (que fala especificamente do
  pagamento aparecendo como despesa/"Crédito"); a registar como ponto em aberto no `RESULT.md` §2 se
  confirmado ao implementar, sem expandir este fix sem validação.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Exclui `isPagamentoCartao` da agregação de Estatísticas | `EstatisticasService.ts`, `EstatisticasService.spec.ts` (novo) | A, B, C |

## 7. Fora de âmbito / handoff

- **Duplicação equivalente em `totalIn`/`Reembolso`** (ver Risco acima) — só corrigida aqui se o teste
  da Fase 3 a confirmar como reprodutível; caso contrário fica para uma issue separada.
- **Verificação manual ponta-a-ponta com dados reais** — não disponível nesta sessão.
