# Despesas recorrentes

Contexto `DespesaRecorrente`: um "molde" que gera [[Transacoes|transações]] automaticamente
(nota no próprio `docs/domain_model.puml`: "Molde para criar transações automáticas"). É o
agregado com mais commits de correção isolados do repositório, sinal de que é a área de negócio
mais complexa/frágil.

## Implementação inicial

`fd085a9` (#13) implementou as despesas recorrentes no backend. `dff5f62` (#23) implementou o
lado correspondente no frontend.

## Processamento e conclusão

O processamento de despesas recorrentes (transformar o molde em transações reais, geridas por
`agenda`/`agendash` — ver [[Estrutura]]) passou por várias rondas de correção:

- `8e5737f` — alterações no backend referentes a despesas mensais e recorrentes.
- `b81fb32` — correções na conclusão ("marcar como paga/ocorrida") de despesas recorrentes.
- `8b96981` — correções nos `GET`s de despesas recorrentes e na criação de reembolsos associados.
- `54d9c5b` — correção específica no fluxo de concluir uma despesa recorrente do tipo poupança
  (savings, um tipo distinto de despesa/receita agendada).
- `e37749b` (#35) — nova correção do erro ao concluir poupança, e mudança de regra: despesas
  recorrentes passaram a poder ser criadas com valor definido mesmo sem dia definido (antes
  aparentemente exigiam ambos).
- `4e90cd0` — correções no serviço de import (ver [[Transacoes]]) e nos filtros do frontend de
  despesas recorrentes.

## Periodicidade

`f713077` (#32) adicionou suporte a despesas recorrentes semanais e anuais (além das mensais já
existentes), com a opção de serem "imediatas" (gerar a primeira ocorrência de imediato em vez de
esperar pelo próximo ciclo).

## Filtros e período

`545f02d` (#36) corrigiu os filtros de período e os endpoints, para que o "get all" respeitasse
os mesmos filtros aplicados noutros endpoints — inconsistência entre listagem completa e listagem
filtrada.

## Ver também

- [[Transacoes]] — o que é efetivamente gerado a partir de uma despesa recorrente.
- [[Estrutura]] — `agenda`/`agendash` como mecanismo de scheduling.
