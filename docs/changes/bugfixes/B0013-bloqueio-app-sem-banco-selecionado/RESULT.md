# B0013 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/data-futura-e-banco-nao-selecionado` (partilhado com o B0012) |
| **Estado** | Implementado |
| **Build** | `cd frontend && npm run build` — sem erros |
| **Testes** | `cd frontend && npm test` — 13/13 sucesso (sem baseline de falhas; nenhum teste novo, ver §4) |
| **Commits** | `52897c8` (correção original) + 1 commit adicional pós-feedback visual (ver §7) |

## 1. O que foi fechado

- **A.** `AppLayoutComponent` — corrigido. `<router-outlet>` só renderiza quando a rota atual não
  depende de banco (`/bancos`, `/categorias`, `/utilizadores`, `/perfil`, `/not-authorized`) ou já há
  um banco selecionado; caso contrário mostra uma mensagem única (`.banco-required-message`, com
  `<app-icon name="Bank">` por cima), reativa a `SelectedBancoService.selectedBancoId$` e a mudanças
  de rota (`NavigationEnd`), com duas variantes: "Ainda não tem nenhum banco. Crie um para começar a
  usar a aplicação." (botão primário para `/bancos/criar`) vs. "Selecione um banco no menu lateral
  para continuar." — wording ajustado a pedido do utilizador (ver §7).
- **B.** `transacoes-listar.view-model.ts` — corrigido. `loadAll()`, `loadContaTransacoes()` e
  `loadCartaoTransacoes()` passaram a repor as listas a `[]` e a não chamar nenhum serviço quando
  não há `bancoId`.
- **C.** `despesas-recorrentes-listar.view-model.ts` — corrigido. Mesma guarda em `loadPendentes()`
  e `loadConcluidas()`.
- **D.** `despesas-recorrentes-listar-regras.view-model.ts` — corrigido. Mesma guarda em
  `loadData()`.

## 2. Pontos a precisar de decisão

Nenhum surgiu durante a implementação — o âmbito alargado (overlay + fuga de dados nas 3
view-models) já tinha sido decidido e aprovado no plano.

## 3. Desvios do plano aprovado

Nenhum. Implementação seguiu exatamente o README aprovado, incluindo a deteção de rota por prefixo
de URL fixo em vez de `data: { requiresBanco }`.

## 4. Não verificado

- **Sem testes automatizados novos** — já previsto no README (§4): o projeto não tem hoje nenhum
  spec de componente/view-model (só mappers/utils), pelo que introduzir `TestBed`/`Router` mocks só
  para `AppLayoutComponent` seria um padrão de teste novo desproporcionado para este bugfix.
  Consequência operacional: a lógica de gate (`blocked`/`routeRequiresBanco`/`hasBancos`) e as
  guardas das 3 view-models não têm cobertura automatizada — qualquer regressão futura só seria
  apanhada manualmente.
- **Verificação manual ponta-a-ponta num browser** — não disponível nesta sessão. Consequência
  operacional: não foi confirmado visualmente que (1) o overlay aparece/desaparece corretamente ao
  selecionar/desmarcar um banco sem navegar, (2) nenhum pedido de rede é feito enquanto bloqueado,
  (3) `/bancos`, `/categorias`, `/utilizadores`, `/perfil` continuam acessíveis. Recomenda-se esta
  verificação antes do merge.

## 5. Como correr a verificação

- `cd frontend && npm run build` — prova que a alteração compila sem quebrar tipos.
- `cd frontend && npm test` — confirma que a suite existente (mappers/utils) continua a passar sem
  regressões.
- Verificação manual (ver §4 do README): navegar sem banco selecionado pelas rotas dependentes de
  banco e confirmar mensagem única + zero pedidos de rede; confirmar rotas independentes de banco
  continuam acessíveis; selecionar/desmarcar um banco e confirmar o comportamento reativo.

## 6. Inventário de alterações

| Ficheiro | Tipo |
| :--- | :--- |
| `frontend/src/app/layout/app-layout.component.ts` | alterado |
| `frontend/src/app/layout/app-layout.component.html` | alterado |
| `frontend/src/app/layout/app-layout.component.css` | alterado |
| `frontend/src/app/features/transacoes/components/listar/transacoes-listar.view-model.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/components/listar/despesas-recorrentes-listar.view-model.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts` | alterado |
| `docs/changes/bugfixes/B0013-bloqueio-app-sem-banco-selecionado/README.md` | novo |
| `docs/changes/bugfixes/B0013-bloqueio-app-sem-banco-selecionado/RESULT.md` | novo, atualizado no §7 |

## 7. Correção adicional (feedback visual pós-PR #86)

O utilizador assinalou, ao ver o ecrã de bloqueio em uso, dois problemas no template
(`app-layout.component.html`):

- O botão "Criar banco" tinha a classe `.btn-secondary` (contorno transparente, sem destaque), a
  mesma usada nos botões "Cancelar" em toda a app. Como é a única ação possível deste ecrã, devia
  seguir o mesmo padrão dos CTAs principais (ex. "Guardar"): um `<button>` simples, sem classe
  extra, que herda o estilo global com gradiente `--brand-accent` já definido em `_components.css`.
  Trocado `<a routerLink="/bancos/criar" class="btn-secondary">` por
  `<button type="button" routerLink="/bancos/criar">`.
- O texto "Ainda não tens nenhum banco. Cria um para começares..." estava na 2ª pessoa informal
  ("tu"), inconsistente com o resto da app, que usa a forma "você" (`"Não tem conta?"`, `"O seu
  nome"`, `"Não tem Autorização..."`, confirmado por grep aos templates). Corrigido para "Ainda não
  tem nenhum banco. Crie um para começar a usar a aplicação."
