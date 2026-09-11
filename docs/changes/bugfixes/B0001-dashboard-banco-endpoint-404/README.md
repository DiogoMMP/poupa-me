# B0001 — Endpoint errado no pedido do dashboard de um banco

| | |
| :--- | :--- |
| **Tipo** | Bugfix |
| **Branch** | `fix/dashboard-banco-endpoint-404` (base: `develop`) |
| **Estado** | Planeado |
| **Âmbito** | Um método (`BancosService.getDashboardData`), 1 arquivo de produção + 1 spec novo |
| **Verificação** | `npm test` (frontend, Karma/Jasmine) + `npm run build` (frontend) |

## 1. Situação

O ecrã de dashboard de um banco está a receber `404 Not Found` ao carregar. O pedido observado
no browser é:

```
GET http://localhost:4200/api/banco/BNC00000000001/dashboard  → 404 { errors: { message: "Not Found" } }
```

**Evidência:**

- [`frontend/src/app/features/bancos/services/bancos.service.ts:23-25`](../../../../frontend/src/app/features/bancos/services/bancos.service.ts)
  constrói a URL do dashboard como `${apiUrl}/${id}/dashboard`, onde `apiUrl` é
  `${environment.apiBaseUrl}/banco` (linha 10). Ou seja, pede `GET /banco/{id}/dashboard`.
- [`backend/src/api/routes/DashboardRoute.ts:8,38`](../../../../backend/src/api/routes/DashboardRoute.ts)
  monta o router em `/dashboard` e regista `route.get('/:id', ...)`, ou seja, a rota real é
  `GET /dashboard/{id}`. Não existe nenhuma rota `/banco/:id/dashboard` — confirmado por leitura
  completa de [`backend/src/api/routes/BancoRoute.ts`](../../../../backend/src/api/routes/BancoRoute.ts),
  que só regista `/`, `/:id` (GET/PATCH/DELETE) — nenhuma sub-rota `dashboard`.
- O mesmo código (com o mesmo bug) já existe em `origin/main`, confirmado com
  `git show origin/main:frontend/src/app/features/bancos/services/bancos.service.ts` — não é uma
  regressão introduzida só em `develop`.

**Inventário (superfícies afetadas):**

- **A.** `BancosService.getDashboardData(id)` — único ponto que constrói a URL errada.
- **B.** `DashboardComponent`/`dashboard.view-model.ts:100` — consumidor 1, chama o serviço, fica
  sem dados (mostra erro/estado vazio).
- **C.** `bancos-listar.view-model.ts:88` — consumidor 2, usa o mesmo método para mostrar o saldo
  de cada banco na listagem.

**Escala:** 1 linha de produção incorreta; 2 pontos de consumo afetados (B, C); 0 outras
ocorrências do padrão `${apiUrl}/${id}/dashboard` no repositório (confirmado por grep).

## 2. Resultado pretendido

`BancosService.getDashboardData(id)` passa a chamar `GET {apiBaseUrl}/dashboard/{id}`, que é a
rota já implementada, documentada em Swagger e funcional no backend
(`DashboardRoute.ts`/`BancoController.getDashboard`). Nenhum comportamento do backend muda.

**Decisões:**

- **Corrigir o consumidor, não duplicar a rota no backend.** A rota `/dashboard/:id` já existe,
  está documentada e é a única definida para este caso de uso — criar uma rota espelho
  `/banco/:id/dashboard` só para bater certo com o frontend seria manter dois caminhos para o
  mesmo recurso sem motivo.
- **Sem tratamento de urgência para `main`.** O bug já está em produção, mas o sintoma é um
  dashboard vazio/com erro — sem perda ou corrupção de dados. Decisão do utilizador: seguir o
  fluxo normal (`develop` → próximo release), sem branch de hotfix dedicada.
- **Adicionar o primeiro spec de serviço do frontend.** Não existe nenhum ficheiro `*.spec.ts` no
  projeto frontend. Para este bugfix, cria-se `bancos.service.spec.ts` com
  `HttpClientTestingModule`, seguindo o padrão idiomático do Angular (não há precedente local a
  seguir).

**Alternativas rejeitadas:**

- *Adicionar rota `GET /banco/:id/dashboard` no backend, delegando ao mesmo controller.* Rejeitada
  porque introduziria duas rotas para o mesmo recurso sem nenhum consumidor a precisar da segunda
  — passaria a exigir manter os dois `@openapi` sincronizados para sempre.

## 3. Implementação

1. **`frontend/src/app/features/bancos/services/bancos.service.ts`** — alterar
   `getDashboardData(id)` para pedir `${environment.apiBaseUrl}/dashboard/${id}` em vez de
   `${this.apiUrl}/${id}/dashboard`.
2. **`frontend/src/app/features/bancos/services/bancos.service.spec.ts`** (novo) — teste que
   verifica que `getDashboardData('BNC00000000001')` dispara um `GET` para
   `{apiBaseUrl}/dashboard/BNC00000000001` (e não para `{apiBaseUrl}/banco/BNC00000000001/dashboard`).
   Falha contra o código atual, passa depois do passo 1.

Fase única — mudança de uma linha mais o teste que a comprova; não há divisão em commits
adicionais além do já previsto em §6.

## 4. Verificação

- `npm test` (frontend, Karma/Jasmine, `ChromeHeadless`) — o novo spec deve passar; sem baseline
  de testes a falhar previamente (o projeto não tinha nenhum spec até este momento).
- `npm run build` (frontend) — sem baseline de erros/warnings de build a esta data (build limpo
  confirmado nesta sessão antes desta mudança, no âmbito do PR #73).
- Verificação manual: com o backend a correr localmente, abrir `/bancos`, selecionar um banco e
  confirmar que o dashboard carrega sem 404 (não automatizável nesta sessão — ver `RESULT.md` §4).

## 5. Riscos

- **Risco:** outro código depender do caminho antigo (errado) por engano, e a correção quebrar
  algo que "por acaso" funcionava. **Mitigação:** grep confirmou que `getDashboardData` é o único
  ponto que constrói este URL, e só tem os dois consumidores já listados (B, C) — ambos esperam
  `DashboardDTO`, que não muda.

## 6. Ordem de commit

| # | Unidade | Ficheiros | Ref. inventário |
| :--- | :--- | :--- | :--- |
| 1 | Corrigir URL do dashboard + teste de regressão | `bancos.service.ts`, `bancos.service.spec.ts` (novo) | A, B, C |

## 7. Fora de âmbito / handoff

- Sincronizar a correção para `main` fora do próximo release normal — decisão do utilizador de
  não tratar como urgente.
- Qualquer teste end-to-end (Cypress) para este fluxo — fora do âmbito deste bugfix pontual.
