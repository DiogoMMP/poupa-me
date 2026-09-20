# B0013 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/data-futura-e-banco-nao-selecionado` (partilhado com o B0012) |
| **Estado** | Implementado |
| **Build** | `cd frontend && npm run build` — sem erros |
| **Testes** | `cd frontend && npm test` — 13/13 sucesso (sem baseline de falhas; nenhum teste novo, ver §4) |
| **Commits** | Ainda não commitado nesta sessão (ver próximo passo) |

## 1. O que foi fechado

- **A.** `AppLayoutComponent` — corrigido. `<router-outlet>` só renderiza quando a rota atual não
  depende de banco (`/bancos`, `/categorias`, `/utilizadores`, `/perfil`, `/not-authorized`) ou já há
  um banco selecionado; caso contrário mostra uma mensagem única (`.banco-required-message`, com
  `<app-icon name="Bank">` por cima), reativa a `SelectedBancoService.selectedBancoId$` e a mudanças
  de rota (`NavigationEnd`), com duas variantes: "ainda não tens nenhum banco" (link para
  `/bancos/criar`) vs. "Selecione um banco no menu lateral para continuar." (wording ajustado a
  pedido do utilizador).
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
| `docs/changes/bugfixes/B0013-bloqueio-app-sem-banco-selecionado/RESULT.md` | novo |
