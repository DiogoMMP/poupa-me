# F0005 — Sidebar recolhível para só ícones, expande ao passar o rato

| | |
| :--- | :--- |
| **Tipo** | Feature (UI, experimental — o utilizador quer testar visualmente antes de decidir se fica) |
| **Branch** | `feature/sidebar-menu-melhorias` (base: `develop`) — parte 1 da issue #55 ("esconder sidebar e mostrar apenas os icons") |
| **Estado** | Planeado |
| **Âmbito** | Frontend: `app-layout.component.css`, `nav.component.css`, `header.component.{html,css}`, `footer.component.css`, `_tokens.css`, `not_found.component.css`, `not_authorized.component.css` |
| **Verificação** | `cd frontend && npm run build` + `npm test`; inspeção visual manual (sem Cypress a correr nesta sessão) — **este é o passo mais importante aqui**, dado o caráter experimental |

## 1. Situação

A sidebar (`<aside class="sidebar">` em
[`app-layout.component.html`](../../../../frontend/src/app/layout/app-layout.component.html)) tem
largura fixa `--sidebar-width` (250px) no desktop, `--sidebar-width-tablet` (200px) entre 601-768px, e
um comportamento de slide-in/out via hamburger abaixo de 600px (`sidebarOpen` signal em
`app-layout.component.ts`).

**Evidência:**

- `--sidebar-width`/`--sidebar-width-tablet` são usados em 3 sítios além do próprio layout:
  `not_found.component.css` e `not_authorized.component.css` posicionam o seu conteúdo com
  `left`/`width: calc(100% - var(--sidebar-width))`, com o mesmo padrão de 3 breakpoints.
- `NavComponent`, `HeaderComponent` (logo + seletor de banco da F0003) e `FooterComponent` são 3
  componentes standalone separados, cada um com o seu próprio `styleUrls` — CSS escrito num deles não
  alcança elementos renderizados por outro (mesma limitação de encapsulamento Angular já encontrada
  na F0002/F0003), pelo que esconder texto "por dentro" de cada um a partir de uma única regra em
  `app-layout.component.css` não funciona com seletores normais.

**Inventário (superfícies afetadas):**

- **A.** `_tokens.css` — novo `--sidebar-width-collapsed`.
- **B.** `app-layout.component.css` — sidebar recolhida por omissão + expande em `:hover`.
- **C.** `nav.component.css` — esconder `.nav-label` quando recolhida.
- **D.** `header.component.{html,css}` — esconder título "Poupa-Me" e o seletor de banco (F0003)
  quando recolhida.
- **E.** `footer.component.css` — esconder nome/login/copyright quando recolhida.
- **F.** `not_found.component.css`, `not_authorized.component.css` — ajustar o offset do conteúdo à
  nova largura recolhida (fixa, já não reage ao hover destas duas páginas específicas).

## 2. Resultado pretendido

No desktop (≥601px), a sidebar fica sempre recolhida (só ícones do menu, ~68px) e expande para a
largura atual (250px) ao passar o rato por cima, sobrepondo-se ao conteúdo (não o empurra — evita
reflow da página inteira a cada hover). No mobile (<601px), comportamento **inalterado** (hamburger a
abrir/fechar a sidebar toda).

**Decisões:**

- **Seletor de banco (F0003) esconde-se completamente quando recolhida** — decisão do utilizador,
  entre isto e mostrar só o emoji do banco atual sempre visível. Evita mostrar um dropdown cortado
  num espaço de ~68px.
- **Coordenação entre componentes via CSS custom properties, não `::ng-deep` nem serviços.**
  `.sidebar` define `--label-opacity`/`--label-max-height` (0 por omissão nos breakpoints ≥601px,
  `1`/valor real em `:hover`); `NavComponent`/`HeaderComponent`/`FooterComponent` usam
  `var(--label-opacity, 1)` no seu próprio CSS. Custom properties atravessam os limites de
  encapsulamento do Angular (herdam pela árvore DOM real), ao contrário de seletores CSS normais —
  resolve o mesmo tipo de limitação encontrada na F0002/F0003 sem recorrer a `::ng-deep`.
- **Expansão só onde há hover real** (`@media (hover: hover) and (min-width: 601px)`), para não deixar
  um ecrã tátil (tablet em modo desktop, ex.: iPad com rato desligado) preso num estado "sticky
  hover" depois de um toque.
- **Simplifica de 3 níveis de largura para 2.** Hoje existe desktop (250px) / tablet (200px, sempre
  visível) / mobile (slide-in). Como a sidebar recolhida (~68px) já cabe confortavelmente em
  qualquer largura ≥601px, o nível "tablet" deixa de ter uma largura própria — passa a comportar-se
  como o desktop (recolhida por omissão, expande para 250px no hover). `--sidebar-width-tablet`
  deixa de ser usado por `app-layout.component.css`, mas mantém-se como variável (não removida) por
  ainda ser referenciada só por `not_found`/`not_authorized`.
  **Alternativa rejeitada:** manter 3 níveis de largura de expansão (68px/200px/250px conforme
  breakpoint) — mais fiel ao que já existia, mas complexidade extra sem benefício claro visível,
  numa feature que o próprio utilizador já assumiu como experimental.
- **`not_found`/`not_authorized` passam a offset fixo pela largura recolhida**, sem reagir ao hover
  (são páginas de erro em ecrã inteiro, não têm o resto do layout à volta para justificar sobreposição
  dinâmica) — o seu breakpoint "tablet" a 1024px deixa de ser necessário (a largura recolhida já serve
  para qualquer viewport ≥541px) e é removido dessas duas folhas de estilo.

## 3. Implementação

1. **`_tokens.css`** — adicionar `--sidebar-width-collapsed: 68px;`.

2. **`app-layout.component.css`**
   - `.sidebar`: `width: var(--sidebar-width-collapsed)`, `transition: width 0.2s ease`.
   - Novo bloco `@media (hover: hover) and (min-width: 601px)`: `.sidebar { --label-opacity: 0;
     --label-max-height: 0; --label-pointer-events: none; }` e `.sidebar:hover { width:
     var(--sidebar-width); --label-opacity: 1; --label-max-height: 400px; --label-pointer-events:
     auto; }`.
   - `.main-wrapper`: `margin-left`/`width` passam a usar `--sidebar-width-collapsed` sempre que
     ≥601px (remove o bloco `@media max-width:768px` que hoje define a largura "tablet").
   - Bloco `@media max-width:600px` (mobile) mantém-se tal como está.

3. **`nav.component.css`** — `.nav-label { opacity: var(--label-opacity, 1); overflow: hidden;
   white-space: nowrap; transition: opacity 0.15s ease; }`.

4. **`header.component.html`/`.css`**
   - `.logo-link h1`: `opacity: var(--label-opacity, 1); white-space: nowrap; transition: opacity
     0.15s ease;`.
   - `.banco-selector`: `opacity: var(--label-opacity, 1); max-height: var(--label-max-height, 400px);
     overflow: hidden; pointer-events: var(--label-pointer-events, auto); transition: opacity 0.15s
     ease, max-height 0.2s ease;`.

5. **`footer.component.css`** — `.footer-content` recebe o mesmo tratamento de
   `opacity`/`max-height`/`pointer-events` do banco-selector (esconde nome de utilizador,
   entrar/sair e copyright em conjunto).

6. **`not_found.component.css`, `not_authorized.component.css`** — `left`/`width` no seletor base
   passam a usar `var(--sidebar-width-collapsed)`; remover o bloco `@media max-width:1024px`
   (redundante); manter o bloco `@media max-width:540px` (mobile) tal como está.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros pré-existente.
- `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8/8 (baseline); nenhum spec
  cobre layout/CSS.
- **Inspeção visual manual é a verificação principal desta mudança** — build/testes não validam
  aparência. Ver `RESULT.md` §4 para o checklist de ecrãs a confirmar.

## 5. Riscos

- **Risco:** o utilizador não gostar do resultado visual (assumido pelo próprio como possível — é
  literalmente o motivo de pedir para testar primeiro). **Mitigação:** nenhuma — é o objetivo desta
  ronda, iterar depois do feedback visual, como nas mudanças anteriores desta sessão.
- **Risco:** `overflow-x: hidden` (já existente em `.sidebar`) cortar de forma abrupta o `.banco-selector`
  ou `.nav-label` durante a transição de largura, em vez de um encolhimento suave.
  **Mitigação:** a transição de `opacity`/`max-height` (200ms) é mais rápida que a de `width` só o
  suficiente para o texto desaparecer antes da sidebar acabar de encolher — a ordem exata só se
  confirma visualmente (ver `RESULT.md` §4).
- **Risco:** dispositivos com ecrã tátil em janela larga (≥601px) ficarem com a sidebar sempre
  recolhida e sem hover para expandir. **Mitigação:** `@media (hover: hover)` restringe o
  comportamento a dispositivos com apontador real; sem essa media query a sidebar ficaria recolhida
  sem forma de expandir nesses dispositivos — fica como limitação conhecida sem solução de toque
  nesta ronda (fora de âmbito, ver §7).

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Sidebar recolhível + labels do menu | `_tokens.css`, `app-layout.component.css`, `nav.component.css` | A, B, C |
| 2 | Header (título + seletor de banco) | `header.component.{html,css}` | D |
| 3 | Rodapé | `footer.component.css` | E |
| 4 | Páginas de erro (offset de conteúdo) | `not_found.component.css`, `not_authorized.component.css` | F |

## 7. Fora de âmbito / handoff

- **Botão para "fixar" a sidebar aberta** (alternativa ao hover, para quem prefere sempre expandida)
  — não pedido; se o utilizador gostar do hover mas quiser esta opção extra, fica para depois.
- **Suporte a expandir por toque em ecrãs táteis** (tablets sem rato) — ver risco em §5.
- **Agrupar o menu em secções** — segunda parte da issue #55, não pedida nesta mudança.
