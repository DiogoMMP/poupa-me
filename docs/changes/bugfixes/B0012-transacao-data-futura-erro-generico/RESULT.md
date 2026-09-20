# B0012 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/data-futura-e-banco-nao-selecionado` (partilhado com o B0013) |
| **Estado** | Implementado |
| **Build** | `cd frontend && npm run build` — sem erros |
| **Testes** | `cd frontend && npm test` — 13/13 sucesso (era 10/10; +3 testes novos em `transacao-error.util.spec.ts`) |
| **Commits** | Ainda não commitado nesta sessão (ver próximo passo) |

## 1. O que foi fechado

- **A.** `DatePickerComponent` — corrigido. Novo `@Input() maxDate`; datas depois de `maxDate` ficam
  visualmente desativadas (`disabled`) e não são selecionáveis (rato ou teclado).
- **B–E.** `transacoes-criar-entradas/-saidas/-credito/-reembolso.view-model.ts` — corrigido. O
  callback de erro passou a ler `err: HttpErrorResponse` e usa `mapTransacaoErrorMessage` em vez de
  uma string fixa.
- **F.** `transacoes-editar.view-model.ts` — corrigido, mesmo padrão.

Os 5 templates de criação/edição passaram a ligar `[maxDate]="todayIso"` ao `<app-date-picker>`
(`todayIso` exposto via `getTodayIso()`, novo em `date-formatter.util.ts`).

## 2. Pontos a precisar de decisão

Nenhum surgiu durante a implementação — o âmbito (só mensagem clara + bloqueio de datas futuras no
date-picker, sem tocar em Despesa Recorrente/Poupança) já tinha sido decidido e aprovado no plano.

## 3. Desvios do plano aprovado

Nenhum. Implementação seguiu exatamente o README aprovado.

## 4. Não verificado

- **Verificação manual num browser** — não disponível nesta sessão (sem backend/frontend/browser a
  correr). Consequência operacional: a lógica de `mapTransacaoErrorMessage` está coberta por testes
  unitários que reproduzem o corpo de erro real do backend (`HttpErrorResponse` com `{error: '...'}`),
  e o bloqueio de datas no `DatePickerComponent` é lógica pura (sem dependências externas), mas a
  confirmação visual do calendário (dias futuros esbatidos, clique/teclado sem efeito) só fica feita
  quando alguém abrir a app manualmente.

## 5. Como correr a verificação

- `cd frontend && npm run build` — prova que a alteração compila sem quebrar tipos.
- `cd frontend && npm test` — os 3 testes novos em `transacao-error.util.spec.ts` cobrem: mensagem
  conhecida → texto PT-PT; mensagem desconhecida → fallback; erro sem corpo `HttpErrorResponse` →
  fallback.

## 6. Inventário de alterações

| Ficheiro | Tipo |
| :--- | :--- |
| `frontend/src/app/shared/utils/date-formatter.util.ts` | alterado (+`getTodayIso`) |
| `frontend/src/app/shared/components/date-picker/date-picker.component.ts` | alterado (+`maxDate`) |
| `frontend/src/app/shared/components/date-picker/date-picker.component.html` | alterado |
| `frontend/src/app/shared/components/date-picker/date-picker.component.css` | alterado |
| `frontend/src/app/features/transacoes/utils/transacao-error.util.ts` | novo |
| `frontend/src/app/features/transacoes/utils/transacao-error.util.spec.ts` | novo |
| `frontend/src/app/features/transacoes/components/criar-entradas/transacoes-criar-entradas.view-model.ts` | alterado |
| `frontend/src/app/features/transacoes/components/criar-entradas/transacoes-criar-entradas.component.ts` | alterado |
| `frontend/src/app/features/transacoes/components/criar-entradas/transacoes-criar-entradas.component.html` | alterado |
| `frontend/src/app/features/transacoes/components/criar-saidas/transacoes-criar-saidas.view-model.ts` | alterado |
| `frontend/src/app/features/transacoes/components/criar-saidas/transacoes-criar-saidas.component.ts` | alterado |
| `frontend/src/app/features/transacoes/components/criar-saidas/transacoes-criar-saidas.component.html` | alterado |
| `frontend/src/app/features/transacoes/components/criar-credito/transacoes-criar-credito.view-model.ts` | alterado |
| `frontend/src/app/features/transacoes/components/criar-credito/transacoes-criar-credito.component.ts` | alterado |
| `frontend/src/app/features/transacoes/components/criar-credito/transacoes-criar-credito.component.html` | alterado |
| `frontend/src/app/features/transacoes/components/criar-reembolso/transacoes-criar-reembolso.view-model.ts` | alterado |
| `frontend/src/app/features/transacoes/components/criar-reembolso/transacoes-criar-reembolso.component.ts` | alterado |
| `frontend/src/app/features/transacoes/components/criar-reembolso/transacoes-criar-reembolso.component.html` | alterado |
| `frontend/src/app/features/transacoes/components/editar/transacoes-editar.view-model.ts` | alterado |
| `frontend/src/app/features/transacoes/components/editar/transacoes-editar.component.ts` | alterado |
| `frontend/src/app/features/transacoes/components/editar/transacoes-editar.component.html` | alterado |
| `docs/changes/bugfixes/B0012-transacao-data-futura-erro-generico/README.md` | novo |
| `docs/changes/bugfixes/B0012-transacao-data-futura-erro-generico/RESULT.md` | novo |
