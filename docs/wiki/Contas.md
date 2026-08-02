# Contas

Contexto `Conta`: contas bancárias domiciliadas num [[Bancos|Banco]], com saldo próprio
(`Dinheiro`) e usadas como destino/origem de [[Transacoes|transações]] e como conta de pagamento
de [[Cartoes-de-Credito|cartões de crédito]].

## Backend

`363befb` (#2 #4) implementou as contas, no mesmo commit que corrigiu comportamento de
transações — as duas features nasceram acopladas porque uma transação sempre referencia uma
conta.

`cab1499` corrigiu a restrição de unicidade (`unique`) tanto de contas como de cartões, que
estava a causar conflitos.

## Frontend

- `2bfeb31` (#16) — implementação do frontend das contas (listar/criar/editar).
- `d9b7849` (#14) — adição das contas ao dashboard.
- `6510f2b` (#14) — correção dos valores no dashboard e adição da seleção de contas/cartões nos
  bancos, para que o cálculo de saldo do banco considere corretamente contas e cartões associados.

## Ver também

- [[Bancos]] — agregado pai.
- [[Transacoes]] e [[Cartoes-de-Credito]] — dependem de `Conta`.
