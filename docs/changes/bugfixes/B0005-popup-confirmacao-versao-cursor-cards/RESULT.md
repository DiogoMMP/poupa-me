# B0005 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/popup-confirmacao-versao-cursor-cards` |
| **Estado** | Implementado |
| **Build** | `npm run build` (frontend) — passa, sem baseline de erros/warnings pré-existente a esta data |
| **Testes** | `npm test` (frontend) — 8/8 passa; 0 testes novos (ver §2/§7 do README — sem specs pré-existentes para nenhum dos 8 consumidores tocados) |
| **Commits** | Ainda não commitado (ver `commit-push`) |

## 1. O que foi fechado

- **A.** Os 8 `confirm()` nativos do browser foram substituídos por `ConfirmDialogService` +
  `<app-confirm-dialog>` — um popup próprio da app, montado no layout junto a
  `<app-notifications>`. Pagamento de cartão usa `variant: 'default'`; as 7 eliminações usam
  `variant: 'danger'` (botão de confirmar vermelho). **Fechado.**
- **B.** O rodapé mostra `v1.0.0 · © 2026 Diogo Pereira. Todos os direitos reservados.` — versão lida
  de `frontend/package.json` via import direto em `environment.ts`/`environment.prod.ts`, sem
  duplicar o número à mão. **Fechado.**
- **C.** `cursor: pointer` removido da regra `.card--hover` (`_components.css` e `_layout.css`,
  estava duplicada nas duas) e da regra `.conta-card` (`dashboard.component.css`). O efeito visual de
  hover (cor/elevação) mantém-se — vem de `.card:hover`, não da classe `--hover`. **Fechado** — os 7
  sítios que usam `.card--hover` (dashboard, listagens de bancos/contas/categorias/cartões/regras/
  utilizadores, `app-entity-card`) deixam de mostrar cursor de mão.
  **Ver §3** — um 4º sítio (transações recentes do dashboard) tinha o mesmo problema por uma via
  diferente (`card--clickable`, não `card--hover`), não apanhado pela grep original; corrigido depois
  de o utilizador reportar que "ainda acontecia nas transações".

## 2. Pontos que precisam de decisão

Nenhum. As duas decisões relevantes (aplicar o diálogo a todos os 8 `confirm()`, e o formato exato
da versão no rodapé) foram confirmadas com o utilizador antes de implementar.

## 3. Desvios do plano aprovado

- **Achado durante a implementação, não previsto no README:** o primeiro `npm run build` com o
  `ConfirmDialogComponent` a usar `app-button` (como o README planeava em §3.2) **falhou** o
  orçamento de bundle inicial do Angular — o bundle inicial saltou de 382 kB para 2,71 MB (limite:
  1 MB). Causa: `ConfirmDialogComponent` está montado em `AppLayoutComponent` (layout raiz, carregado
  em toda a app, tal como `NotificationsComponent`), e `app-button` importa sempre `app-icon`, que
  por sua vez importa o registo `ICON_REGISTRY` com os 1.763 ícones Dazzle Icons — até agora esse
  registo só era alcançável a partir de rotas lazy-loaded, nunca do grafo eager. Corrigido
  substituindo `app-button` por dois `<button>` simples com CSS próprio em
  `confirm-dialog.component.css`, replicando visualmente as variantes `secondary`/`primary`/`danger`
  de `app-btn` sem depender do componente (e por isso sem puxar `app-icon`). Confirmado que o bundle
  inicial voltou a ~386 kB após a correção. Documentado também como comentário no componente, para
  não se repetir se alguém adicionar `app-button`/`app-icon` a outro componente montado no layout
  raiz no futuro.
- **Achado após o utilizador reportar que o problema "ainda acontecia nas transações"**, já depois do
  primeiro relatório desta correção: a investigação original (§1.C do README) só procurou
  `cursor:\s*pointer` literal em CSS — encontrou os 7 sítios que usam `.card--hover`, mas não o
  `app-transacao-item` (`frontend/src/app/shared/components/transacao-item/transacao-item.component.html:1`),
  que aplicava `cursor: pointer` por uma via diferente: `[class.card--clickable]="!showActions"` no
  próprio template do componente, não pela folha de estilo global. Em
  [`dashboard.component.html:78`](../../../../frontend/src/app/features/dashboard/dashboard.component.html)
  ("Transações Recentes"), `app-transacao-item` é usado com `[showActions]="false"` — a mesma
  condição que ativava `card--clickable` — mas sem qualquer `(click)` ligado ao item, exatamente o
  mesmo padrão de "cursor promete clique que não existe" do resto deste bugfix. Corrigido removendo
  o binding `[class.card--clickable]="!showActions"` do template do componente — o item volta a não
  ter nenhuma classe que force `cursor: pointer`. Não afeta os outros 2 usos de `app-transacao-item`
  (`transacoes-listar.component.html`, ambos com `showActions="true"`, que já não tinham este
  problema).

## 4. Não verificado / achado durante a verificação

- Verificação manual ponta-a-ponta num browser (confirmar visualmente o popup de pagamento de
  cartão e das 7 eliminações, a versão no rodapé, e o cursor em seta ao passar o rato pelos cards)
  não foi executada nesta sessão — sem browser interativo disponível. A prova de correção assenta em
  `npm run build`/`npm test` a passar e na leitura direta do código (ver §5).
- Backend não foi tocado nesta mudança — sem necessidade de verificação backend.

## 5. Como correr a verificação

- `cd frontend && npm run build` — confirma que compila e que o bundle inicial fica dentro do
  orçamento (o desvio de §3 já foi corrigido; um novo aumento voltaria a falhar aqui).
- `cd frontend && npm test` — corre a suite Karma/Jasmine existente (8 specs, nenhum tocado por esta
  mudança).
- Verificação manual: com a app a correr (`npm start` no frontend + backend local),
  1. abrir "Pagar cartão" num cartão existente e confirmar que aparece o popup da app (não o do
     browser); repetir para "Eliminar" em Bancos, Contas, Categorias, Cartões, Regras recorrentes,
     Transações e Utilizadores;
  2. confirmar que o rodapé mostra `v1.0.0 · © {ano} Diogo Pereira...`;
  3. passar o rato sobre os cards do dashboard e das páginas de listagem, incluindo as "Transações
     Recentes" do dashboard, e confirmar que o cursor fica em seta (a cor/elevação do card pode
     continuar a mudar).

## 6. Inventário de alterações

| Ficheiro | Estado |
| :--- | :--- |
| `frontend/src/app/shared/services/confirm-dialog.service.ts` | novo |
| `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts` | novo |
| `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.html` | novo |
| `frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.css` | novo |
| `frontend/src/app/layout/app-layout.component.ts` | alterado |
| `frontend/src/app/layout/app-layout.component.html` | alterado |
| `frontend/src/app/features/cartoes-credito/components/pagar/cartoes-credito-pagar.component.ts` | alterado |
| `frontend/src/app/features/bancos/components/listar/bancos-listar.view-model.ts` | alterado |
| `frontend/src/app/features/utilizadores/components/listar/utilizadores-listar.view-model.ts` | alterado |
| `frontend/src/app/features/contas/components/listar/contas-listar.view-model.ts` | alterado |
| `frontend/src/app/features/categorias/components/listar/categorias-listar.view-model.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts` | alterado |
| `frontend/src/app/features/transacoes/components/listar/transacoes-listar.component.ts` | alterado |
| `frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.view-model.ts` | alterado |
| `frontend/src/environments/environment.ts` | alterado |
| `frontend/src/environments/environment.prod.ts` | alterado |
| `frontend/src/app/layout/footer/footer.component.ts` | alterado |
| `frontend/src/app/layout/footer/footer.component.html` | alterado |
| `frontend/src/styles/_components.css` | alterado |
| `frontend/src/styles/_layout.css` | alterado |
| `frontend/src/app/features/dashboard/dashboard.component.css` | alterado |
| `frontend/src/app/shared/components/transacao-item/transacao-item.component.html` | alterado |
| `docs/changes/bugfixes/B0005-popup-confirmacao-versao-cursor-cards/README.md` | novo |
| `docs/changes/bugfixes/B0005-popup-confirmacao-versao-cursor-cards/RESULT.md` | novo |
