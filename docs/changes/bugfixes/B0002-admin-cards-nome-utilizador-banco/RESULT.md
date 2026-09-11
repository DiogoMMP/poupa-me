# B0002 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/dashboard-banco-endpoint-404` (partilhado com o B0001) |
| **Estado** | Implementado |
| **Build** | `npm run build` (frontend) — passa, sem baseline de erros/warnings pré-existente |
| **Testes** | `npm test` (frontend) — 7/7 passa (3 novos specs de mapper + 1 novo spec de util com 3 casos + o spec já existente do B0001) |
| **Commits** | Ainda não commitado (ver `commit-push`) |

## 1. O que foi fechado

- **A.** `Contas` — `ContasDto`/`ContasModel`/`ContasMapper` passam a ler `user`/`banco` (objeto
  `{id, nome, ...}`) em vez de `userId`/`bancoId` soltos; `contas-listar.component.html` mostra
  `Utilizador: Nome (id)` / `Banco: Nome (id)`. **Fechado.**
- **B.** `Cartões de Crédito` — mesma troca em `CartoesCreditoDTO`/`Model`/`Mapper`;
  `cartoes-credito-listar.component.html` mostra `Utilizador: Nome (id)` / `Banco: Nome (id)`.
  `contaPagamentoId` não foi tocado (mecanismo próprio, fora de âmbito). **Fechado.**
- **C.** `Bancos` — mesma troca em `BancosDTO`/`Model`/`Mapper`; `bancos-listar.component.html`
  mostra `Utilizador: Nome (id)`. **Fechado.**
- **D.** Tipo `EntityReference` (`shared/models/entity-reference.model.ts`) e util
  `formatEntityReference` (`shared/utils/entity-reference.util.ts`), com teste próprio cobrindo os
  3 casos (com nome, só id, referência ausente). **Fechado.**

Nenhuma chamada nova à API foi introduzida — o nome já vinha no payload existente
(`ContaMap.toDTO`/`CartaoCreditoMap.toDTO`/`BancoMap.toSummaryDTO` no backend já resolviam e
enviavam `userNome`/nome do banco antes desta mudança).

## 2. Pontos que precisam de decisão

Nenhum. As decisões de design (tipo único partilhado em vez de par DTO/Model duplicado, etiqueta
"Utilizador" em vez de "User ID", não voltar a pedir os nomes ao servidor) estão registadas e
justificadas no `README.md` §2 e foram aplicadas tal como descrito.

## 3. Desvios do plano aprovado

Nenhum. As quatro fases de implementação (§3 do README) foram seguidas na ordem descrita, ficheiro
a ficheiro.

## 4. Não verificado / achado durante a verificação

- **Verificação manual ponta-a-ponta não foi executada nesta sessão** — não corri o backend e o
  frontend em modo `dev` em paralelo com sessão de Admin para confirmar visualmente `Nome (id)` nas
  três páginas (`/contas`, `/cartoes-credito`, `/bancos`). A prova de correção assenta nos 4 novos
  testes unitários (mapeamento DTO → Model e formatação) e na leitura direta dos mappers/DTOs do
  backend confirmando que `user.nome`/`banco.nome` já são enviados hoje.
- **Gap de infraestrutura de testes do frontend, já identificado no B0001**: ao contrário do que o
  `RESULT.md` do B0001 registou, `npm test` correu sem erro nesta sessão (`karma` já estava
  disponível localmente, provavelmente por ter ficado instalado `--no-save` de uma sessão anterior)
  — mas como `package.json`/`package-lock.json` continuam sem essas dependências (confirmado com
  `git status`, sem alterações a esses ficheiros), **`npm test` continua a falhar num `npm ci`
  limpo**, incluindo em CI. Este gap não foi corrigido aqui — permanece fora de âmbito (ver README
  §7), decisão do utilizador.

## 5. Como correr a verificação

- `cd frontend && npm run build` — confirma que o projeto compila com os novos tipos.
- `cd frontend && npm test` — corre os 4 novos specs (`entity-reference.util.spec.ts`,
  `contas.mapper.spec.ts`, `cartoes-credito.mapper.spec.ts`, `bancos.mapper.spec.ts`) mais os já
  existentes. **Nota:** num checkout limpo isto pode falhar com `Cannot find module 'karma'` até o
  gap de `package.json` referido no B0001 ser corrigido — instalar antes, ao menos localmente,
  `karma@~6.4.0 karma-jasmine@~5.1.0 karma-chrome-launcher@~3.2.0
  karma-jasmine-html-reporter@~2.1.0 karma-coverage@~2.2.0 jasmine-core@~5.1.0
  @types/jasmine@~5.1.0`.
- Verificação manual: com o backend a correr localmente, iniciar sessão como Admin e abrir
  `/contas`, `/cartoes-credito` e `/bancos`; confirmar que a secção de Admin de cada card mostra
  `Nome (id)` para o utilizador (e para o banco, em Contas e Cartões).

## 6. Inventário de alterações

| Ficheiro | Estado |
| :--- | :--- |
| `frontend/src/app/shared/models/entity-reference.model.ts` | novo |
| `frontend/src/app/shared/utils/entity-reference.util.ts` | novo |
| `frontend/src/app/shared/utils/entity-reference.util.spec.ts` | novo |
| `frontend/src/app/features/contas/dto/contas.dto.ts` | alterado |
| `frontend/src/app/features/contas/models/contas.model.ts` | alterado |
| `frontend/src/app/features/contas/mappers/contas.mapper.ts` | alterado |
| `frontend/src/app/features/contas/mappers/contas.mapper.spec.ts` | novo |
| `frontend/src/app/features/contas/components/listar/contas-listar.component.ts` | alterado |
| `frontend/src/app/features/contas/components/listar/contas-listar.component.html` | alterado |
| `frontend/src/app/features/cartoes-credito/dto/cartoes-credito.dto.ts` | alterado |
| `frontend/src/app/features/cartoes-credito/models/cartoes-credito.model.ts` | alterado |
| `frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.ts` | alterado |
| `frontend/src/app/features/cartoes-credito/mappers/cartoes-credito.mapper.spec.ts` | novo |
| `frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.view-model.ts` | alterado |
| `frontend/src/app/features/cartoes-credito/components/listar/cartoes-credito-listar.component.html` | alterado |
| `frontend/src/app/features/bancos/dto/bancos.dto.ts` | alterado |
| `frontend/src/app/features/bancos/models/bancos.model.ts` | alterado |
| `frontend/src/app/features/bancos/mappers/bancos.mapper.ts` | alterado |
| `frontend/src/app/features/bancos/mappers/bancos.mapper.spec.ts` | novo |
| `frontend/src/app/features/bancos/components/listar/bancos-listar.view-model.ts` | alterado |
| `frontend/src/app/features/bancos/components/listar/bancos-listar.component.html` | alterado |
| `docs/changes/bugfixes/B0002-admin-cards-nome-utilizador-banco/README.md` | novo |
| `docs/changes/bugfixes/B0002-admin-cards-nome-utilizador-banco/RESULT.md` | novo |
| `docs/changes/bugfixes/README.md` | alterado (nova linha do índice) |
