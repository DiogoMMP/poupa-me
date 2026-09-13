# F0005 — RESULT

| | |
| :--- | :--- |
| **Tipo** | Feature (experimental, a validar visualmente pelo utilizador) |
| **Branch** | `feature/sidebar-menu-melhorias` (base: `develop`) |
| **Estado** | Implementado — ainda a receber ajustes visuais em conjunto com o utilizador |
| **Build** | `cd frontend && npm run build` — verde; bundle inicial 435.45 kB (baseline pós-F0004: 435.34 kB, sem alteração relevante — é CSS, não JS) |
| **Testes** | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8/8 SUCCESS (baseline igual; nenhum spec cobre layout/CSS) |
| **Commits** | Ainda não committado |

## 1. O que foi fechado

- **A.** `_tokens.css` — novo `--sidebar-width-collapsed: 68px`.
- **B.** `app-layout.component.css` — `.sidebar` recolhida por omissão no desktop, expande em
  `:hover` (só em dispositivos com apontador real, `@media (hover: hover) and (min-width: 601px)`).
  `.main-wrapper` fixo na largura recolhida (a expansão sobrepõe-se ao conteúdo, não o empurra).
  Nível "tablet" (601-768px) unificado com o desktop — deixou de ter uma largura própria.
- **C.** `nav.component.css` — `.nav-label` esconde-se via `display:none` quando recolhida; ícones
  centrados na faixa (`justify-content: var(--rail-justify)`).
- **D.** `header.component.{html,css}` — título "Poupa-Me" esconde-se, logo com tamanho fixo (36px,
  antes era 20% da largura — ficava minúsculo a 68px) e centrado quando recolhido; seletor de banco
  (F0003) esconde-se por completo.
- **E.** `footer.component.css` — só o ícone do utilizador fica visível quando recolhida; nome,
  "Sair"/"Entrar" e copyright escondem-se.
- **F.** `not_found.component.css`, `not_authorized.component.css` — offset de conteúdo fixo na
  largura recolhida; bloco de breakpoint "tablet" (1024px) removido por redundante.

## 2. Pontos que precisam de decisão

- Nenhum por resolver — as duas decisões que surgiram durante a implementação (rodapé: ícone-só vs.
  esconder tudo; ver §3) já foram respondidas pelo utilizador em tempo real.

## 3. Desvios face ao plano aprovado

O `README.md` §2 previa: (a) coordenação via `opacity`/`max-height` nas custom properties, e (b)
esconder o rodapé por completo (mesmo tratamento do seletor de banco). Nenhuma das duas sobreviveu
ao teste visual — ambas foram substituídas durante a implementação, em resposta direta a feedback do
utilizador a testar em paralelo:

- **Rodapé: ícone do utilizador fica sempre visível, só o texto esconde** — decisão do utilizador
  (opção escolhida entre "só o ícone" vs. "rodapé todo escondido"), ao contrário do que o `README.md`
  assumia por defeito (mesmo tratamento do banco).
- **Mecanismo trocado de `opacity`/`max-height` para `display: none`.** `max-height` só colapsa
  altura — não tem efeito nenhum a esconder um irmão numa *linha* horizontal (ex.: o botão "Sair" ao
  lado do ícone do utilizador, dentro de `.user-info` que é `flex-direction: row`): ficava
  invisível mas continuava a ocupar largura, deixando uma caixa clicável fantasma e o ícone
  descentrado. `display: none` retira o elemento do fluxo em qualquer direção, resolvendo isto de
  forma uniforme para pilhas verticais e linhas horizontais.
- **Bug real encontrado e corrigido: uma regra CSS pré-existente, mais específica, vencia a nova.**
  `.login_flags .login-link, .login_flags .logout-btn { display: inline-flex; ... }`
  (especificidade de 2 classes) continuava a forçar `display: inline-flex` no botão "Sair"
  independentemente do valor da custom property, porque a meu ver a nova regra usava seletores menos
  específicos. Corrigido separando essa regra em duas — uma para `.user` (sempre visível) e outra
  para `:not(.user)` (controlada pela custom property) — ambas com especificidade igual ou superior à
  regra original.
- **Bug real encontrado e corrigido: `box-sizing` (2ª e 3ª ocorrência nesta sessão).** `.app-footer`
  e `.login_flags` tinham `width: 100%` + `padding` sem `box-sizing: border-box` — o mesmo padrão já
  visto no header da F0003 (RESULT §3), fazendo-os transbordar a sidebar e ficar cortados de forma
  assimétrica pelo `overflow-x: hidden` do `.sidebar`, descentrando o ícone do utilizador.
  **Por já ter acontecido 3 vezes em componentes diferentes**, em vez de continuar a corrigir
  caso a caso, adicionado um **reset global `*, *::before, *::after { box-sizing: border-box; }`**
  em `frontend/src/styles.css` — elimina esta classe de bug em toda a app de uma vez (prática
  standard, usada por Bootstrap/Tailwind por omissão). **Não previsto no plano.** É uma mudança de
  maior alcance do que só a sidebar — não verificada visualmente no resto da app nesta sessão (ver
  §4).
- **Logo do header: tamanho fixo (36px) em vez de `width: 20%`** — a percentagem foi pensada para os
  250px antigos; a 68px encolhia para ~14px, ilegível. Não estava explicitamente no plano mas é
  consequência direta e necessária de introduzir a largura recolhida.
- **Expansão da sidebar ao passar o rato tornada instantânea** (`transition: width 0s` no estado
  `:hover`), mantendo só o fecho suave (200ms). Descoberto durante o teste: como o texto
  (`display:none→inline-flex`) aparece de imediato ao entrar em `:hover`, esperar pela transição de
  largura deixava uma janela onde o texto já estava visível mas a faixa ainda não tinha alargado o
  suficiente, cortando-o a meio.

## 4. Não verificado nesta sessão

- **Efeito do reset global de `box-sizing` no resto da app** (fora do layout da sidebar) — é a
  correção com maior alcance desta sessão e não foi possível percorrer visualmente todos os ecrãs
  para confirmar que nenhum outro elemento com `width`/`padding` explícitos mudou de aspeto.
  Recomenda-se uma passagem visual geral antes de abrir o PR.
- **Confirmação visual final do resultado desta feature como um todo** — a sessão terminou com o
  utilizador ainda a testar iterativamente (logo, ícone do rodapé); build/testes não substituem essa
  verificação.
- **Comportamento em `not_found`/`not_authorized`** — só verificado por leitura de código, não em
  browser.
- **`npm run test:ci` (Cypress e2e)** e **Storybook** não corridos.

## 5. Como correr a verificação

- `cd frontend && npm run build` — confirma compilação sem erros.
- `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8 specs (sem cobertura de
  layout).
- Inspeção manual: `cd frontend && npm start`, testar em janela ≥601px com rato (hover a expandir/
  encolher a sidebar), confirmar mobile (<601px) inalterado, e percorrer visualmente outras páginas
  da app para validar o reset global de `box-sizing`.

## 6. Inventário de alterações

**Alterado:**
- `frontend/src/styles/_tokens.css` — novo `--sidebar-width-collapsed`.
- `frontend/src/styles.css` — reset global `box-sizing: border-box`.
- `frontend/src/app/layout/app-layout.component.css` — sidebar recolhível + hover.
- `frontend/src/app/layout/nav/nav.component.css` — labels do menu escondem-se.
- `frontend/src/app/layout/header/header.component.{html,css}` — título e seletor de banco
  escondem-se; logo com tamanho fixo.
- `frontend/src/app/layout/footer/footer.component.css` — nome/login-out/copyright escondem-se;
  correção de especificidade CSS; `box-sizing`.
- `frontend/src/app/features/not_found/not_found.component.css`,
  `frontend/src/app/features/not_authorized/not_authorized.component.css` — offset de conteúdo
  fixo na largura recolhida.

**Novo:**
- `docs/changes/features/F0005-sidebar-recolhivel-hover/README.md`, `RESULT.md`.
