# B0006 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/formato-data-periodo-cartao-credito` |
| **Estado** | Implementado |
| **Build** | `npm run build` (frontend) — sem erros/warnings; sem baseline pré-existente a comparar |
| **Testes** | `npm test` (frontend, Karma/ChromeHeadless) — 9/9 sucesso (era 8/8 antes; +1 teste novo no mapper); sem baseline de falhas pré-existente |
| **Commits** | Ainda não commitado nesta sessão (ver §6 Próximo passo) |

## 1. O que foi fechado

- **A.** `CartoesCreditoMapper.dataPropsToISOString` — corrigido. Passou a construir `yyyy-MM-dd`
  diretamente dos números, sem instanciar `Date`. Causa raiz do bug reportado no screenshot.
- **B.** `CartoesCreditoListViewModel.formatDate` — corrigido. Passou a fazer parse manual de
  `yyyy-MM-dd` em vez de `new Date(...)` + getters locais.
- **C.** `CartoesCreditoPagarViewModel.computeDefaultPeriodoISO` — corrigido. Manteve `Date` para a
  aritmética de calendário, mas trocou todos os getters/setters locais pelos equivalentes UTC.
- **D.** `DespesasRecorrentesGerarTransacaoComponent` (constructor) — corrigido. Substituído
  `today.toISOString().substring(0, 10)` por construção manual a partir de getters locais.

Todos os 4 pontos do inventário do README foram implementados exatamente como planeado, num único
commit (Fase única).

## 2. Pontos a precisar de decisão

Nenhum surgiu durante a implementação.

## 3. Desvios do plano aprovado

Nenhum. A implementação seguiu o §3 do README ponto a ponto.

## 4. Não verificado

- **Verificação manual ponta-a-ponta num browser** (abrir Editar Cartão de Crédito, confirmar
  `dd/MM/yyyy`, gravar e reabrir, conferir listagem, "Pagar Cartão" e "Gerar Transação" de despesa
  recorrente) — não disponível nesta sessão (sem backend/browser a correr). Consequência operacional:
  o comportamento está coberto por build + teste unitário do mapper, mas a experiência visual
  completa (incluindo os 3 pontos B/C/D, que não têm teste automatizado) só fica confirmada quando
  alguém abrir a app manualmente.

## 5. Como correr a verificação

- `cd frontend && npm run build` — compila a aplicação (browser + servidor SSR); prova que não há
  erros de tipos/compilação introduzidos pela mudança.
- `cd frontend && npm test` — corre a suite Karma/Jasmine em ChromeHeadless; o teste novo em
  `cartoes-credito.mapper.spec.ts` (`'should map periodo dates to plain yyyy-MM-dd strings, without
  time or timezone'`) falha contra o código anterior (produzia uma string `...T23:00:00.000Z`) e
  passa com a correção — prova direta do bug reportado.

## 6. Inventário de alterações

| Ficheiro | Tipo |
| :--- | :--- |
| `frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.ts` | alterado |
| `frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.spec.ts` | alterado (+1 teste) |
| `frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.view-model.ts` | alterado |
| `frontend/src/app/features/cartoes-credito/components/pagar/cartoes-credito-pagar.view-model.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/components/gerar-transacao/despesas-recorrentes-gerar-transacao.component.ts` | alterado |
| `docs/changes/bugfixes/B0006-formato-data-periodo-cartao-credito/README.md` | novo |
| `docs/changes/bugfixes/B0006-formato-data-periodo-cartao-credito/RESULT.md` | novo |
