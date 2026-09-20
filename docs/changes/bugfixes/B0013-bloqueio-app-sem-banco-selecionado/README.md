# B0013 — Bloqueio único e mensagem clara quando não há banco selecionado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/data-futura-e-banco-nao-selecionado` (base: `develop`) — partilhado com o B0012, a pedido do utilizador |
| **Estado** | Planeado |
| **Âmbito** | 1 componente de layout (overlay global) + 3 view-models sem guarda, várias features |
| **Verificação** | `cd frontend && npm run build` + `npm test` |

## 1. Situação

Issue [#62](https://github.com/DiogoMMP/poupa-me/issues/62): *"Quando não está selecionado nenhum
banco devia aparecer apenas uma msg e não vários erros a dar mensagens genéricas. Já agora a app deve
ficar completamente bloqueada até que seja selecionado um banco."*

**Evidência:**

`SelectedBancoService` (`frontend/src/app/services/selected-banco.service.ts:15`) começa a `null` e
só é definido quando o utilizador escolhe um banco no `<app-select>` do `HeaderComponent`
(`frontend/src/app/layout/header/header.component.ts:86-88`) — **não há nenhuma seleção automática
do primeiro banco** (confirmado por leitura de `SelectedBancoService` e `HeaderComponent`; o
`app-select` genérico também não tem fallback para a primeira opção —
`select.component.ts:73-76`, `value` fica `null` e mostra o placeholder). Um utilizador novo, ou com
o `localStorage` limpo, fica com `selectedBancoId = null` indefinidamente.

Não existe hoje nenhum mecanismo transversal de bloqueio — `frontend/src/app/app.routes.ts` só tem
`RoleGuard`/`NoLoginGuard`, e `app-layout.component.html:29-31` renderiza sempre
`<router-outlet>` sem condição. Cada feature resolve isto isoladamente, e de forma inconsistente:

- **Já guardam** (não chamam o backend, mas cada uma com o seu próprio texto): `dashboard`
  ("Seleciona um banco no menu lateral para ver o teu dashboard."), `estatisticas` ("Selecione um
  banco na lista lateral para ver as estatísticas."), `contas`/`cartoes-credito` (mostram apenas um
  empty-state genérico e enganoso: "Não existem contas/cartões para o banco selecionado.").
- **Não guardam** — chamam o backend com `bancoId=undefined` mesmo sem banco selecionado, e o
  backend devolve **200 com dados de todos os bancos do utilizador** (não filtra, não dá erro):
  `transacoes-listar.view-model.ts:55-77,84-166` (`loadAll`/`loadContaTransacoes`/
  `loadCartaoTransacoes`), `despesas-recorrentes-listar.view-model.ts:104-174`
  (`loadPendentes`/`loadConcluidas` — só `loadDespesasSemValor`, linhas 75-83, já guarda),
  `despesas-recorrentes-listar-regras.view-model.ts:69-82` (`loadData`). Isto é uma **fuga de dados
  entre bancos** do mesmo utilizador, não só um problema de mensagem.

`NotificationService` não deduplica toasts — cada `.error(...)` empilha um novo, por isso, se vários
pedidos em paralelo falharem, aparecem vários toasts genéricos ao mesmo tempo.

O fluxo de escolha de banco é exclusivamente o `<app-select>` no `HeaderComponent`, sempre visível na
sidebar (`app-layout.component.html:9-14`, fora do `<router-outlet>`); a gestão de bancos em si vive
em `/bancos` (`bancos.routes.ts`).

**Inventário (superfícies afetadas):**

- **A.** `AppLayoutComponent` — sem mecanismo de bloqueio/mensagem única.
- **B.** `transacoes-listar.view-model.ts` — sem guarda, fuga de dados entre bancos.
- **C.** `despesas-recorrentes-listar.view-model.ts` (`loadPendentes`/`loadConcluidas`) — idem.
- **D.** `despesas-recorrentes-listar-regras.view-model.ts` — idem.

**Escala:** 6 ficheiros.

## 2. Resultado pretendido

Sem banco selecionado, qualquer rota que dependa de banco (dashboard, contas, cartões, transações,
despesas recorrentes, estatísticas) mostra **uma única mensagem central**, no lugar do conteúdo da
página — nunca o conteúdo em si nem os seus próprios erros. As rotas que não dependem de banco
(`/bancos`, `/categorias`, `/utilizadores`, `/perfil`, `/not-authorized`) continuam acessíveis, para
que o utilizador consiga sempre criar o seu primeiro banco. O seletor de banco na sidebar
(`<app-header>`) fica sempre visível e utilizável, mesmo com o resto bloqueado.

**Decisões:**

- **Overlay reativo em `AppLayoutComponent`, não um guard de rota.** O overlay envolve
  `<router-outlet>` com `*ngIf`, controlado por um `computed()` que combina a rota atual com
  `SelectedBancoService.selectedBancoId$`. Quando bloqueado, o `router-outlet` nem chega a ser
  criado — o componente da rota (e o seu view-model) não instancia, não há pedido HTTP nenhum.
  Ao contrário de um guard (`canActivateChild`), isto reage também a uma mudança de seleção **sem
  navegação** (ex.: o utilizador desmarca o banco enquanto já está em `/transacoes`) — um guard só
  corre em navegações, deixando esse caso por cobrir.
  **Alternativa rejeitada:** um novo `BancoRequiredGuard` (`canActivateChild`) redirecionando para
  uma rota dedicada, replicando o padrão do `RoleGuard`. Rejeitada porque não resolve sozinha o caso
  de desmarcar o banco sem navegar — precisaria de qualquer forma da mesma lógica reativa no layout,
  tornando o guard redundante.
- **Deteção da rota por prefixo de URL fixo**, tal como `RoleGuard.isUrlAllowedByRoute` já faz, em
  vez de propagar `data: { requiresBanco }` pelas rotas — mais simples de verificar e não depende de
  como o Angular funde `data` entre rota pai e filhos lazy-loaded. Lista de prefixos independentes de
  banco: `/bancos`, `/categorias`, `/utilizadores`, `/perfil`, `/not-authorized`.
  **Aceite como limitação menor:** um URL inexistente (caindo no `**`/`not-found`) sem banco
  selecionado mostra o overlay em vez da página 404 — não crítico, e evita complicar a deteção para
  uma rota sem path fixo.
- **`AppLayoutComponent` carrega a sua própria lista de bancos** (`BancosService.getAll()`) para
  distinguir as duas mensagens (zero bancos vs. bancos existem mas nenhum selecionado), em vez de
  partilhar estado com `HeaderComponent`. **Alternativa rejeitada:** expor a lista já carregada pelo
  `HeaderComponent` através de um serviço partilhado — evitaria um pedido HTTP duplicado, mas
  acopla o timing dos dois componentes e introduz uma janela onde o estado "tenho bancos?" é
  desconhecido. Um `GET /banco` extra é barato e mantém os dois componentes independentes.
- **As 3 view-models sem guarda são corrigidas na mesma, como reforço** (decidido com o utilizador):
  mesmo com o overlay a impedir a instanciação destes componentes sem banco selecionado, adicionar a
  guarda diretamente nestes métodos (mesmo padrão já usado em `contas-listar.view-model.ts:45-53` e
  `cartoes-credito-listar.view-model.ts:53-62`) garante que a fuga de dados não pode acontecer mesmo
  que uma rota futura seja adicionada sem passar pelo overlay, ou que estes métodos venham a ser
  chamados de outro sítio.
- **Mensagens de "sem banco" já existentes em `dashboard`/`estatisticas` (empty-states próprios)
  ficam como estão, mesmo tornando-se inalcançáveis** (o overlay do layout intercepta antes de o
  componente sequer instanciar) — remover esse código morto fica fora de âmbito para não alargar o
  diff; ver §7.

## 3. Implementação

**Fase 1 — mecanismo de bloqueio (a mudança habilitante):**

1. **`frontend/src/app/layout/app-layout.component.ts`**:
   - Injetar `Router`, `ActivatedRoute`, `DestroyRef`, `BancosService`, `SelectedBancoService`.
   - `bancos = signal<BancosDTO[]>([])`, `bancosLoaded = signal(false)` — carregados uma vez em
     `ngOnInit` via `BancosService.getAll()` (mesmo tratamento de erro 401 silencioso que
     `HeaderComponent.loadBancos` já usa).
   - `selectedBancoId = signal<string|null>(null)`, sincronizado com
     `SelectedBancoService.selectedBancoId$` (`takeUntilDestroyed(this.destroyRef)`).
   - `currentUrl = signal(this.router.url)`, atualizado em cada `NavigationEnd`
     (`this.router.events.pipe(filter(e => e instanceof NavigationEnd),
     takeUntilDestroyed(this.destroyRef))`).
   - `private readonly BANCO_INDEPENDENT_PREFIXES = ['/bancos', '/categorias', '/utilizadores',
     '/perfil', '/not-authorized'];`
   - `routeRequiresBanco = computed(() => { const path = this.currentUrl().split('?')[0]; return
     !this.BANCO_INDEPENDENT_PREFIXES.some(p => path === p || path.startsWith(p + '/')); })`
   - `blocked = computed(() => this.routeRequiresBanco() && !this.selectedBancoId())`
   - `hasBancos = computed(() => this.bancos().length > 0)`

2. **`frontend/src/app/layout/app-layout.component.html`** — dentro de `<main class="content">`,
   substituir `<router-outlet></router-outlet>` por:
   ```html
   <div class="banco-required-message" *ngIf="blocked()">
     <ng-container *ngIf="bancosLoaded(); else loadingMsg">
       <p *ngIf="!hasBancos()">Ainda não tens nenhum banco. Cria um para começares a usar a aplicação.</p>
       <a *ngIf="!hasBancos()" routerLink="/bancos/criar" class="btn-secondary">Criar banco</a>
       <p *ngIf="hasBancos()">Seleciona um banco no menu lateral para continuares.</p>
     </ng-container>
     <ng-template #loadingMsg><p>A carregar...</p></ng-template>
   </div>
   <router-outlet *ngIf="!blocked()"></router-outlet>
   ```

3. **`frontend/src/app/layout/app-layout.component.css`** — nova regra `.banco-required-message`
   (centrada, mesma paleta usada no resto do layout — texto `#e2e8f0`, acento `#61edd6`).

**Fase 2 — reforço: corrigir a fuga de dados nas 3 view-models sem guarda:**

4. **`frontend/src/app/features/transacoes/components/listar/transacoes-listar.view-model.ts`** —
   em `loadAll()`, `loadContaTransacoes()` e `loadCartaoTransacoes()`, acrescentar no início: se
   `!this.bancoId`, repor a(s) lista(s) relevante(s) a `[]`, `isLoading$.next(false)` e `return`
   antes de chamar qualquer serviço — mesmo padrão de `contas-listar.view-model.ts:45-53`.

5. **`frontend/src/app/features/despesas-recorrentes/components/listar/despesas-recorrentes-listar.view-model.ts`**
   — mesma guarda em `loadPendentes()` e `loadConcluidas()` (repor `pendentes$`/`concluidas$` a `[]`).

6. **`frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts`**
   — mesma guarda em `loadData()` (repor `regras$` a `[]`).

## 4. Verificação

- `cd frontend && npm run build` — sem baseline de erros pré-existente a esta data.
- `cd frontend && npm test` — sem baseline de testes a falhar previamente. **Não há testes
  automatizados novos nesta correção**: o projeto não tem hoje nenhum spec de componente/view-model
  (só de mappers/utils — confirmado por `find ... -name "*.spec.ts"`), pelo que testar
  `AppLayoutComponent` com `Router`/`TestBed` seria introduzir um padrão de teste novo e
  desproporcionado só para este bugfix; fica como verificação manual (§5 do `RESULT.md`).
- Verificação manual (não automatizável nesta sessão): sem banco selecionado (`localStorage` limpo),
  navegar para `/transacoes`, `/dashboard`, `/contas`, `/cartoes-credito`, `/despesas-recorrentes`,
  `/estatisticas` e confirmar que aparece só a mensagem, sem pedidos de rede (aba Network);
  confirmar que `/bancos`, `/categorias`, `/utilizadores`, `/perfil` continuam acessíveis; selecionar
  um banco e confirmar que o conteúdo aparece normalmente; com um banco selecionado numa página
  (ex. `/transacoes`), desmarcar o banco no seletor da sidebar sem navegar e confirmar que a página
  fica bloqueada de imediato.

## 5. Riscos

- **Risco:** utilizador sem `role` correta ainda vê o `RoleGuard` a redirecionar para
  `/not-authorized` normalmente — o overlay não deve interferir, porque `/not-authorized` está na
  lista de prefixos independentes de banco. **Mitigação:** verificado por leitura de
  `app.routes.ts:50`.
- **Risco:** URL desconhecido (`**`/not-found) sem banco selecionado mostra o overlay em vez da
  página 404. Aceite como limitação menor (ver Decisões).
- **Risco:** `GET /banco` duplicado (Header + AppLayoutComponent) em cada carregamento de página —
  aceite como troca simples por independência entre os dois componentes (ver Decisões).
- **Risco:** as mensagens "seleciona um banco" já existentes em `dashboard`/`estatisticas` ficam
  como código morto (nunca alcançadas, porque o overlay intercepta antes). Sem impacto funcional;
  não removidas nesta correção (§7).

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Overlay global de bloqueio + mensagem única no `app-layout` | `app-layout.component.{ts,html,css}` | A |
| 2 | Corrige fuga de dados entre bancos nas 3 view-models sem guarda | `transacoes-listar.view-model.ts`, `despesas-recorrentes-listar.view-model.ts`, `despesas-recorrentes-listar-regras.view-model.ts` | B, C, D |

## 7. Fora de âmbito / handoff

- **Remover as mensagens "seleciona um banco" agora inalcançáveis** em
  `dashboard.component.html`/`estatisticas.component.html` — código morto inofensivo, não removido
  para não alargar o diff desta correção.
- **Página 404 dedicada para URLs sem banco selecionado** — fora de âmbito (ver Riscos).
- **Partilhar o carregamento de bancos entre `HeaderComponent` e `AppLayoutComponent`** — otimização
  válida (evita um pedido HTTP duplicado) mas fora de âmbito.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão.
