# Bancos

Contexto `Banco`: entidade agregadora que agrupa contas e cartões de crédito de uma mesma
instituição, e serve de âmbito de seleção para o dashboard.

## Backend

`24d99c1` (#1 #7) implementou as entidades bancárias e o endpoint para obter o dashboard do
banco — o endpoint que devolve dados agregados (saldo, contas, cartões) para um banco
selecionado.

## Frontend

- `85844c2` (#14) — criar banco.
- `5cb048f` (#14) — editar banco.
- `bdcca0b` (#14) — seleção de bancos no dashboard.
- `4f5db6f` (#14) — a seleção de banco foi movida para o header, para poder ser reutilizada em
  várias páginas em vez de ficar presa ao dashboard (decisão de arquitetura frontend: estado de
  banco selecionado como serviço cross-feature — ver `services/selected-banco` em
  [[Estrutura]]).
- `5783b09` (#14) — implementação da listagem de bancos no frontend, junto com correções gerais
  de backend que foram surgindo durante o desenvolvimento do dashboard.

## Ver também

- [[Contas]] e [[Cartoes-de-Credito]] — agregados que pertencem a um banco.
- [[Dashboard-e-Estatisticas]] — consumidor principal da seleção de banco.
