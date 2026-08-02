# Transações

Contexto `Transacao`: o agregado mais movimentado do sistema — entradas, saídas, crédito e
reembolso, ligado a uma [[Contas|conta]] ou [[Cartoes-de-Credito|cartão]], classificado por
[[Categorias-e-IA|categoria]].

## Backend

`b9a92e2` (#4) implementou as transações pela primeira vez. `363befb` (#2 #4) trouxe correções
subsequentes, no mesmo commit que introduziu [[Contas|contas]]. `05be535` (#2 #3 #4 #5 #11)
adicionou "domain id" mais amigável ao domínio inteiro, incluindo transações.

`212c458` (#15 #18) implementou a secção de transações no frontend com todos os tipos: entradas,
saídas, crédito e reembolso.

## Importação de CSV (Notion)

Uma feature recorrente ao longo do histórico: importar transações de um CSV exportado do Notion
(o utilizador aparentemente geria as finanças em Notion antes deste projeto).

- `8c77c7d` (#12) — implementação inicial da importação de CSV do Notion, no mesmo commit que
  corrigiu o workflow do Node (ver [[Deploy-e-Infraestrutura]]).
- `705ed54` — correção de um erro específico do mês de março no parsing do CSV.
- `6e8318c`, `9410e71`, `a3f48c6` — três rondas sucessivas de correções ao serviço de import,
  sinal de que o formato/parsing do CSV do Notion exigiu vários ajustes incrementais em vez de
  uma correção única.

## Dashboard

`807d0d0` (#14) finalizou a aba de dashboard com o botão de nova transação e a zona de últimas
transações. `ce47c53` e `3bacd47` corrigiram comportamento de transações no dashboard e no
frontend em geral (utilizadores incluídos em `ce47c53`).

## Ver também

- [[Contas]], [[Cartoes-de-Credito]] — destino/origem de uma transação.
- [[Categorias-e-IA]] — classificação de transações, incluindo categorização automática via IA.
- [[Despesas-Recorrentes]] — molde que gera transações automaticamente.
