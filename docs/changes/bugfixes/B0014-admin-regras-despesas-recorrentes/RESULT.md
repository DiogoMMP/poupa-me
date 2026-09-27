# B0014 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/admin-regras-despesas-recorrentes` (base: `develop`) |
| **Estado** | Implementado |
| **Build** | `cd backend && npm run build` — passa, sem baseline de erros pré-existente. `cd frontend && npm run build` — passa, sem baseline de erros pré-existente. |
| **Testes** | `cd backend && npm test` — 5 suites / 20 testes, todos a passar (sem specs novos — ver §4). `cd frontend && npm test` — 13/13 a passar, incluindo o `despesas-recorrentes.mapper.spec.ts` atualizado. |
| **Commits** | Ainda não commitado (ver `commit-push`) |

## 1. O que foi fechado

- **A.** Backend — `IDespesaRecorrenteDTO.banco?`, `DespesaRecorrenteMap.toDTO` e
  `DespesaRecorrenteService` (`getBancoMap` + `resolveBanco`, replicando `ContaService.getBancoMap`)
  passam a resolver e devolver `banco: { id, nome, icon }` (via `contaOrigem.bancoId`) em todos os
  métodos que devolvem `IDespesaRecorrenteDTO`: `create`, `update`, `get`, `getAll`, `getComValor`,
  `getSemValor`. **Fechado.**
- **B.** Frontend — `DespesaRecorrenteDTO.banco?`, `DespesaRecorrenteModel.user?`/`banco?`
  (substituindo `userId?: string`) e `DespesasRecorrentesMapper.toModel` a passar as referências
  diretamente. Spec do mapper atualizado (`model.user`/`model.banco` em vez de `model.userId`).
  **Fechado.**
- **C.** Frontend — `DespesasRecorrentesListarRegrasViewModel.loadData()`: quando
  `auth.user()?.role === 'Admin'`, chama `service.getAll()` sem `bancoId`, ignorando o banco
  selecionado na sidebar e mostrando as regras de todos os utilizadores/bancos. Para `User`, a
  guarda do B0013 (precisa de banco selecionado) mantém-se sem alteração. **Fechado.**
- **D.** Frontend — cards em `despesas-recorrentes-listar-regras.component.html` ganham a secção
  `*ngIf="auth.user()?.role === 'Admin'"` com `Utilizador: Nome (id)` / `Banco: Nome (id)`, via
  `formatEntityReference`, injetado no componente/view-model como `contas-listar` já fazia.
  **Fechado.**

## 2. Pontos que precisam de decisão

Nenhum. A decisão principal (Admin vê todas as regras, sem filtro de banco) foi confirmada com o
utilizador antes da implementação e está registada no `README.md` §2.

## 3. Desvios do plano aprovado

- **O botão "Eliminar" NÃO foi movido para dentro do bloco `*ngIf="auth.user()?.role === 'Admin'"`**,
  ao contrário do padrão literal de `contas-listar.component.html` (onde `deleteConta` só é visível
  para Admin). O README (§3, ponto 11) dizia "réplica do bloco em `contas-listar.component.html:39-49`"
  sem qualificar este detalhe; ao implementar, copiar literalmente teria retirado a utilizadores
  normais a capacidade de eliminar as suas próprias regras a partir desta lista — uma regressão real,
  não pedida por ninguém (nem pela issue, nem pelo pedido explícito do utilizador, que foi sobre
  mostrar `user`/`banco`, não sobre quem pode eliminar). Ficou: o `<div class="card-details
  admin-section">` com `Utilizador:`/`Banco:` dentro do `*ngIf` de Admin, e o botão "Eliminar" fora
  dele, tal como já estava antes desta correção — comportamento de eliminação inalterado para todos
  os roles.

## 4. Não verificado / achado durante a verificação

- **Verificação manual ponta-a-ponta não executada nesta sessão** — não corri o backend e o frontend
  em modo `dev` em paralelo com sessão de Admin para confirmar visualmente que `/despesas-recorrentes/listar-regras`
  mostra regras de vários utilizadores/bancos e que os cards mostram `Utilizador: Nome (id)` /
  `Banco: Nome (id)`. A prova de correção assenta em: build/testes automatizados a passar, no spec do
  mapper atualizado, e na leitura direta do código confirmando que a query do backend
  (`DespesaRecorrenteQueryRepo.findAll`) já devolvia corretamente todos os registos quando chamada
  sem `userId`/`bancoId` — só faltava o frontend deixar de bloquear esse pedido para o Admin.
- **Sem testes automatizados novos no backend** para `DespesaRecorrenteService.getBancoMap`/
  `resolveBanco` — não existe hoje nenhum spec de serviço para `DespesaRecorrenteService` (só para
  `DespesaRecorrenteProcessadorService`, um serviço diferente); introduzir esse padrão de teste de
  serviço pela primeira vez ficou fora do âmbito deste bugfix de visualização (decisão registada no
  README §7).
- **Não auditado**: contas de origem (`Conta`) sem `bancoId` associado em dados existentes — campo
  opcional em BD. Nesse caso `banco` fica `undefined` e o card mostra `"-"` (comportamento já
  existente de `formatEntityReference`), mas não há acesso a uma base de dados real para confirmar se
  este caso ocorre em produção.

## 5. Como correr a verificação

- `cd backend && npm run build && npm test` — confirma que o backend compila e que a suite de testes
  Jest continua toda a passar (5 suites / 20 testes; nenhum spec dedicado a `DespesaRecorrenteService`
  hoje).
- `cd frontend && npm run build && npm test` — confirma que o frontend compila e que os 13 specs
  Karma/Jasmine passam, incluindo o `despesas-recorrentes.mapper.spec.ts` atualizado (mapeia `user`/
  `banco` como `EntityReference`, não como ids soltos).
- Verificação manual: com o backend a correr localmente, sessão de Admin, selecionar qualquer banco
  na sidebar (necessário só para passar o bloqueio global do B0013 — ver README §5) e abrir
  `/despesas-recorrentes/listar-regras`; confirmar que aparecem regras de mais do que um
  utilizador/banco (se existirem em BD) e que cada card mostra `Utilizador: Nome (id)` /
  `Banco: Nome (id)` sob o botão "Editar", com "Eliminar" continuar visível e funcional para todos os
  roles. Repetir com sessão de `User` normal e confirmar que nada mudou (precisa de banco
  selecionado, só vê as suas próprias regras desse banco, sem secção Admin).

## 6. Inventário de alterações

| Ficheiro | Estado |
| :--- | :--- |
| `backend/src/dto/IDespesaRecorrenteDTO.ts` | alterado |
| `backend/src/mappers/DespesaRecorrenteMap.ts` | alterado |
| `backend/src/services/DespesaRecorrente/DespesaRecorrenteService.ts` | alterado |
| `backend/src/api/routes/DespesaRecorrente/DespesaRecorrenteRoute.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/dto/despesas-recorrentes.dto.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/models/despesas-recorrentes.model.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/mappers/despesas-recorrentes.mapper.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/mappers/despesas-recorrentes.mapper.spec.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.component.ts` | alterado |
| `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.component.html` | alterado |
| `docs/changes/bugfixes/B0014-admin-regras-despesas-recorrentes/README.md` | novo |
| `docs/changes/bugfixes/B0014-admin-regras-despesas-recorrentes/RESULT.md` | novo |
| `docs/changes/bugfixes/README.md` | alterado (nova linha do índice) |
