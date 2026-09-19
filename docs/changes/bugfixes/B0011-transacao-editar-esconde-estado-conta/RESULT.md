# B0011 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/transacao-editar-nao-muda-conta` |
| **Estado** | Implementado |
| **Build** | `cd frontend && npm run build` — sem erros |
| **Testes** | Não há testes unitários para este componente/template; nenhum adicionado (mudança é só de visibilidade condicional, sem lógica nova a testar) |
| **Commits** | Ainda não commitado nesta sessão (ver próximo passo) |

## 1. O que foi fechado

- **Único item.** O campo "Estado" em `transacoes-editar.component.html` passou a estar dentro do
  mesmo `ng-container` que já expõe `transacao`, com `*ngIf="transacao && (transacao.tipo ===
  'Crédito' || transacao.tipo === 'Reembolso')"` — a mesma condição já usada para o seletor "Cartão"
  no mesmo template. Deixa de aparecer para transações de conta (Entrada/Saída/etc.).

## 2. Pontos a precisar de decisão

Nenhum surgiu durante a implementação.

## 3. Desvios do plano aprovado

Nenhum.

## 4. Não verificado

- **Verificação manual num browser** — não disponível nesta sessão (exigiria sessão autenticada e uma
  transação real de cada tipo). Consequência operacional: a condição reutiliza literalmente a mesma
  expressão já usada e já a funcionar corretamente hoje para o seletor "Cartão" no mesmo template
  (`transacao.tipo === 'Crédito' || transacao.tipo === 'Reembolso'`), pelo que o risco de regressão é
  baixo, mas a confirmação visual (campo desaparece/aparece corretamente) só fica feita quando alguém
  abrir a app manualmente.

## 5. Como correr a verificação

- `cd frontend && npm run build` — prova que o template compila sem erros.
- Verificação manual: abrir "Editar" numa transação de conta (Entrada/Saída) e confirmar que "Estado"
  não aparece; abrir "Editar" numa transação de cartão (Crédito/Reembolso) e confirmar que "Estado"
  continua a aparecer e a gravar corretamente.

## 6. Inventário de alterações

| Ficheiro | Tipo |
| :--- | :--- |
| `frontend/src/app/features/transacoes/components/editar/transacoes-editar.component.html` | alterado |
| `docs/changes/bugfixes/B0011-transacao-editar-esconde-estado-conta/README.md` | novo |
| `docs/changes/bugfixes/B0011-transacao-editar-esconde-estado-conta/RESULT.md` | novo |
