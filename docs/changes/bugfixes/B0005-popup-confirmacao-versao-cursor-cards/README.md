# B0005 — Popup de confirmação nativo, versão em falta no rodapé, cursor errado nos cards

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/popup-confirmacao-versao-cursor-cards` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | 1 serviço + 1 componente novos (confirm dialog), 8 pontos de chamada de `confirm()` nativo, 1 componente de rodapé, 2 ficheiros de environment, 2 folhas de estilo globais + 1 folha de estilo do dashboard |
| **Verificação** | `npm run build` (frontend) + `npm test` (frontend) |

## 1. Situação

Três problemas de UI encontrados pelo utilizador ao navegar na app, sem relação técnica entre si mas
todos pequenos e independentes — agrupados neste registo tal como o B0003 agrupou os 3 findings do
CodeRabbit.

**Evidência:**

**A. Confirmação de pagamento de cartão usa `confirm()` nativo do browser.**
[`cartoes-credito-pagar.component.ts:82`](../../../../frontend/src/app/features/cartoes-credito/components/pagar/cartoes-credito-pagar.component.ts)
usa `confirm('Confirmar pagamento do período atual e configurar o próximo período?')` — o popup
nativo do browser, com aspeto e comportamento fora do controlo visual da app. A app **não tem hoje
nenhum componente de diálogo/modal próprio** (`ls frontend/src/app/shared/components` confirma:
`button`, `entity-card`, `icon`, `loading-coin`, `nova-transacao-menu`, `pagination`,
`sem-valor-section`, `transacao-item` — nenhum modal/dialog). O mesmo padrão `confirm()` nativo
repete-se em mais 7 sítios, todos com o mesmo problema visual:

- [`bancos-listar.view-model.ts:64`](../../../../frontend/src/app/features/bancos/components/listar/bancos-listar.view-model.ts) — eliminar banco
- [`utilizadores-listar.view-model.ts:48`](../../../../frontend/src/app/features/utilizadores/components/listar/utilizadores-listar.view-model.ts) — eliminar utilizador
- [`contas-listar.view-model.ts:76`](../../../../frontend/src/app/features/contas/components/listar/contas-listar.view-model.ts) — eliminar conta
- [`categorias-listar.view-model.ts:49`](../../../../frontend/src/app/features/categorias/components/listar/categorias-listar.view-model.ts) — eliminar categoria
- [`despesas-recorrentes-listar-regras.view-model.ts:89`](../../../../frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts) — eliminar regra
- [`transacoes-listar.component.ts:108`](../../../../frontend/src/app/features/transacoes/components/listar/transacoes-listar.component.ts) — eliminar transação
- [`cartoes-credito-listar.view-model.ts:197`](../../../../frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.view-model.ts) — eliminar cartão

Confirmado com o utilizador: substituir os 8 (não só o do pagamento), reaproveitando o mesmo
componente novo.

**B. Rodapé não mostra a versão da app.**
[`footer.component.html:28-30`](../../../../frontend/src/app/layout/footer/footer.component.html) só
mostra `© {{ year }} Diogo Pereira. Todos os direitos reservados.` — sem versão. A versão já existe
como fonte única em [`frontend/package.json:3`](../../../../frontend/package.json) (`"version":
"1.0.0"`), mantida automaticamente pelo `release-please` já ativo no repositório (commit
`76cdb43`) — não deve ser duplicada manualmente noutro ficheiro.

**C. Cursor de "clicável" em cards que não são clicáveis.**
A classe partilhada `.card--hover`, definida duas vezes com o mesmo conteúdo em
[`frontend/src/styles/_components.css:106-108`](../../../../frontend/src/styles/_components.css) e
[`frontend/src/styles/_layout.css:47-49`](../../../../frontend/src/styles/_layout.css), aplica
`cursor: pointer` a qualquer card com essa classe. É usada em 7 sítios — o dashboard
(`conta-card`) e os cards de listagem de bancos, contas, categorias, cartões, regras e utilizadores,
incluindo o componente partilhado `app-entity-card`. Em **nenhum** destes o `<div>` com a classe tem
um `(click)` ou `routerLink` próprio — só os botões internos ("Editar", "Eliminar") são clicáveis;
confirmado por leitura de todos os 7 templates
([`dashboard.component.html:52`](../../../../frontend/src/app/features/dashboard/dashboard.component.html),
[`bancos-listar.component.html:24`](../../../../frontend/src/app/features/bancos/components/listar/bancos-listar.component.html),
[`contas-listar.component.html:24`](../../../../frontend/src/app/features/contas/components/listar/contas-listar.component.html),
[`categorias-listar.component.html:24`](../../../../frontend/src/app/features/categorias/components/listar/categorias-listar.component.html),
[`cartoes-credito-listar.component.html:24`](../../../../frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.component.html),
[`despesas-recorrentes-listar-regras.component.html:24`](../../../../frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.component.html),
[`utilizadores-listar.component.html:15`](../../../../frontend/src/app/features/utilizadores/components/listar/utilizadores-listar.component.html)).
O efeito visual de hover (mudança de cor/fundo, elevação) já vem de `.card:hover` em
`_components.css:80-85`, aplicado a **qualquer** `.card` independentemente de `--hover` — logo
`.card--hover` hoje só acrescenta o cursor errado, nada mais. Existe já uma classe dedicada
`.card--clickable` (`_components.css:97-103`) que define `cursor: pointer` para cards genuinamente
clicáveis — não usada em lado nenhum atualmente, fica disponível para o dia em que um card passe a
navegar ao ser clicado.
Adicionalmente, [`dashboard.component.css:104-112`](../../../../frontend/src/app/features/dashboard/dashboard.component.css)
define `cursor: pointer` outra vez, especificamente para `.conta-card` — duplicando o mesmo problema
só para esse card.

**Inventário (superfícies afetadas):**

- **A.** 8 pontos de chamada `confirm()` nativo (listados acima).
- **B.** `FooterComponent`/`footer.component.html`, `environment.ts`, `environment.prod.ts`.
- **C.** `_components.css` (`.card--hover`), `_layout.css` (`.card--hover`),
  `dashboard.component.css` (`.conta-card`).

**Escala:** 2 ficheiros novos (serviço + componente de diálogo), 8 ficheiros com um `confirm()` a
substituir, 3 ficheiros de rodapé/environment, 3 regras CSS a corrigir.

## 2. Resultado pretendido

**A.** Um componente de confirmação da própria app (overlay + caixa de diálogo, botões "Cancelar"/
"Confirmar" com `app-button`) substitui os 8 `confirm()` nativos. Mesmo texto de cada confirmação,
mesmo comportamento (cancelar = não prosseguir com a ação).

**B.** Rodapé mostra `v1.0.0 · © 2026 Diogo Pereira. Todos os direitos reservados.` — versão lida de
`package.json` em build-time, sem duplicar o número manualmente.

**C.** Passar o rato sobre os 7 cards não clicáveis mantém o efeito visual de hover (cor/fundo já
davam por `.card:hover`) mas o cursor fica a seta (`default`), como em qualquer área não clicável.

**Decisões:**

- **Diálogo de confirmação: serviço global + 1 componente montado no layout**, seguindo exatamente o
  padrão já usado por `NotificationService`/`<app-notifications>` (`app-layout.component.html:24`) —
  um `signal` com o pedido atual, um `Promise<boolean>` devolvido por `confirm(mensagem, opções?)`,
  resolvido quando o utilizador escolhe. Escolhido em vez de um `MatDialog`/biblioteca de terceiros
  porque a app não usa nenhuma biblioteca de UI de componentes (Angular Material, etc.) — introduzir
  uma só para isto seria desproporcional.
  **Alternativa rejeitada:** um `@Input()`/`@Output()` por componente que precisa de confirmação.
  Rejeitada porque exigiria colocar o template do diálogo (overlay, botões) repetido em 8 sítios, ou
  um `<ng-template>` por chamador — muito mais código do que 1 serviço + 1 componente partilhado.
- **`confirm()` do serviço devolve `Promise<boolean>`**, não um `Observable`. Os 8 chamadores já usam
  `if (!confirm(...)) return;` de forma síncrona — `async`/`await` no método chamador é a mudança
  mínima que preserva essa forma (`if (!(await this.confirmDialog.confirm(...))) return;`), sem
  reescrever a lógica de subscrição RxJS que já existe a seguir em cada um.
- **`variant: 'danger'`** para as 7 confirmações de eliminação (perigosas/irreversíveis) e
  `'default'` para a confirmação de pagamento (não destrutiva) — o botão de confirmar usa
  `app-button[variant=danger]` ou `[variant=primary]` consoante o caso, para o utilizador distinguir
  visualmente uma eliminação de uma confirmação normal.
- **Clique fora do diálogo ou tecla Escape cancelam** (mesmo resultado que o botão "Cancelar") — é o
  comportamento esperado de qualquer diálogo modal e o mais próximo do `confirm()` nativo que
  substitui (Esc também fecha o `confirm()` do browser).
- **Versão lida de `package.json` via import direto** (`resolveJsonModule` já ativo em
  `tsconfig.json:12`, builder é `@angular/build:application`/esbuild, que resolve imports JSON sem
  configuração extra) em `environment.ts`/`environment.prod.ts` — nunca escrita à mão nos dois
  ficheiros. Assim o `release-please` continua a ser a única fonte que altera o número de versão；o
  rodapé segue automaticamente.
  **Alternativa rejeitada:** hardcodar `version: '1.0.0'` nos dois ficheiros de environment.
  Rejeitada porque cria uma terceira cópia do número (a somar a `package.json` do frontend) que o
  `release-please` não atualiza — ficaria desatualizado no próximo bump automático.
- **Formato:** `v1.0.0 · © 2026 Diogo Pereira. Todos os direitos reservados.` — confirmado com o
  utilizador (versão como prefixo, separada por "·").
- **Remover `cursor: pointer` da própria regra `.card--hover`** (nas duas folhas onde está
  duplicada) em vez de trocar a classe nos 7 templates para `.card` liso. Isto corrige o cursor em
  todos os 7 sítios de uma só vez, mantém o efeito de cor/hover intacto (vem de `.card:hover`, não de
  `.card--hover`) e não obriga a tocar em 7 ficheiros de template. `.card--clickable` fica disponível,
  sem alteração, para um card que um dia precise mesmo de cursor de clique.
  **Alternativa rejeitada:** apagar a classe `.card--hover` dos 7 templates. Rejeitada porque a classe
  em si não fica "vazia" — é normal manter o nome semântico (`--hover`) para os cards que têm o
  efeito visual de hover, mesmo que hoje esse efeito já venha de `.card` base; remover a classe dos
  templates não resolveria nada que a correção da regra CSS já não resolva, e tocaria em mais
  ficheiros sem necessidade.

## 3. Implementação

1. **`frontend/src/app/shared/services/confirm-dialog.service.ts`** (novo) — `ConfirmDialogService`
   (`providedIn: 'root'`), `signal<ConfirmDialogRequest | null>` com o pedido atual, método
   `confirm(message, options?): Promise<boolean>` e `resolve(result: boolean)` interno chamado pelo
   componente.
2. **`frontend/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`** (+ `.html` +
   `.css`, novos) — overlay + caixa de diálogo, usa `app-button` para "Cancelar"/"Confirmar",
   `HostListener('document:keydown.escape')` para cancelar com Esc, clique no overlay cancela.
3. **`frontend/src/app/layout/app-layout.component.ts`/`.html`** — importa e monta
   `<app-confirm-dialog>` ao lado de `<app-notifications>` (`app-layout.component.html:24`).
4. **8 pontos de chamada** — cada um injeta `ConfirmDialogService`, troca
   `if (!confirm('...')) return;` por
   `if (!(await this.confirmDialog.confirm('...', { variant: 'danger' }))) return;` (`'default'`
   para o pagamento de cartão) e o método passa a `async`:
   - `cartoes-credito-pagar.component.ts` (`onSubmit`, variant `default`)
   - `bancos-listar.view-model.ts` (`deleteBanco`, variant `danger`)
   - `utilizadores-listar.view-model.ts` (`deleteUserByEmail`, variant `danger`)
   - `contas-listar.view-model.ts` (`deleteConta`, variant `danger`)
   - `categorias-listar.view-model.ts` (`deleteCategoria`, variant `danger`)
   - `despesas-recorrentes-listar-regras.view-model.ts` (`deleteRegra`, variant `danger`)
   - `transacoes-listar.component.ts` (`onDelete`, variant `danger`)
   - `cartoes-credito-listar.view-model.ts` (`deleteCartao`, variant `danger`)
5. **`frontend/src/environments/environment.ts`/`environment.prod.ts`** — importam
   `version` de `../../package.json` (import JSON), expõem `version` no objeto `environment`.
6. **`frontend/src/app/layout/footer/footer.component.ts`/`.html`** — expõe
   `readonly version = environment.version;`; template passa a
   `v{{ version }} · © {{ year }} Diogo Pereira. Todos os direitos reservados.`
7. **`frontend/src/styles/_components.css`** — remove `cursor: pointer;` da regra `.card--hover`
   (linha 106-108).
8. **`frontend/src/styles/_layout.css`** — remove `cursor: pointer;` da regra `.card--hover` (linha
   47-49).
9. **`frontend/src/app/features/dashboard/dashboard.component.css`** — remove `cursor: pointer;` da
   regra `.conta-card` (linha 111).

Fase única — os 3 problemas são independentes entre si mas cada um é pequeno; a Fase 4 §Verificação
corre a suite completa no fim, e a ordem de commit (§6) separa os 3 em unidades revisáveis
independentemente.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros/warnings pré-existente a esta data.
- `cd frontend && npm test` — sem baseline de testes a falhar previamente.
- Verificação manual (não automatizável nesta sessão, ver `RESULT.md` §4): abrir a app num browser e
  confirmar (1) que "Pagar cartão" e as 7 ações de eliminar mostram o popup da app, não o do browser;
  (2) que o rodapé mostra a versão; (3) que passar o rato sobre os cards de dashboard/listagens muda
  a cor mas mantém o cursor em seta.

## 5. Riscos

- **Risco:** algum teste unitário existente espera o `confirm()` nativo (`window.confirm` mockado) e
  parte ao mudar para o serviço. **Mitigação:** grep confirmou que não existem specs para nenhum dos
  8 ficheiros afetados (`*.view-model.spec.ts`/`*.component.spec.ts` inexistentes nestas pastas) —
  confirmado antes de avançar.
- **Risco:** tornar os 8 métodos `async` muda o tipo de retorno de `void` para `Promise<void>`;
  algum chamador poderia depender do retorno síncrono. **Mitigação:** todos os 8 são invocados a
  partir de bindings de template (`(click)="vm.deleteX(id)"`), que ignoram o valor de retorno — sem
  chamador que dependa de `void` explícito.
- **Risco:** importar `package.json` num ficheiro de `environment` (fora de `src/`, mas TypeScript
  com `resolveJsonModule` resolve-o) pode falhar no builder esbuild do Angular por estar fora do
  `rootDir` de `tsconfig.app.json` (`include: ["src/**/*.ts"]`). **Mitigação:** a validar em
  `npm run build` na Fase 4 — se falhar, alternativa de fallback é gerar um pequeno
  `src/environments/version.ts` no `prebuild`/`postinstall` a partir de `package.json` (mais
  ficheiros, mais complexidade) — só usada se a importação direta não compilar.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Cursor dos cards | `_components.css`, `_layout.css`, `dashboard.component.css` | C |
| 2 | Versão no rodapé | `environment.ts`, `environment.prod.ts`, `footer.component.ts`, `footer.component.html` | B |
| 3 | Diálogo de confirmação da app + 8 pontos de chamada | `confirm-dialog.service.ts` (novo), `confirm-dialog.component.ts/.html/.css` (novos), `app-layout.component.ts/.html`, e os 8 ficheiros listados em §3.4 | A |

## 7. Fora de âmbito / handoff

- **Testes unitários para o novo `ConfirmDialogService`/`ConfirmDialogComponent`** — o projeto não
  tem specs para nenhum dos 8 consumidores existentes nem para `NotificationService`/
  `NotificationsComponent` (o padrão que este componente segue); manter consistência com o que já
  existe. Se o utilizador quiser cobertura de testes para diálogos no futuro, é um pedido à parte.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
