# F0003 — RESULT

| | |
| :--- | :--- |
| **Tipo** | Feature |
| **Branch** | `feature/sidebar-menu-melhorias` (base: `develop`) |
| **Estado** | Implementado |
| **Build** | `cd frontend && npm run build` — verde; bundle inicial 390.99 kB (baseline pós-F0002: 385.85 kB — aumento de ~5 kB pela lógica extra do dropdown, dentro do orçamento) |
| **Testes** | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8/8 SUCCESS (baseline igual; não existe spec para `HeaderComponent`, ver §4) |
| **Commits** | Ainda não committado |

## 1. O que foi fechado

- **A. `HeaderComponent`.** O `<select>` nativo foi substituído por um dropdown customizado:
  - Botão-gatilho (`.banco-trigger`) mostrando o banco selecionado (`{{ icon }} {{ nome }}`), com seta
    `app-icon` (`ChevronDown`/`ChevronUp` conforme o estado aberto/fechado).
  - 3 estados no gatilho: `"A carregar bancos..."` (desativado, `isLoading()`), link
    `"Criar o primeiro banco"` para `/bancos/criar` (quando a lista carrega vazia), ou
    `"Selecionar Banco"`/banco ativo.
  - Lista suspensa (`role="listbox"`) com todos os bancos ordenados alfabeticamente
    (`localeCompare(..., 'pt')`), destacando o banco ativo (`.active`).
  - Navegação por teclado: `Enter`/`Espaço`/`ArrowDown` no gatilho abrem e focam a primeira opção;
    `ArrowUp`/`ArrowDown` na lista navegam (roving `tabindex`, foco real por elemento);
    `Enter` numa opção seleciona; `Escape` fecha e devolve o foco ao gatilho.
  - Fecha ao clicar fora (`@HostListener('document:click')`), com `stopPropagation()` nos cliques
    internos — mesmo padrão já usado em `NovaTransacaoMenuComponent`.
  - `SelectedBancoService` não foi tocado, como previsto no plano.

## 2. Pontos que precisam de decisão

- Nenhum surgiu durante a implementação que não estivesse já coberto pelas decisões do `README.md`.

## 3. Desvios face ao plano aprovado

- **Bug real encontrado e corrigido, não previsto no plano: `.app-header` transbordava a sidebar e
  era cortado à direita.** Depois de implementado, o utilizador reportou repetidamente "falta padding
  à direita" com screenshots. Duas correções de `box-sizing`/largura no `.banco-trigger`/`.banco-list`
  não resolveram porque não eram a causa. A causa real: `.app-header` tem `width: 100%` **e**
  `padding: 0.75rem 0.5rem` sem `box-sizing: border-box` — em `content-box` (default), o padding
  soma-se à largura, fazendo o header transbordar ~16px para a direita do seu contentor
  (`<aside class="sidebar">`, que tem `overflow-x: hidden`). Esse excesso ficava cortado, dando a
  ilusão de "falta de padding à direita" em tudo o que estava dentro do header (logo e seletor de
  banco), quando na realidade o conteúdo estava a ser fisicamente cortado. Corrigido com
  `box-sizing: border-box` em `.app-header`, e removida a assimetria adicional que existia em
  `.logo-link { padding-left: 0.5rem }` (sem equivalente à direita, também sem justificação clara).
  Diagnosticado com a ajuda do utilizador via DevTools (Elements + Computed) depois de duas tentativas
  falhadas de correção só no componente do dropdown.

## 4. Não verificado nesta sessão

- **Navegação por teclado e leitor de ecrã reais.** A implementação segue o padrão ARIA
  `role="listbox"`/`role="option"` + `aria-expanded`/`aria-selected` e roving `tabindex`, mas não foi
  testada com um leitor de ecrã real nem com um browser interativo (sem ferramenta de screenshot/
  automação de browser disponível nesta sessão).
- **Inspeção visual** do dropdown em `npm start` (posicionamento da lista, scroll com muitos bancos,
  aparência em mobile) — recomenda-se confirmar visualmente antes de abrir o PR.
- **`npm run test:ci` (Cypress e2e)** não foi corrido.

## 5. Como correr a verificação

- `cd frontend && npm run build` — confirma que compila sem erros e que o bundle inicial não regride
  de forma anómala (~391 kB esperado, vs. ~386 kB antes desta mudança).
- `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8 specs (sem cobertura direta
  do `HeaderComponent`).
- Inspeção manual: `cd frontend && npm start`, testar o dropdown com rato e com teclado (Tab até ao
  gatilho, Enter/setas/Escape), e com 0/1/muitos bancos criados.

## 6. Inventário de alterações

**Alterado:**
- `frontend/src/app/layout/header/header.component.ts` — lógica do dropdown (`showMenu`,
  `activeIndex`, `sortedBancos`, `selectedBanco`, `isLoading`, navegação por teclado).
- `frontend/src/app/layout/header/header.component.html` — `<select>` → botão-gatilho + lista
  suspensa customizada.
- `frontend/src/app/layout/header/header.component.css` — estilos do `.banco-trigger`/`.banco-list`
  substituem `.select-banco`.

**Novo:**
- `docs/changes/features/F0003-dropdown-seletor-banco/README.md`, `RESULT.md`.
