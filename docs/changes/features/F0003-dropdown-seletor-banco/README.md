# F0003 — Substitui o seletor de banco no header por um dropdown customizado

| | |
| :--- | :--- |
| **Tipo** | Feature (melhoria de UI) |
| **Branch** | `feature/sidebar-menu-melhorias` (base: `develop`) — branch partilhada com a F0002 por decisão do utilizador, embora seja um assunto à parte (não relacionado com a issue #55) |
| **Estado** | Planeado |
| **Âmbito** | Frontend apenas: `HeaderComponent` (`.ts`/`.html`/`.css`) |
| **Verificação** | `cd frontend && npm run build` + `npm test`; inspeção visual manual (sem Cypress a correr nesta sessão) |

## 1. Situação

O seletor do banco atualmente ativo vive no `HeaderComponent`
([`frontend/src/app/layout/header/header.component.html:8-20`](../../../../frontend/src/app/layout/header/header.component.html)),
visível em todas as páginas, por baixo do logótipo.

**Evidência:**

- É um `<select>` nativo do browser (`class="select-banco"`), esticado a 95% da largura do header
  (98% em mobile), sem qualquer estilo além do que o browser dá por omissão.
- Cada `<option>` mostra `{{ banco.icon }} {{ banco.nome }}` — `banco.icon` é um emoji de texto livre
  escolhido pelo utilizador ao criar o banco (`BancosDTO.icon: string`, ver
  [`bancos.dto.ts`](../../../../frontend/src/app/features/bancos/dto/bancos.dto.ts)), não um ícone da
  Dazzle Icons — são conceitos diferentes (emoji por-banco vs. ícones de chrome da app).
- `HeaderComponent.loadBancos()` chama `BancosService.getAll()`; enquanto a resposta não chega, o
  `<select>` fica apenas com a opção "Selecionar Banco", sem indicação de que está a carregar.
- Se `bancos()` vier vazio (0 bancos criados, ou erro 401 silenciado), o `<select>` fica só com
  "Selecionar Banco" — nenhum convite para criar o primeiro banco.
- Sem ordenação explícita — a ordem é a que a API devolver.
- `SelectedBancoService` (estado partilhado + persistência em `localStorage` por utilizador) já está
  correto e não precisa de alterações — só o consumidor (`HeaderComponent`) muda.
- Já existe no código um padrão de dropdown customizado equivalente:
  [`NovaTransacaoMenuComponent`](../../../../frontend/src/app/shared/components/nova-transacao-menu/nova-transacao-menu.component.ts)
  — signal `showMenu`, `toggleMenu()` com `stopPropagation()`, e
  `@HostListener('document:click')` para fechar ao clicar fora. Não existe nenhum componente
  `shared/components/` genérico de "dropdown"/"select" para reaproveitar diretamente.

**Inventário (superfícies afetadas):**

- **A.** `HeaderComponent` (template, classe, estilos) — único ficheiro a mudar de facto.

**Escala:** 1 componente, ~15 linhas de template a substituir por um dropdown customizado com 3
estados (normal, a carregar, vazio) e navegação por teclado.

## 2. Resultado pretendido

O `<select>` nativo dá lugar a um dropdown customizado: um botão-gatilho que mostra o banco
atualmente selecionado (emoji + nome, ou um texto de estado quando não há seleção/está a carregar/
está vazio) com uma seta (`app-icon`) que roda consoante o estado aberto/fechado, e uma lista
suspensa estilizada com todos os bancos, ordenados alfabeticamente, destacando o banco ativo.

**Decisões:**

- **Implementado diretamente em `HeaderComponent`, sem extrair para `shared/components/`.** É usado
  uma única vez (no header); extrair já seria desenhar para um caso de reutilização hipotético que
  não existe hoje.
- **Padrão de interação copiado de `NovaTransacaoMenuComponent`** (signal de visibilidade,
  `stopPropagation()` no clique do gatilho, `@HostListener('document:click')` para fechar fora) — para
  manter consistência com o único outro dropdown já existente na app, em vez de inventar um padrão
  novo.
- **Acessibilidade por teclado, para não perder o que o `<select>` nativo já dava de graça:**
  `Enter`/`Espaço` no gatilho abrem/fecham; `Escape` fecha e devolve o foco ao gatilho; `ArrowDown`/
  `ArrowUp` navegam pelas opções da lista; `Enter` numa opção focada seleciona. ARIA:
  `role="listbox"`/`role="option"` na lista, `aria-expanded`/`aria-haspopup="listbox"` no gatilho,
  `aria-selected` na opção ativa.
- **Ordenação alfabética por `banco.nome`** (`localeCompare`, sensível a acentos PT-PT) — corrige a
  ausência de ordenação atual, sem pedir confirmação por ser um comportamento estritamente melhor e
  sem ambiguidade de design.
- **3 estados no gatilho:** `"A carregar bancos..."` (desativado, enquanto `loadBancos()` está em
  voo), `"Criar o primeiro banco"` com link para `/bancos/criar` (quando `bancos()` carregou vazio),
  `"Selecionar Banco"` (carregado, sem seleção) ou `{{ icon }} {{ nome }}` do banco selecionado.
  **Alternativa rejeitada:** manter sempre "Selecionar Banco" como placeholder mesmo com a lista
  vazia — rejeitada por ser exatamente a lacuna reportada pelo utilizador na conversa que motivou esta
  mudança.
- **Seta usa `app-icon` (`ChevronDown` fechado / `ChevronUp` aberto)** — consistente com a F0002
  (migração de ícones para Dazzle Icons), já mergeada na mesma branch.

## 3. Implementação

1. **`header.component.ts`**
   - Adicionar `sortedBancos = computed(() => [...this.bancos()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')))`.
   - Adicionar `isLoading = signal(true)` (true até `loadBancos()` resolver, sucesso ou erro).
   - Adicionar `showMenu = signal(false)`, `activeIndex = signal(-1)` (índice da opção focada por teclado).
   - `toggleMenu(event)`, `closeMenu()` (via `@HostListener('document:click')`), `selectBanco(banco)`
     (chama `onBancoChange` existente e fecha o menu), seguindo o padrão de
     `NovaTransacaoMenuComponent`.
   - Métodos de teclado: `onTriggerKeydown(event)` (Enter/Espaço/ArrowDown abrem e movem foco para a
     lista), `onListKeydown(event)` (ArrowUp/ArrowDown movem `activeIndex`, Enter seleciona, Escape
     fecha e devolve foco ao gatilho).
   - Importar `IconComponent`.

2. **`header.component.html`**
   - Substituir o bloco `<div class="banco-selector"><select>...</select></div>` por:
     - Um `<button type="button" class="banco-trigger" [attr.aria-expanded]="showMenu()" aria-haspopup="listbox">`
       com o texto de estado (carregando/vazio/placeholder/banco selecionado) e
       `<app-icon [name]="showMenu() ? 'ChevronUp' : 'ChevronDown'" [size]="16">`.
     - Um `<ul class="banco-list" role="listbox" *ngIf="showMenu()">` com `<li role="option" *ngFor="let banco of sortedBancos(); let i = index">` — cada item mostra `{{ banco.icon }} {{ banco.nome }}`, `[class.active]="banco.id === selectedBancoId()"`, `[class.focused]="i === activeIndex()"`.
     - Estado vazio dentro da lista (ou só no gatilho, a decidir na implementação consoante o que
       ficar mais limpo visualmente) com link `routerLink="/bancos/criar"`.

3. **`header.component.css`**
   - Remove `.select-banco`; adiciona estilos para `.banco-trigger` (botão com aparência semelhante ao
     `<select>` atual em tamanho/posição, mas com bordas/hover consistentes com o resto da app),
     `.banco-list` (posicionamento absoluto, `max-height` com scroll, sombra), `.banco-list li:hover`/
     `.focused`/`.active`.

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros pré-existente.
- `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8/8 (baseline atual); sem
  spec a cobrir `HeaderComponent` hoje, não há regressão a validar por teste automático.
- **Não verificável nesta sessão:** navegação por teclado e leitor de ecrã reais (sem browser
  interativo). Ver `RESULT.md` §4.

## 5. Riscos

- **Risco:** perder acessibilidade por teclado que o `<select>` nativo dava de graça.
  **Mitigação:** implementar explicitamente `Enter`/`Espaço`/`ArrowUp`/`ArrowDown`/`Escape` e ARIA
  (`role="listbox"`/`option`, `aria-expanded`, `aria-selected`) — ver §2/§3. Fica por confirmar
  manualmente com um leitor de ecrã real (§4).
- **Risco:** o `@HostListener('document:click')` fechar o menu antes do `(click)` de seleção da opção
  disparar (ordem de eventos). **Mitigação:** `stopPropagation()` no clique do gatilho e das opções,
  igual ao padrão já testado em `NovaTransacaoMenuComponent`.
- **Risco:** lista de bancos muito longa sem scroll acessível. **Mitigação:** `max-height` +
  `overflow-y: auto` em `.banco-list`.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Dropdown customizado do seletor de banco | `header.component.{ts,html,css}` | A |

## 7. Fora de âmbito / handoff

- **Extrair um componente `shared/components/dropdown`/`select` genérico** para reutilização futura —
  não há hoje um segundo caso de uso que justifique a abstração.
- **Verificação com leitor de ecrã real** — não disponível nesta sessão; ver `RESULT.md` §4.
