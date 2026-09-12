# F0004 — Extrai o dropdown do seletor de banco para um componente partilhado e substitui todos os `<select>` nativos

| | |
| :--- | :--- |
| **Tipo** | Feature (unificação de sistema de formulários) |
| **Branch** | `feature/sidebar-menu-melhorias` (base: `develop`) — continuação direta da F0003 |
| **Estado** | Planeado |
| **Âmbito** | Frontend: novo `shared/components/select/`, refactor de `HeaderComponent` (F0003) para o consumir, e migração de todos os `<select>` nativos em 12 componentes de features |
| **Verificação** | `cd frontend && npm run build` + `npm test`; inspeção visual manual (sem Cypress a correr nesta sessão) |

## 1. Situação

A F0003 criou um dropdown customizado só para o seletor de banco do header. O resto da app ainda usa
`<select>` nativo em **38 ocorrências, em 12 ficheiros**, com um estilo global consistente
(`select { ... }` em [`frontend/src/styles/_forms.css:2-27`](../../../../frontend/src/styles/_forms.css)).

**Evidência (inventário completo por grep):**

| Ficheiro | Selects | Padrão |
| :--- | :---: | :--- |
| `cartoes-credito/components/criar` | 1 | `formControlName`, lista dinâmica (conta), placeholder desativado |
| `cartoes-credito/components/editar` | 1 | idem |
| `despesas-recorrentes/components/editar-regra` | 6 | `formControlName`, mistura de enum estático (`tipo`, `diaDaSemana`) e listas dinâmicas (`categoriaId`, `contaOrigemId`, `contaDestinoId`, `contaPoupancaId`), `[ngValue]="null"` como "vazio" |
| `despesas-recorrentes/components/nova-regra` | 6 | idem a `editar-regra` |
| `despesas-recorrentes/components/listar` | 3 | `[(ngModel)]`, filtros com opção "Todas/Qualquer" real (não placeholder) |
| `estatisticas/components/estatisticas` | 2 | `[(ngModel)]`, filtros mês/ano |
| `transacoes/components/criar-credito` | 2 | `formControlName`, listas dinâmicas |
| `transacoes/components/criar-entradas` | 2 | idem |
| `transacoes/components/criar-reembolso` | 2 | idem |
| `transacoes/components/criar-saidas` | 2 | idem |
| `transacoes/components/editar` | 4 | `formControlName`, inclui enum estático (`status`) e opcionais com `value=""` real ("Nenhuma/Selecionar") |
| `transacoes/components/listar` | 7 | `[(ngModel)]`, filtros (2 grupos: por conta, por cartão) |

**Inventário (superfícies afetadas):**

- **A.** Novo componente `shared/components/select/` (`SelectComponent`, `ControlValueAccessor`).
- **B.** `HeaderComponent` (F0003) — refatorado para consumir `<app-select>` em vez do dropdown
  bespoke próprio, eliminando duplicação de lógica de teclado/abrir-fechar.
- **C.** Os 12 ficheiros da tabela acima — 38 `<select>` → `<app-select>`.

**Escala:** 1 componente novo, 1 refactor, 38 substituições em 12 formulários reais de produção
(criar/editar transações, contas, cartões, regras recorrentes, filtros de listagens).

## 2. Resultado pretendido

Um único componente `<app-select>`, reutilizável em qualquer formulário (Reactive Forms via
`formControlName`, ou template-driven via `[(ngModel)]`), com a mesma aparência/UX em toda a app:
dropdown customizado, ícone `app-icon` (chevron), navegação por teclado, ordenação **não forçada**
(mantém a ordem que cada consumidor já usa — só o header ordena alfabeticamente, por decisão
específica da F0003).

**Decisões:**

- **`SelectComponent` implementa `ControlValueAccessor`** (`NG_VALUE_ACCESSOR`), para funcionar
  como substituto direto de `<select>` tanto em `formControlName` como em `[(ngModel)]`, sem tocar
  na lógica dos formulários/view-models — só o template muda.
- **API: `@Input() options: AppSelectOption[]`** com `interface AppSelectOption { value: any; label:
  string }`. Os consumidores constroem a label já com ícone incluído (`` `${icon} ${nome}` ``), tal
  como já faziam no `<option>` — sem input `bindLabel`/`bindValue` separado, para não desviar da
  forma como os dados já chegam nos templates atuais.
  **Alternativa rejeitada:** aceitar objetos arbitrários + `bindValue`/`bindLabel` (estilo `ng-select`)
  — mais "mágico" e não elimina a necessidade de mapear a label com ícone de qualquer forma.
- **Sem opção de placeholder desativada na lista.** Os `<option value="" disabled>Selecione uma
  categoria</option>` atuais não entram em `options` — o próprio `@Input() placeholder` do
  `app-select` mostra o mesmo texto no gatilho enquanto não há valor, sem entrada morta na lista
  (pequena melhoria de UX, consistente com a F0003).
- **As opções "Todas as categorias"/"Qualquer período"/"Nenhuma/Selecionar conta" (valor `""` real,
  não placeholder) entram em `options` como uma entrada normal** — continuam clicáveis/selecionáveis
  como qualquer outra, porque são valores de filtro genuínos, não dicas.
- **`HeaderComponent` (F0003) é refatorado para usar `<app-select>`** em vez de manter a sua própria
  cópia da lógica de dropdown — elimina duplicação entre F0003 e F0004. `SelectedBancoService`
  continua intocado.
- **Implementa `ControlValueAccessor` completo, incluindo `setDisabledState`**, mesmo sem nenhum
  `[disabled]`/`.disable()` a usar isso hoje (confirmado por grep) — é parte do contrato da interface
  e barato de implementar; evita surpresas se um form futuro desativar um destes controlos.
- **Estilo visual replica o `select` global existente** (`_forms.css:2-27`: fundo
  `rgba(255,255,255,0.08)`, borda `rgba(255,255,255,0.12)`, `border-radius:6px`, foco com
  `var(--brand-accent)`), em vez do estilo específico que a F0003 desenhou só para o header — para
  não mudar a aparência visual dos formulários existentes, só o mecanismo.

## 3. Implementação

1. **`shared/components/select/select.component.ts`** — `SelectComponent`, standalone,
   `ChangeDetectionStrategy.OnPush`, `providers: [{provide: NG_VALUE_ACCESSOR, useExisting:
   forwardRef(() => SelectComponent), multi: true}]`. Inputs: `options: AppSelectOption[]`,
   `placeholder: string`. Implementa `writeValue`/`registerOnChange`/`registerOnTouched`/
   `setDisabledState`. Reaproveita o padrão de interação já validado na F0003 (signals `showMenu`/
   `activeIndex`, `toggleMenu`/`closeMenu` via `@HostListener('document:click')`, navegação por
   teclado `ArrowUp`/`ArrowDown`/`Enter`/`Escape`, `role="listbox"`/`option`, roving `tabindex`).

2. **`select.component.html`/`.css`** — mesma estrutura de template da F0003 (gatilho + lista),
   estilo alinhado ao `select` global (ver Decisão em §2).

3. **`header.component.ts`/`.html`/`.css`** — remove `showMenu`/`activeIndex`/`sortedBancos`/
   `onTriggerKeydown`/`onListKeydown`/etc.; passa a `<app-select [options]="bancoOptions()"
   [placeholder]="..." [ngModel]="selectedBancoId()" (ngModelChange)="onBancoChange($event)">` (ou
   equivalente com `FormControl`, a decidir na implementação consoante o que ficar mais simples dado
   que não há já um `FormGroup` no header). Mantém a lógica de `isLoading`/lista vazia/link para criar
   banco, que é específica deste consumidor.

4. **Migração dos 12 ficheiros** (`<select>` → `<app-select [options]="..." placeholder="...">`,
   ligado via `formControlName`/`[(ngModel)]` exatamente como hoje):
   - Para cada `*ngFor` sobre um observable (`vm.categorias$ | async`), passar
     `[options]="(vm.categorias$ | async)! | toSelectOptions"` — ou, mais simples e sem exigir um pipe
     novo, mapear no próprio template com `*ngIf="vm.categorias$ | async as categorias"` e construir
     `options` a partir de `categorias` inline via um pequeno método no `.ts` do componente
     (`categoriaOptions(categorias)`), a decidir por ficheiro consoante o que já existe.
   - Para os enums estáticos (`tipo`, `diaDaSemana`, `status`, `PERIODS`, `STATUSES`), construir o
     array `options` uma vez (constante no `.ts` ou no view-model, reaproveitando o array já existente
     como `vm.PERIODS`/`vm.STATUSES` quando aplicável).

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros pré-existente.
- `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` — 8/8 (baseline); sem specs
  a cobrir os formulários migrados, não há regressão detetável por teste automático.
- **Não verificável nesta sessão:** submissão real de cada um dos 12 formulários (validação,
  valores enviados à API) — sem browser interativo. Ver `RESULT.md` §4.

## 5. Riscos

- **Risco principal: quebrar a validação/valor de um destes 12 formulários reais** (perder o `value`
  correto ao trocar de `<select>`/`[ngValue]` para o novo componente, especialmente onde o valor
  "vazio" é `null` num sítio e `""` noutro). **Mitigação:** `ControlValueAccessor.writeValue` trata
  `null`/`""`/`undefined` todos como "sem seleção" (mostra placeholder), e `onChange` emite
  exatamente o `value` armazenado em `options` (preservando `null` vs `""` conforme o que já estava
  no array de opções de cada formulário) — não normaliza um no outro.
- **Risco:** esquecer de reproduzir o comportamento "desativado até carregar" em selects que hoje
  ficam vazios enquanto o `| async` não resolve. **Mitigação:** replicar o padrão já testado na F0003
  (estado `isLoading` explícito) onde fizer sentido, ou aceitar lista vazia como estado transitório
  quando o próprio ecrã já mostra um loading global (a maioria destes formulários já tem
  `vm.isLoading$`).
- **Risco:** volume de ficheiros (12) tornar fácil deixar um esquecido ou mal migrado.
  **Mitigação:** grep final `grep -rln "<select" frontend/src/app` deve devolver zero resultados fora
  de `select.component.html` no fim da implementação.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Componente partilhado | `shared/components/select/select.component.{ts,html,css}` | A |
| 2 | Refactor do header (F0003) para o consumir | `header.component.{ts,html,css}` | B |
| 3 | Migração — transações | `transacoes/components/{criar-credito,criar-entradas,criar-reembolso,criar-saidas,editar,listar}` | C |
| 4 | Migração — cartões e despesas recorrentes | `cartoes-credito/components/{criar,editar}`, `despesas-recorrentes/components/{editar-regra,nova-regra,listar}` | C |
| 5 | Migração — estatísticas | `estatisticas/components/estatisticas` | C |

## 7. Fora de âmbito / handoff

- **Storybook para `SelectComponent`** — não pedido explicitamente; pode ser adicionado depois,
  seguindo o padrão dos outros `shared/components/*.stories.ts`.
- **Verificação funcional real de cada formulário submetido** — não disponível nesta sessão; ver
  `RESULT.md` §4.
