# B0009 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/estatisticas-duplica-pagamento-cartao` (partilhada com o B0007, a pedido do utilizador) |
| **Estado** | Implementado |
| **Build** | `npm run build` (frontend) — sem erros |
| **Testes** | N/A — o projeto não tem specs para `estatisticas.component` (nem para nenhum outro componente de página com `.filter-panel`); alteração puramente estrutural de template, sem lógica nova |
| **Commits** | Ainda não commitado nesta sessão |

## 1. O que foi fechado

- **A.** `estatisticas.component.html` — corrigido. `.filter-panel` deixou de ser filho de
  `.page-actions` (linha flex horizontal) e passou a ser irmão de `.estatisticas_header`, em fluxo de
  bloco normal — mesma estrutura já usada em Transações e Despesas Recorrentes.

## 2. Pontos a precisar de decisão

Nenhum.

## 3. Desvios do plano aprovado

Nenhum.

## 4. Não verificado

- **Verificação manual num browser** (abrir Estatísticas, clicar em "Filtros", confirmar que o painel
  abre por baixo do botão) — não disponível nesta sessão. Consequência operacional: a correção segue
  exatamente o padrão estrutural já comprovado a funcionar noutros dois ecrãs do projeto, mas a
  confirmação visual final só fica feita quando alguém abrir a app.

## 5. Como correr a verificação

- `cd frontend && npm run build` — prova que a alteração de template compila sem erros.

## 6. Inventário de alterações

| Ficheiro | Tipo |
| :--- | :--- |
| `frontend/src/app/features/estatisticas/components/estatisticas.component.html` | alterado |
| `docs/changes/bugfixes/B0009-filtro-estatisticas-abre-de-lado/README.md` | novo |
| `docs/changes/bugfixes/B0009-filtro-estatisticas-abre-de-lado/RESULT.md` | novo |
