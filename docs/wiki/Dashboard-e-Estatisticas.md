# Dashboard e estatísticas

A tela inicial (dashboard) e a aba de estatísticas, as duas superfícies que agregam dados de
todos os outros contextos ([[Bancos]], [[Contas]], [[Cartoes-de-Credito]], [[Transacoes]],
[[Despesas-Recorrentes]]).

## Dashboard

`5783b09` (#14) implementou o frontend do dashboard (inicialmente com valores de exemplo) e a
listagem de bancos, junto com correções de backend que foram surgindo durante essa integração.
As peças foram sendo adicionadas incrementalmente por [[Bancos|banco]] (`bdcca0b`, `4f5db6f`),
[[Contas|conta]] (`d9b7849`) e [[Cartoes-de-Credito|cartão]] (`1734391`, `6510f2b`), até
`807d0d0` (#14) finalizar a aba com o botão de nova transação e a zona de últimas transações.

## Estatísticas

`1c48b7e` (#28 #29) implementou a aba de estatísticas, usando `@swimlane/ngx-charts` (ver
[[Estrutura]]) para os gráficos.

## Mobile

- `8134801` — otimização geral do frontend para mobile.
- `20c11a3` — correção de bugs de mobile especificamente na aba de estatísticas e em botões que
  não estavam clicáveis em ecrãs pequenos.
- `1c99478` — adição da tag de ícone para iOS (permite "adicionar ao ecrã principal" no iOS com
  ícone correto).

## Ver também

- [[Estrutura]] — stack de gráficos e diagrama de domínio consumido pelo dashboard.
- [[Deploy-e-Infraestrutura]] — testes em mobile via túnel ngrok no Docker Compose.
