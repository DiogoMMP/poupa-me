# B0015 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/admin-regras-filtro-banco` (base: `develop`) |
| **Estado** | Implementado |
| **Build** | `cd frontend && npm run build` — passa. `cd backend && npm run build` — passa. Sem baseline de erros pré-existente. |
| **Testes** | `cd frontend && npm test` — 13/13 a passar. `cd backend && npm test` — 5 suites / 20 testes a passar (regressão). Sem specs novos (ver README §4). |
| **Commits** | Ainda não commitado (ver `commit-push`) |

## 1. O que foi fechado

- **A.** `DespesasRecorrentesListarRegrasViewModel.loadData()` — removido o ramo `isAdmin`. Todos os
  roles precisam de banco selecionado e recebem só as regras desse banco
  (`service.getAll(bancoId)`). **Fechado.**

## 2. Pontos que precisam de decisão

Nenhum.

Consequência operacional: o Admin sem banco selecionado na sidebar vê a lista vazia. É o mesmo
comportamento de Contas/Cartões e da guarda do B0013.

## 3. Desvios do plano aprovado

- **Follow-up no mesmo PR (CodeRabbit, PR #90):** os view-models que carregam dados quando o banco
  muda passaram a guardar a subscrição e a cancelar a anterior antes de cada carregamento. Evita que
  uma resposta de um banco anterior sobrescreva a lista depois de a seleção mudar ou ser limpa. Foram
  alterados 15 view-models: listagens (regras, contas, cartões, transações, despesas recorrentes,
  dashboard) e formulários de criar/editar que carregam contas ou cartões. Fora do âmbito: `header`
  (só atualiza um sinal, sem pedidos) e os view-models que não dependem do banco.

Não foram tocados ficheiros do backend — a query já aceitava `bancoId` para o Admin.

## 4. Não verificado

- **Verificação manual não executada nesta sessão.** Por confirmar: Admin sem banco vê lista vazia;
  Admin com um banco selecionado vê só as regras desse banco; `User` normal inalterado.
- **Sem spec novo:** o view-model não tem precedente de teste no projeto (ver B0013 §4).

## 5. Como correr a verificação

- `cd frontend && npm run build && npm test` — confirma a compilação e os 13 specs existentes.
- `cd backend && npm run build && npm test` — regressão; 20 testes existentes.

## 6. Inventário de alterações

| Ficheiro | Estado |
| :--- | :--- |
| `frontend/src/app/features/despesas-recorrentes/components/listar-regras/despesas-recorrentes-listar-regras.view-model.ts` | alterado |
| `docs/changes/bugfixes/B0015-admin-regras-filtro-banco/README.md` | novo |
| `docs/changes/bugfixes/B0015-admin-regras-filtro-banco/RESULT.md` | novo |
| `docs/changes/bugfixes/README.md` | alterado (nova linha do índice) |
