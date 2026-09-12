# F0002 — RESULT

| | |
| :--- | :--- |
| **Tipo** | Feature |
| **Branch** | `feature/sidebar-menu-melhorias` (base: `develop`; renomeada a meio da sessão de `feature/migra-icones-dazzle-icons` a pedido do utilizador, para associar ao trabalho de sidebar da issue #55) |
| **Issue** | Relacionada com [#55](https://github.com/DiogoMMP/poupa-me/issues/55) ("[Fix] Sidebar") — cobre só a tarefa "Mudar os icons"; as outras duas (esconder/expandir sidebar para só ícones, agrupar menu em secções) ficam por implementar, por decisão explícita do utilizador nesta sessão |
| **Estado** | Implementado |
| **Build** | `cd frontend && npm run build` — verde, sem baseline de erros/avisos pré-existente (baseline: bundle inicial 386.05 kB, dentro dos orçamentos definidos em `angular.json`) |
| **Testes** | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8/8 SUCCESS (baseline igual; nenhum spec cobre ícones/menu/loading, ver §4) |
| **Commits** | Ainda não committado — ver §7 do relatório de conversa para o `commit-push` |

## 1. O que foi fechado

- **A. Ícone de "a carregar".** `LoadingCoinComponent` deixou de renderizar a moeda 3D animada
  (`coin-face`/`coin-back` + `rotateY`). Depois de duas iterações em tempo real com o utilizador (ver
  §3), a versão final usa o desenho do ícone `Loader` (raios tipo relógio de sol) da Dazzle Icons,
  com cada um dos 8 raios a acender em sequência (`animation-delay` escalonado, estilo spinner
  iOS/macOS) em vez de rodar. Os raios são desenhados como `<line>` separados no próprio template do
  componente — usando exatamente as mesmas coordenadas do ícone `Loader` do `icon-registry.ts` — em
  vez de `<app-icon>`, porque o ícone da biblioteca é um único `<path>` composto e não dá para animar
  cada raio isoladamente a partir de HTML injetado em bruto (`[innerHTML]`).
- **B. Menu lateral.** `MenuService`/`NavComponent` deixaram de referenciar `/icons/*.svg`
  (`<img [src]="...">`) e passaram a usar `<app-icon [name]="item.icon">`, com `MenuItem.icon`
  tipado como `IconName`. Os 9 ficheiros em `frontend/public/icons/` foram apagados. Os hacks de
  `filter: invert(...)`/`brightness(0)` em `nav.component.css` (usados para tingir o `<img>` de
  branco/verde-água) foram removidos — a cor passa a vir de `color` herdado normalmente.
- **C. 19 desenhos de SVG inline únicos, 71 ocorrências, 33 templates** — todos substituídos por
  `<app-icon name="..." [size]="...">`, preservando classes/tamanhos originais. Ver a tabela completa
  no `README.md` §3.
- **D. 6 folhas de estilo com seletores `svg`/`path` que apontavam para dentro do template do
  `IconComponent`** — corrigidas para usar `color` no lugar de `stroke`/`fill` fixo:
  `dashboard.component.css`, `estatisticas.component.css`, `perfil.component.css`,
  `utilizadores-listar.component.css`, `footer.component.css` (reduzido de ~45 linhas de regras
  `!important` por-forma a 6 linhas).
- **E. `entity-card.component.html`** — os dois SVGs crus foram substituídos por `app-icon`; o
  *fallback* de edição (`*ngIf="!editIcon"` + `*ngIf="editIcon"` em dois `<svg>` separados) foi
  simplificado para um único `<app-icon [name]="editIcon || 'Pencil'">`.

## 2. Pontos que precisaram de decisão durante a implementação

Estes não estavam previstos no `README.md` — foram descobertos ou pedidos durante a implementação e
resolvidos nesta sessão; ficam registados aqui porque têm consequência operacional visível.

- **`IconComponent` estava a rebentar o orçamento do bundle inicial (`ng build` falhava).**
  Ao adicionar `<app-icon>` a `NavComponent`/`FooterComponent` (parte do *shell* eager da app, fora de
  qualquer rota lazy), o registo de 1.763 ícones (`ICON_REGISTRY`, ~2.3MB de markup SVG) passou a
  entrar no bundle inicial — de 386 kB para 2.70–2.73 MB, ultrapassando o orçamento de erro de 1MB do
  `angular.json` e fazendo o build falhar. **Consequência se não corrigido: o `ng build` de produção
  falha sempre, nada disto pode ser mergeado.**
  **Correção:** dividi `icon-registry.ts` (4.977 linhas) em dois ficheiros —
  `icon-names.ts` (o array `ICON_NAMES` + o tipo `IconName`, estático, pequeno) e `icon-registry.ts`
  (só o mapa `ICON_REGISTRY`, o SVG markup). `IconComponent` agora carrega `ICON_REGISTRY` com
  `import()` dinâmico (função `loadIconRegistry()`, promise partilhada e cacheada a nível de módulo),
  resolvida em `ngOnChanges` e aplicada via `signal`. Isto faz o `ICON_REGISTRY` sair para o seu
  próprio chunk assíncrono (`icon-registry` chunk, ~2.32MB), pedido uma única vez na primeira
  renderização de qualquer ícone e partilhado por todas as instâncias/rotas — o bundle inicial voltou
  a 385.85 kB, dentro do orçamento. Confirmei que uma tentativa anterior (só trocar
  `import {IconName}` por `import type {IconName}` em `menu.service.ts`) não resolvia nada — a causa
  raiz era o `ICON_NAMES`/`ICON_REGISTRY` estarem no mesmo ficheiro físico, forçando o bundler a
  incluir o ficheiro inteiro sempre que qualquer parte era referenciada estaticamente.

- **Regras CSS globais em `frontend/src/styles/_components.css` forçavam `fill`/`stroke` a
  `currentColor`/`inherit` em qualquer `svg` dentro de `button`, `.btn-edit-small`,
  `.btn-delete-small` e `.btn-concluir-small`.** Estas regras foram escritas para os SVGs crus
  antigos (a maioria ícones "preenchidos"); vários ícones Dazzle usados nos mesmos botões (`Pencil`,
  `Trash`, `Filter`, `List`, `Plus`, `FloppyDisk`) são desenhados a traço (`stroke`, sem `fill`
  próprio) — a regra global `fill: inherit`/`fill: currentColor !important` fazia-os herdar um
  preenchimento sólido que não existia no design original do ícone, mascarando/distorcendo a forma.
  Reportado pelo utilizador como "não pintava os icons dos botões" a meio da implementação.
  **Correção:** todas as regras (`button svg`, `.btn-icon svg`, `.btn-edit-small svg`,
  `.btn-delete-small svg`, `.btn-concluir-small svg`, incluindo as variantes `path`/`circle`/
  `rect`/`polygon`) passaram a excluir `.app-icon-svg` com `:not(.app-icon-svg)`, e foi acrescentada
  uma regra `button app-icon { color: inherit; }` (e equivalentes por variante de botão) para que o
  ícone continue a herdar a cor de texto do botão através da cascata normal de `color`, sem forçar
  `fill`/`stroke`. Os ícones Dazzle já trazem o `fill`/`stroke` correto por-ícone via `currentColor`.

- **Ícone de "Transações" no menu trocado de `ArrowsLeftRight` (proposta original) para
  `ArrowDownArrowUp`** — pedido explícito do utilizador em tempo real, sem alternativa a avaliar.

- **Tamanho dos ícones de entradas/saídas em `estatisticas.component.html` subido de 24 para 48
  (`[size]="48"`), igualando o ícone de balanço ao lado.** A decisão original do `README.md` §2 já
  previa fixar `saldo-icon`/`balanco-icon` em 48px, mas não estendeu essa correção aos irmãos
  `entradas-icon`/`saidas-icon` na mesma fila de cards — resultando em três ícones do mesmo cartão com
  tamanhos visivelmente diferentes (regressão apontada pelo utilizador: "desproporcional com o do
  balanço"). Os mesmos ícones (`ArrowUpRight`/`ArrowDownLeft`) usados em `transacao-item.component.html`
  ficaram **inalterados** a 24px — o utilizador indicou preferir esse tamanho mais pequeno nesse
  contexto ("até gosto assim que fica mais clean").

## 3. Desvios face ao plano aprovado

- **Ícone de loading: duas iterações depois da aprovação inicial, resultado final não usa
  `<app-icon>`.** O `README.md` §2 registava a escolha `CoinFront` (aprovada nas perguntas de plano).
  Sequência real:
  1. Durante a implementação o utilizador sugeriu `CoinVertical` (moeda em elipse/vista de lado)
     porque uma rotação 2D desse desenho alterna visualmente entre "fina" e "larga", parecendo mais
     com uma moeda a girar do que a rotação de um desenho simétrico.
  2. Depois de ver o resultado a rodar, o utilizador decidiu que **qualquer** moeda a girar continua a
     parecer forçada para um indicador de loading, mesmo sem ser a animação 3D original. Pediu outras
     ideias.
  3. Proposta e escolhida: abandonar o tema "moeda", usar o ícone `Loader` (raios tipo relógio de sol)
     com cada raio a acender em sequência — o estilo de spinner mais universal (iOS/macOS), sem
     ligação a dinheiro. Como o `Loader` da biblioteca é um único `<path>` composto, não dava para
     animar os raios individualmente via `<app-icon>`; a implementação final desenha os 8 raios como
     `<line>` no próprio template, com as mesmas coordenadas do ícone da biblioteca.
  `LoadingCoinComponent`/`app-loading-coin` mantiveram nome e API (`message`, `size`) ao longo de
  todas as iterações, para não tocar no único consumidor (`dashboard.component.html`).
- **Correção de bug introduzido pelo próprio script de substituição, apanhado antes do build:**
  o script de substituição automática (regex sobre `width="\d+"`) confundiu `stroke-width="1"` /
  `stroke-width="2"` com o atributo `width` do SVG em 8 ocorrências (ícones `Pencil`/`Trash`/`Check`
  sem `width` explícito, e o ícone `Wallet` do saldo), resultando em `[size]="1"`/`[size]="2"`.
  Detetado por grep sistemático a todos os `[size]="N"` gerados (nenhum ficou fora do conjunto
  {16,18,21,24,40,48}) e corrigido antes de correr o build — não chegou a ser reportado externamente,
  mas fica registado porque é um defeito real do processo de automação usado, não do plano.
- **`*ngIf` perdido em 4 ocorrências durante a substituição automática**, também apanhado e corrigido
  antes do build:
  - `entity-card.component.html` — o par de ícones (`*ngIf="!editIcon"` / `*ngIf="editIcon"`) tinha-se
    tornado dois `<app-icon>` incondicionais (mostraria os dois em simultâneo quando `editIcon` fosse
    passado). Resolvido ao mesmo tempo que a simplificação já prevista no plano (`[name]="editIcon ||
    'Pencil'"` num único `<app-icon>`).
  - `transacao-item.component.html` — os três ícones condicionais (`concluido`/`entrada`/`saída`,
    mutuamente exclusivos via `*ngIf`) tinham ficado todos incondicionais (os três sempre visíveis).
    Restaurados os três `*ngIf` originais.
  - Confirmado por grep exaustivo ao diff completo (`git diff | grep "^-.*<svg"`) que estes foram os
    únicos atributos Angular/acessibilidade (`*ngIf`, `aria-hidden`) perdidos entre os 71 blocos
    substituídos — os dois `aria-hidden="true"` perdidos (avatar de utilizador em
    `utilizadores-listar`/`footer`) foram igualmente restaurados.

## 4. Não verificado nesta sessão

- **Inspeção visual em browser de todos os 33 ecrãs afetados e do Storybook.** Não há ferramenta de
  captura de ecrã/browser automatizado disponível nesta sessão — as correções de cor/tamanho feitas em
  §2 e §3 foram guiadas por (a) leitura cuidada da cascata CSS envolvida e (b) feedback visual direto
  do utilizador a testar a app em paralelo, não por verificação própria. Recomenda-se correr
  `cd frontend && npm start` e percorrer visualmente: menu lateral, formulários de criar/editar
  (ícone "Guardar"), listagens (Editar/Eliminar/Criar/Filtros), `dashboard`, `estatisticas`, o menu
  "Nova Transação", e o indicador de loading no dashboard.
- **`npm run storybook`** não foi executado nesta sessão para confirmar visualmente que
  `loading-coin.stories.ts` e `entity-card.stories.ts` continuam a renderizar corretamente com a nova
  implementação.
- **Redimensionamento responsivo dos ícones de saldo/entradas/saídas/balanço abaixo de 768px** —
  removido nesta mudança (ver `README.md` §2/§5); decisão do utilizador se compensa reintroduzir via
  um `[size]` computado por breakpoint fica em aberto (`README.md` §7).
- **`npm run test:ci` (Cypress e2e)** não foi corrido — exige a app a correr em `http://localhost:4200`,
  não disponível nesta sessão.

## 5. Como correr a verificação

- `cd frontend && npm run build` — prova que o bundle compila e que o `icon-registry` sai como chunk
  assíncrono próprio (procurar a linha `chunk-*.js | icon-registry | ~2.3MB` nos *lazy chunks*, e
  confirmar que o *initial total* fica por volta dos 386 kB, não ~2.7MB).
- `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8 specs (mappers/serviços),
  sem relação direta com ícones, mas confirma que nada quebrou a build de testes.
- Inspeção manual: `cd frontend && npm start` e navegar por todos os ecrãs listados em §4.

## 6. Inventário de alterações

**Novo:**
- `frontend/src/app/shared/components/icon/icon-names.ts` — `ICON_NAMES` + tipo `IconName` (extraído
  de `icon-registry.ts` para permitir `import()` dinâmico do registo de SVGs).
- `docs/changes/features/F0002-migra-icones-dazzle-icons/README.md`, `RESULT.md`.

**Alterado (ícones/menu/loading — comportamento):**
- `frontend/src/app/shared/components/icon/icon.component.ts` — `ICON_REGISTRY` carregado via
  `import()` dinâmico em vez de import estático; `svgInnerHtml` passa a `signal` atualizado em
  `ngOnChanges`.
- `frontend/src/app/shared/components/icon/icon-registry.ts` — apenas `ICON_REGISTRY` (ICON_NAMES/
  IconName movidos para `icon-names.ts`).
- `frontend/src/app/shared/components/loading-coin/loading-coin.component.{ts,html,css}` — moeda 3D
  → 8 raios (`Loader` da Dazzle Icons, desenhados como `<line>`) a acender em sequência.
- `frontend/src/app/services/menu.service.ts` — `MenuItem.icon: IconName`; 9 valores trocados de
  caminho de ficheiro para nome de ícone Dazzle.
- `frontend/src/app/layout/nav/nav.component.{ts,html,css}` — `<img>` → `<app-icon>`; hacks de
  `filter` removidos.
- `frontend/src/app/layout/footer/footer.component.{ts,html,css}` — ícone de utilizador → `app-icon`;
  ~45 linhas de CSS `!important` reduzidas a 6.
- `frontend/src/app/features/{bancos,cartoes-credito,categorias,contas,despesas-recorrentes,
  estatisticas,perfil,transacoes,utilizadores}/**/*.{html,ts}` (28 componentes) — SVGs inline →
  `<app-icon>`; `IconComponent` adicionado a `imports`.
- `frontend/src/app/features/dashboard/dashboard.component.{ts,html,css}`,
  `frontend/src/app/features/estatisticas/components/estatisticas.component.{ts,html,css}` — ícones
  de saldo/entradas/saídas/balanço → `app-icon`; seletores CSS `path` → `color`.
- `frontend/src/app/features/perfil/components/perfil.component.{ts,html,css}`,
  `frontend/src/app/features/utilizadores/components/listar/utilizadores-listar.component.{ts,html,css}`
  — avatar de utilizador → `app-icon`; CSS `svg` de tamanho fixo removido.
- `frontend/src/app/shared/components/entity-card/entity-card.component.html` — 2 SVGs → `app-icon`;
  *fallback* de edição simplificado.
- `frontend/src/app/shared/components/nova-transacao-menu/nova-transacao-menu.component.{ts,html}`,
  `frontend/src/app/shared/components/transacao-item/transacao-item.component.{ts,html}` — SVGs →
  `app-icon`; `*ngIf` condicionais restaurados em `transacao-item`.
- `frontend/src/styles/_components.css` — regras `svg`/`path` de `fill`/`stroke` fixo passam a excluir
  `.app-icon-svg`; adicionadas regras `app-icon { color: inherit; }` por variante de botão.

**Apagado:**
- `frontend/public/icons/{bancos,cartoes,categorias,contas,dashboard,despesas_mensais,estatisticas,
  transacoes,usuarios}.svg` (9 ficheiros).
