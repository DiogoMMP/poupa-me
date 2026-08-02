# Cartões de crédito

Contexto `CartaoCredito`: cartão associado a uma [[Contas|conta]] de pagamento, com um ciclo de
faturação próprio (Value Object `Periodo`) e limite/saldo em `Dinheiro`.

## Backend

- `dc30038` (#8 #9) implementou o ciclo do cartão (período de faturação) e o pagamento do mesmo
  — a lógica central de "quando fecha a fatura" e "como é liquidada".
- `05be535` (#2 #3 #4 #5 #11) trouxe correções a todo o domínio (ids mais amigáveis —
  "domain id" — em vez de UUIDs crus expostos) e, no mesmo commit, a implementação inicial do
  cartão de crédito.
- `af7b70b` (#21) adicionou listar/criar/editar cartões, e corrigiu o endpoint de extrato do
  cartão e o import (ver [[Transacoes]] para o import de CSV).
- `b5eb9bb` (#22) implementou o botão para pagar a fatura do cartão diretamente pela UI.

## Frontend / Dashboard

- `1734391` (#14) — adição dos cartões ao dashboard.
- `6510f2b` (#14) — correção dos valores dos cartões no dashboard e seleção de contas/cartões nos
  bancos para o cálculo de saldo agregado.
- `cab1499` — correção da restrição `unique` partilhada com [[Contas|contas]].

## Ver também

- [[Contas]] — conta de pagamento do cartão.
- [[Transacoes]] — transações que afetam o limite do cartão.
