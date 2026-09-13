# B0007 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/estatisticas-duplica-pagamento-cartao` |
| **Estado** | Implementado |
| **Build** | `npm run build` (backend) — sem erros |
| **Testes** | `npm test` (backend) — 5 suites / 17 testes, sucesso (era 4 suites / 14 testes antes; +1 suite nova com 3 testes) |
| **Commits** | Ainda não commitado nesta sessão (ver §6 Próximo passo) |

## 1. O que foi fechado

- **A.** `cashflowMensal.totalOut` — corrigido. Deixa de somar o registo "Pagamento X".
- **B.** `categorias` — corrigido. A agregação por categoria deixa de duplicar o total quando há um
  pagamento no mesmo período.
- **C.** `historicoDiario` — corrigido. O dia em que o cartão foi pago não soma o valor do pagamento.

Os três derivam do mesmo filtro em `cartoesNoMes` (§3.1 do README), implementado como planeado.

## 2. Pontos a precisar de decisão

- **Duplicação equivalente em `totalIn`/`Reembolso`** (Risco identificado no README §5): não
  confirmada como reprodutível — não existe hoje nenhum fluxo no código que gere um `Reembolso` com
  `isPagamentoCartao: true` (`TransacaoPagarCartaoRepo.pagarCartao` só cria registos `tipo: 'Crédito'`
  para o pagamento). **Consequência operacional:** nenhuma ação necessária agora; fica só como nota
  para o caso de um futuro fluxo vir a gerar um `Reembolso` de pagamento.

## 3. Desvios do plano aprovado

Nenhum. A implementação seguiu o §3 do README ponto a ponto.

## 4. Não verificado

- **Verificação manual com dados reais** (pagar um cartão com compras no período e confirmar no ecrã
  de Estatísticas) — não disponível nesta sessão (sem base de dados/backend a correr). Consequência
  operacional: a correção está coberta pelos 3 testes unitários (que reproduzem exatamente o cenário
  da issue #33 com mocks), mas a confirmação visual no gráfico real só fica feita quando alguém testar
  a app com dados verdadeiros.

## 5. Como correr a verificação

- `cd backend && npm run build` — compila o backend; prova que não há erros de tipos introduzidos.
- `cd backend && npm test` — corre a suite Jest. Os 3 testes novos em
  `EstatisticasService.spec.ts` reproduzem o cenário da issue #33 (uma compra + o pagamento
  correspondente no mesmo mês) e falham contra o código anterior (somavam os dois) — prova direta da
  correção do bug.

## 6. Inventário de alterações

| Ficheiro | Tipo |
| :--- | :--- |
| `backend/src/services/Estatisticas/EstatisticasService.ts` | alterado |
| `backend/src/services/Estatisticas/tests/EstatisticasService.spec.ts` | novo |
| `docs/changes/bugfixes/B0007-estatisticas-duplica-pagamento-cartao/README.md` | novo |
| `docs/changes/bugfixes/B0007-estatisticas-duplica-pagamento-cartao/RESULT.md` | novo |
