# B0001 — Resultado

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/dashboard-banco-endpoint-404` |
| **Estado** | Implementado |
| **Build** | `npm run build` (frontend) — passa, sem baseline de erros/warnings pré-existente |
| **Testes** | `npm test` (frontend) — 1/1 passa; **1 teste novo** (o único no projeto frontend até esta data) |
| **Commits** | Ainda não commitado (ver `commit-push`) |

## 1. O que foi fechado

- **A.** `BancosService.getDashboardData(id)` corrigido para pedir `GET {apiBaseUrl}/dashboard/{id}`
  em vez de `GET {apiBaseUrl}/banco/{id}/dashboard`. **Fechado.**
- **B.** `dashboard.view-model.ts` volta a receber `DashboardDTO` em vez de 404 — não precisou de
  alteração própria, já que só consome o serviço. **Fechado** (via A).
- **C.** `bancos-listar.view-model.ts` (saldo por banco na listagem) — mesma situação, resolvido
  via A, sem alteração própria necessária. **Fechado.**

## 2. Pontos que precisam de decisão

Nenhum. O âmbito era fechado (um consumidor de URL incorreto) e ficou totalmente resolvido.

## 3. Desvios do plano aprovado

Nenhum desvio de implementação. Um achado relevante durante a verificação, registado em §4.

## 4. Não verificado / achado durante a verificação

- **Infraestrutura de testes do frontend estava quebrada, independentemente desta mudança.**
  `karma`, `karma-jasmine`, `karma-chrome-launcher`, `karma-jasmine-html-reporter`,
  `karma-coverage` e `jasmine-core`/`@types/jasmine` **não constam em `package.json`**, apesar de
  `karma.conf.js` e do target `test` em `angular.json` os exigirem. `npm test` falhava de imediato
  com `Cannot find module 'karma'` antes de qualquer alteração minha.
  - Para conseguir cumprir a exigência desta skill de que o novo teste "falha no código antigo e
    passa no código corrigido", instalei essas dependências localmente com `npm install --no-save`
    (versões `~5.1.0`/`~6.4.0`/`~3.2.0`/`~2.1.0`/`~2.2.0` para bater certo com o Angular 20 já
    instalado — versões `latest` davam erro de incompatibilidade com o `zone.js` empacotado).
    Confirmei com isto que o novo `bancos.service.spec.ts` **falha** contra o código antigo (erro
    exatamente igual ao reportado: pedido para `/banco/{id}/dashboard`, `404`/nenhum pedido
    correspondente) e **passa** contra a correção.
  - **`package.json`/`package-lock.json` não foram alterados** — confirmado com `git status`
    antes e depois da instalação. Isto significa que **`npm test` volta a falhar** para qualquer
    pessoa que faça `npm ci`/`npm install` limpo neste repositório, incluindo em CI, até que estas
    dependências sejam adicionadas a `package.json` a sério.
  - **Fora do âmbito deste bugfix** corrigir isto no `package.json` (é uma mudança de
    infraestrutura de testes de todo o projeto, não do endpoint do dashboard) — fica para decisão
    do utilizador/handoff (ver §7 do README).
- Verificação manual ponta-a-ponta (abrir `/bancos` no browser, selecionar um banco, confirmar
  ausência de 404) não foi executada nesta sessão — não corri o backend + frontend em modo `dev`
  em paralelo. A prova de correção assenta no teste unitário (§5) e na leitura direta das duas
  rotas envolvidas.

## 5. Como correr a verificação

- `cd frontend && npm run build` — confirma que o projeto compila.
- `cd frontend && npm test` — corre o novo `bancos.service.spec.ts`. **Nota:** com o `package.json`
  atual isto falha com `Cannot find module 'karma'` num checkout limpo; instalar antes, ao menos
  localmente, `karma@~6.4.0 karma-jasmine@~5.1.0 karma-chrome-launcher@~3.2.0
  karma-jasmine-html-reporter@~2.1.0 karma-coverage@~2.2.0 jasmine-core@~5.1.0
  @types/jasmine@~5.1.0` (ou resolver o gap em `package.json` primeiro).

## 6. Inventário de alterações

| Ficheiro | Estado |
| :--- | :--- |
| `frontend/src/app/features/bancos/services/bancos.service.ts` | alterado |
| `frontend/src/app/features/bancos/services/bancos.service.spec.ts` | novo |
| `docs/changes/bugfixes/B0001-dashboard-banco-endpoint-404/README.md` | novo |
| `docs/changes/bugfixes/B0001-dashboard-banco-endpoint-404/RESULT.md` | novo |
| `docs/changes/bugfixes/README.md` | novo (índice do tipo, primeiro registo) |
