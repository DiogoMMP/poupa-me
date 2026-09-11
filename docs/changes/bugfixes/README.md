# Índice de bugfixes

| ID | Título | Estado | Data | Branch | Itens em aberto |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [B0001](B0001-dashboard-banco-endpoint-404/README.md) | Endpoint errado no pedido do dashboard de um banco ([resultado](B0001-dashboard-banco-endpoint-404/RESULT.md)) | Implementado | 2026-09-05 | `fix/dashboard-banco-endpoint-404` | Infraestrutura de testes do frontend (`karma`/`jasmine`) em falta em `package.json` — `npm test` continua a falhar num checkout limpo até isso ser corrigido |
| [B0002](B0002-admin-cards-nome-utilizador-banco/README.md) | Cards de Admin mostram nome (id) em vez do id em bruto ([resultado](B0002-admin-cards-nome-utilizador-banco/RESULT.md)) | Implementado | 2026-09-06 | `fix/dashboard-banco-endpoint-404` | Mesmo gap de infraestrutura de testes do B0001 (`karma`/`jasmine` em falta em `package.json`); verificação manual ponta-a-ponta não executada nesta sessão |
| [B0003](B0003-correcoes-revisao-coderabbit-pr75/README.md) | Corrige os 3 findings reais da revisão do CodeRabbit no PR #75 ([resultado](B0003-correcoes-revisao-coderabbit-pr75/RESULT.md)) | Implementado | 2026-09-11 | `fix/dashboard-banco-endpoint-404` | Regras já existentes com combinações mes/diaDoMes inválidas não auditadas (sem acesso a BD de produção); verificação manual ponta-a-ponta não executada nesta sessão |
