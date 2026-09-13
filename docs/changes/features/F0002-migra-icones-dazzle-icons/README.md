# F0002 — Migra todos os ícones da app para a biblioteca Dazzle Icons

| | |
| :--- | :--- |
| **Tipo** | Feature (unificação do sistema de ícones da app) |
| **Branch** | `feature/sidebar-menu-melhorias` (base: `develop`) — relacionada com a [issue #55](https://github.com/DiogoMMP/poupa-me/issues/55) ("[Fix] Sidebar"), que também cobre esconder/expandir a sidebar para só ícones e agrupar o menu em secções — **nenhuma dessas duas ficou implementada nesta mudança**, só a troca de ícones (ver §7) |
| **Estado** | Planeado |
| **Âmbito** | Frontend apenas: `LoadingCoinComponent`, `MenuService`/`NavComponent`, 33 templates de features/shared com SVG inline, 6 folhas de estilo com seletores `svg`/`path`, `frontend/public/icons/` (a apagar) |
| **Verificação** | `cd frontend && npm run build` + `npm test`; inspeção visual manual dos ecrãs afetados (sem Cypress a correr nesta sessão) |

## 1. Situação

A app usa três formas distintas de ícones, coexistindo com uma biblioteca já importada e cujo
catálogo de 1.763 ícones está documentado no Storybook (`Icon > Catálogo Pesquisável`,
`frontend/src/stories/icon.stories.ts`), acessível via `<app-icon name="..." [size]="..." [color]="...">`
(`frontend/src/app/shared/components/icon/icon.component.ts`, biblioteca `dazzle-icons`):

**Evidência:**

- **A. Ícone de "a carregar" com animação de moeda 3D**
  [`frontend/src/app/shared/components/loading-coin/loading-coin.component.ts`](../../../../frontend/src/app/shared/components/loading-coin/loading-coin.component.ts) —
  `LoadingCoinComponent`, único uso real em
  [`dashboard.component.html:14`](../../../../frontend/src/app/features/dashboard/dashboard.component.html),
  mais a story `loading-coin.stories.ts`. É este o ícone que o utilizador identificou explicitamente
  como não gostando ("quero que seja apenas icon ou seja com a linha à volta").

- **B. 9 ficheiros PNG/SVG próprios para o menu lateral**
  [`frontend/public/icons/*.svg`](../../../../frontend/public/icons) (`bancos`, `cartoes`, `categorias`,
  `contas`, `dashboard`, `despesas_mensais`, `estatisticas`, `transacoes`, `usuarios`), referenciados
  por caminho de string em
  [`menu.service.ts`](../../../../frontend/src/app/services/menu.service.ts) (`MenuItem.icon: string`)
  e renderizados com `<img [src]="item.icon">` em
  [`nav.component.html:5`](../../../../frontend/src/app/layout/nav/nav.component.html). Confirmado por
  grep que **não há mais nenhuma referência** a `/icons/` no projeto — a pasta pode ser apagada por
  inteiro assim que o menu for migrado. `nav.component.css` usa `filter: brightness(0) invert(1)` e um
  `filter: invert(...)` calculado à mão só para conseguir tingir um `<img>` de branco/verde-água, workaround
  que deixa de ser necessário com `<app-icon>` (que já suporta `currentColor`).

- **C. 19 desenhos de SVG inline distintos, repetidos em 71 pontos de 33 templates.** Extraído por
  agrupamento automático dos blocos `<svg>...</svg>` pelos seus `path`/`circle` (script Python
  ad-hoc, não commitado). Alguns exemplos de repetição: o ícone de "Guardar" (disquete) aparece
  literalmente igual em 19 formulários de criar/editar; o ícone de "Eliminar" (caixote) em 7 listagens;
  o de "Editar" (lápis, variante preenchida) em 6.

- **D. 6 blocos de CSS com seletores `svg`/`path` que deixam de funcionar depois da migração**, porque
  passam a apontar para dentro do template interno do `IconComponent` (outro âmbito de encapsulamento
  Angular — o seletor do componente pai não alcança elementos renderizados pelo template do
  componente filho):
  - `dashboard.component.css:263-265` e `estatisticas.component.css:61-63` — `.saldo-icon path`,
    `.entradas-icon path`, `.saidas-icon path`, `.balanco-icon path` a forçar `stroke` fixo.
  - `perfil.component.css:2` e `utilizadores-listar.component.css:2` — `:host .card-icon--circle svg`
    a forçar `width`/`height`.
  - `footer.component.css:102-149` — ~45 linhas a forçar `stroke`/`fill: none !important` em
    `path`/`circle`/`rect`/`polygon`/`ellipse` dentro do ícone de utilizador, incluindo estados
    `:hover`/`:focus`.

- **E. `entity-card.component.html`** — componente partilhado, **não usado em produção ainda** (só na
  story `entity-card.stories.ts`), mas já parcialmente preparado para `app-icon` (inputs `editIcon`/
  `actionIcon` opcionais) com *fallback* em SVG cru e um botão "Eliminar" ainda 100% em SVG cru.

**Inventário (superfícies a migrar):**

- **A.** `LoadingCoinComponent` (template + CSS).
- **B.** `MenuService` (`MenuItem.icon` + os 9 valores), `NavComponent` (template), `nav.component.css`
  (remover os `filter`), apagar `frontend/public/icons/`.
- **C.** 19 grupos de SVG único → nome de ícone Dazzle, aplicados nos 33 ficheiros listados na tabela
  da secção 3.
- **D.** As 6 folhas de estilo listadas acima.
- **E.** `entity-card.component.html` (2 SVGs).

**Escala:** 1 componente de loading, 9 ícones de menu, 19 desenhos únicos em 71 ocorrências across 33
templates, 6 ficheiros CSS a corrigir, 9 ficheiros a apagar em `public/icons/`. Zero alterações de
backend, zero alterações de rotas ou comportamento — troca visual/estrutural pura.

## 2. Resultado pretendido

Todo o ícone da app (menu, ações de formulário, listagens, indicador de loading) passa a vir de
`<app-icon name="..." >`, sem SVG cru no código nem ficheiros em `public/icons/`. A cor continua a
seguir `currentColor`/CSS `color` como já acontecia nos SVGs originais — sem regressão visual de cor.

**Decisões:**

- **Ícone de loading: `CoinVertical`, animado a rodar (CSS `animation: spin`), mantendo o tema "moeda"
  mas como ícone simples com contorno** — decisão do utilizador entre `CircleNotch`, `RefreshCw` e
  `Loader`; escolheu manter a referência a moeda, mas em traço/contorno em vez da animação 3D de
  flip. Trocado de `CoinFront` (desenho simétrico, uma rotação 2D pareceria uma roda a girar) para
  `CoinVertical` (moeda desenhada em elipse, vista de lado) por sugestão do próprio utilizador — a
  rotação 2D de uma elipse alterna visualmente entre "fina" e "larga", dando uma ilusão de flip muito
  mais parecida com uma moeda real do que o `CoinFront`. `LoadingCoinComponent`/`app-loading-coin`
  mantêm nome e API (`message`, `size`) — só a implementação interna muda — para não obrigar a tocar
  no único consumidor (`dashboard.component.html`).
- **Mapeamento do menu lateral** (aprovado pelo utilizador):
  Dashboard→`Gauge`, Estatísticas→`ChartBar`, Bancos→`Bank`, Contas→`Wallet`,
  Cartões de Crédito→`CreditCard`, Transações→`ArrowsLeftRight`, Despesas Recorrentes→`Repeat`,
  Categorias→`Tags`, Utilizadores→`Users`. `MenuItem.icon` muda de `string` livre para `IconName`
  (tipo já exportado por `icon.component.ts`), removendo a possibilidade de apontar para um ficheiro
  que não existe.
- **Mapeamento dos 19 desenhos de SVG inline** (ver tabela completa na secção 3) — escolhido por
  correspondência de forma/semântica ao desenho original, não por gosto pessoal; sempre que o mesmo
  desenho aparece com variante preenchida (`fill`) e variante contorno (`stroke`) para a mesma ação
  (ex.: "Editar" e "Eliminar" têm as duas variantes espalhadas pelo código), mapeiam para o **mesmo**
  nome Dazzle — o próprio `app-icon` já normaliza a diferença.
- **Correção dos seletores CSS que deixam de alcançar o SVG (item D).** Em vez de manter hacks
  `path`/`svg` a apontar para dentro do componente filho, passam a usar a cor via `color` no próprio
  `<app-icon>` (ou no wrapper), aproveitando que o `IconComponent` já resolve `color: currentColor` no
  seu SVG interno e por isso herda o `color` do ancestral normalmente. Em `footer.component.css` isto
  reduz ~45 linhas de regras `!important` por-forma a 2 regras simples de `color`.
  **Alternativa rejeitada:** `::ng-deep` para manter os seletores antigos — rejeitada por ser uma API
  depreciada pelo Angular e por esconder a causa raiz (o ícone deixou de ser um `<svg>` cru).
- **Tamanho dos ícones `saldo-icon`/`entradas-icon`/`saidas-icon`/`balanco-icon` (dashboard e
  estatísticas) passa a fixo via `[size]="48"` no template, em vez de via CSS.** Isto significa perder
  o ajuste responsivo que existia (`48px` → `40px` abaixo de `768px`, definido em
  `estatisticas.component.css:184-190`) — aceite como simplificação menor porque o tamanho do ícone
  não é dimensionável por CSS externo depois de passar a ser controlado pelo `[size]` do componente
  (o `width`/`height` do SVG interno vêm do input, não da caixa do *host*). Registado como item em §7
  para decisão futura se o utilizador quiser manter o comportamento responsivo (exigiria um
  `[size]` computado por `HostListener`/breakpoint no TS, fora do âmbito desta mudança de ícones).
- **`entity-card.component.html` (item E) é corrigido apesar de não estar em uso em produção** — pedido
  explícito do utilizador ("tmb todos os que estiverem em svg no código") e é o componente mostrado no
  catálogo do Storybook.
- **Não se toca nos listares (`bancos-listar`, `contas-listar`, etc.) para passarem a usar
  `entity-card`** — isso seria uma refatorização de arquitetura distinta (unificar markup duplicado em
  componente partilhado), fora do pedido, que era só sobre ícones. Registado em §7.
- **`.btn-spinner` do `ButtonComponent` não é tocado** — já é um anel CSS puro (`border-radius: 50%` +
  `border-right-color: transparent`), não é um SVG e já corresponde visualmente ao que o utilizador
  pediu para o loading ("apenas icon... com a linha à volta").

**Alternativa rejeitada (loading):** substituir a moeda por um ícone completamente genérico
(`CircleNotch`) sem qualquer ligação a dinheiro — rejeitada pelo utilizador, que preferiu manter a
referência temática de moeda através do `CoinFront`.

## 3. Implementação

Trabalho por fases pequenas e committáveis — cada uma isola um tipo de ficheiro (evita misturar
`.ts`/`.html`/`.css` de features não relacionadas no mesmo commit maior que o necessário).

1. **Loading (`app-loading-coin`)**
   - `loading-coin.component.html` — substituir o `coin-wrapper`/`coin`/`coin-face` por
     `<app-icon name="CoinFront" [size]="size === 'large' ? 64 : 40" class="loading-coin-icon"></app-icon>`.
   - `loading-coin.component.ts` — importar e adicionar `IconComponent` a `imports`.
   - `loading-coin.component.css` — remover `.coin-wrapper`/`.coin`/`.coin-face`/`.coin-shadow` e as
     `@keyframes spinCoin`/`pulseShadow`; adicionar `.loading-coin-icon { animation: spin 1.5s linear
     infinite; color: var(--color-accent, #61edd6); }` e um `@keyframes spin` (rotação simples), mantendo
     `.loading-message`/`pulseText`.

2. **Menu lateral (`MenuService`/`NavComponent`)**
   - `menu.service.ts` — `MenuItem.icon: string` → `icon: IconName` (importar `IconName` de
     `../shared/components/icon/icon.component`); substituir os 9 valores por
     `'Gauge' | 'ChartBar' | 'Bank' | 'Wallet' | 'CreditCard' | 'ArrowsLeftRight' | 'Repeat' | 'Tags' | 'Users'`
     conforme a tabela da secção 2.
   - `nav.component.ts` — importar `IconComponent`, adicionar a `imports`.
   - `nav.component.html` — trocar `<img [src]="item.icon" ...>` por
     `<app-icon [name]="item.icon" [size]="21"></app-icon>`.
   - `nav.component.css` — remover `.nav-icon-img { filter: ...}` e a regra de `filter` no
     `:hover`/`.active`; `.nav-icon` mantém-se (controla o espaço), a cor passa a vir de
     `color` herdado (já definido nas mesmas regras `.nav-link:hover`/`.active`).
   - Apagar `frontend/public/icons/` (9 ficheiros `.svg`).

3. **SVGs inline — tabela de substituição (grupo → nome Dazzle → ficheiros:linha)**

   | Grupo (desenho) | Nome Dazzle | Ocorrências | Ficheiros |
   | :--- | :--- | :---: | :--- |
   | Disquete "Guardar" | `FloppyDisk` | 19 | `bancos-criar/editar`, `cartoes-credito-criar/editar/pagar`, `categorias-criar/editar`, `contas-criar/editar`, `despesas-recorrentes-editar-regra/nova-regra/gerar-transacao/editar-transacao`, `perfil`, `transacoes-criar-credito/entradas/reembolso/saidas`, `transacoes-editar` |
   | Caixote "Eliminar" (preenchido) | `Trash` | 7 | `bancos-listar`, `cartoes-credito-listar`, `categorias-listar`, `contas-listar`, `despesas-recorrentes-listar-regras`, `utilizadores-listar`, `entity-card` |
   | Lápis "Editar" (preenchido) | `Pencil` | 6 | `bancos-listar`, `cartoes-credito-listar`, `categorias-listar`, `contas-listar`, `despesas-recorrentes-listar-regras`, `entity-card` |
   | Funil "Filtros" | `Filter` | 5 | `despesas-recorrentes-listar` (×2), `estatisticas`, `transacoes-listar` (×2) |
   | "+" preenchido "Criar X" | `Plus` | 4 | `bancos-listar`, `cartoes-credito-listar`, `categorias-listar`, `contas-listar` |
   | Seta "Saída" (dashboard/estatísticas/menu/item) | `ArrowDownLeft` | 4 | `despesas-recorrentes-listar`, `estatisticas`, `nova-transacao-menu`, `transacao-item` |
   | "+" contorno "Nova X" | `Plus` | 3 | `despesas-recorrentes-listar`, `despesas-recorrentes-listar-regras`, `nova-transacao-menu` |
   | Lápis "Editar" (contorno) | `Pencil` | 3 | `despesas-recorrentes-listar` (×2), `transacao-item` |
   | Caixote "Eliminar" (contorno) | `Trash` | 3 | `despesas-recorrentes-listar` (×2), `transacao-item` |
   | Seta "Entrada" | `ArrowUpRight` | 3 | `estatisticas`, `nova-transacao-menu`, `transacao-item` |
   | Avatar utilizador | `CircleUser` | 3 | `perfil`, `utilizadores-listar`, `footer` |
   | Carteira "Saldo"/"Balanço" | `Wallet` | 2 | `dashboard`, `estatisticas` |
   | Visto "Concluir" | `Check` | 2 | `despesas-recorrentes-listar`, `transacao-item` |
   | Círculo com visto "Concluído" | `CircleCheck` | 2 | `despesas-recorrentes-listar`, `transacao-item` |
   | "Pagar Cartão" | `CreditCard` | 1 | `cartoes-credito-listar` |
   | 4 linhas "Ver Regras" | `List` | 1 | `despesas-recorrentes-listar` |
   | Alternar role (setas cruzadas) | `SwitchHorizontal` | 1 | `utilizadores-listar` |
   | Cartão "Crédito" (nova transação) | `CreditCard` | 1 | `nova-transacao-menu` |
   | Seta a voltar "Reembolso" | `CornerUpLeft` | 1 | `nova-transacao-menu` |

   Para cada ocorrência: substituir o bloco `<svg ...>...</svg>` por
   `<app-icon name="<Nome>" [size]="<width original ou 16>"></app-icon>`, preservando as classes
   existentes (`svg-icon`, `transacao-icon`, `saidas-icon`, etc.) no `<app-icon>` para não perder
   ganchos de `margin`/`color` já definidos, e adicionar `IconComponent` aos `imports` de cada
   componente standalone envolvido (confirmar um a um — a maioria já importa `CommonModule` mas não
   `IconComponent`).

4. **Correção dos seletores CSS (item D)**
   - `dashboard.component.css:263-265` e `estatisticas.component.css:61-63` — trocar
     `.saldo-icon path { stroke: #61edd6; }` (e equivalentes `entradas-icon`/`saidas-icon`/
     `balanco-icon`) por `.saldo-icon { color: #61edd6; }` etc., aplicadas agora ao próprio
     `<app-icon class="saldo-icon">`; adicionar `[size]="48"` no template (ver Decisão em §2) e remover
     as regras `width`/`height`/media-query de 40px que deixam de ter efeito.
   - `perfil.component.css:1-5` e `utilizadores-listar.component.css:1-5` — remover o bloco
     `:host .card-icon--circle svg { width/height: 50px; }` e passar `[size]="50"` diretamente no
     `<app-icon name="CircleUser">` do respetivo template.
   - `footer.component.css:102-149` — substituir todo o bloco por:
     ```css
     .login_flags .login-link.user app-icon { color: #e2e8f0; }
     .login_flags .login-link.user:hover app-icon,
     .login_flags .login-link.user:focus app-icon { color: #61edd6; }
     ```
     e passar `[size]="18"` no `<app-icon name="CircleUser">` do template do footer.

5. **`entity-card.component.html` (item E)**
   - Linha 17-19: remover o `<svg *ngIf="!editIcon">` e usar sempre `<app-icon [name]="editIcon ||
     'Pencil'" [size]="16"></app-icon>` (default sensato quando `editIcon` não é passado).
   - Linha 32: substituir o `<svg>` do botão "Eliminar" por `<app-icon name="Trash" [size]="16">`.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros pré-existente a esta data.
- `cd frontend && npm test` — Karma/Jasmine; sem baseline de testes a falhar previamente.
- **Não verificável nesta sessão** (sem browser interativo/Cypress a correr): confirmação visual de
  que cada ícone renderiza no tamanho e cor certos em todos os 33 ecrãs, e que o Storybook
  (`npm run storybook`) mostra `loading-coin` e `entity-card` corretamente. Ver `RESULT.md` §4 para o
  que fica pendente e como validar manualmente.

## 5. Riscos

- **Risco:** algum template esquecido continua a importar `IconComponent` em falta e o build falha por
  `app-icon` não reconhecido. **Mitigação:** `npm run build` (fase 4) apanha isto de imediato — é erro
  de compilação do Angular, não um erro silencioso.
- **Risco:** perda do redimensionamento responsivo dos ícones de saldo/entradas/saídas/balanço em ecrãs
  `< 768px` (ver Decisão em §2). **Mitigação:** visualmente é uma diferença menor (ícone ligeiramente
  maior em mobile); documentado explicitamente para decisão futura em §7.
- **Risco:** o ícone `CoinFront` (contorno, `stroke-width: 2`) parecer visualmente pequeno/fino em
  comparação com a antiga moeda 3D grande. **Mitigação:** tamanho generoso (`40`/`64`px conforme
  `size`) e cor de destaque (`--color-accent`) para manter a mesma presença visual.
- **Risco:** algum seletor CSS `svg`/`path` fora dos 6 ficheiros identificados na secção 1-D não ter
  sido apanhado pelo grep (`grep -rn "svg\|path {" --include=*.css`). **Mitigação:** grep cobriu **todos**
  os ficheiros `.css` do projeto, não uma amostra — risco residual muito baixo, mas a build/inspeção
  visual da fase 4 é a rede de segurança final.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Loading | `loading-coin.component.{ts,html,css}` | A |
| 2 | Menu lateral | `menu.service.ts`, `nav.component.{ts,html,css}`, remoção de `public/icons/*.svg` | B |
| 3 | SVGs inline — formulários criar/editar (Guardar) | `bancos-criar/editar`, `cartoes-credito-criar/editar/pagar`, `categorias-criar/editar`, `contas-criar/editar`, `despesas-recorrentes-editar-regra/nova-regra/gerar-transacao/editar-transacao`, `perfil`, `transacoes-criar-*/editar` (`.html` + `.ts` para import de `IconComponent`) | C |
| 4 | SVGs inline — listagens (Eliminar/Editar/Criar/Filtros) | `bancos-listar`, `cartoes-credito-listar`, `categorias-listar`, `contas-listar`, `despesas-recorrentes-listar`, `despesas-recorrentes-listar-regras`, `transacoes-listar`, `utilizadores-listar`, `estatisticas` | C |
| 5 | SVGs inline — transação/menu de nova transação | `transacao-item`, `nova-transacao-menu` | C |
| 6 | Avatares de utilizador + CSS associado | `perfil`, `utilizadores-listar`, `footer` (`.html` + `.css`) | C, D |
| 7 | Cores de ícones dashboard/estatísticas | `dashboard.component.{html,css}`, `estatisticas.component.{html,css}` | D |
| 8 | `entity-card` (Storybook) | `entity-card.component.html` | E |

## 7. Fora de âmbito / handoff

- **Unificar os listares (`bancos-listar`, `contas-listar`, `cartoes-credito-listar`,
  `categorias-listar`, `despesas-recorrentes-listar-regras`) para usarem `<app-entity-card>`** em vez
  de markup duplicado próprio — reduziria drasticamente a duplicação de SVGs encontrada nesta
  investigação, mas é uma refatorização de arquitetura distinta do pedido ("trocar ícones").
- **Redimensionamento responsivo dos ícones de saldo/entradas/saídas/balanço** (perdido nesta mudança,
  ver §2/§5) — decisão do utilizador se vale a pena reintroduzir via um `[size]` computado por
  breakpoint.
- **Verificação visual em browser real de todos os 33 ecrãs e do Storybook** — não disponível nesta
  sessão; ver `RESULT.md` §4.
