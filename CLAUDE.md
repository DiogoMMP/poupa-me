# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Poupa-me is a personal finance management web app: a monorepo with an Angular 20 SPA (`frontend/`) and a Node.js/Express 5 REST API (`backend/`), backed by PostgreSQL via TypeORM. The backend follows Domain-Driven Design and Clean Architecture; the frontend is organized by feature modules. UI text, domain terms, and commit messages in this repo are in Portuguese (PT-PT) — match that convention (`Banco`, `Conta`, `CartaoCredito`, `DespesaRecorrente`, `Transacao`, etc. are domain names, not translations to fix).

## Commands

### Backend (`backend/`)
- `npm run dev` — start with hot-reload (tsc-watch + node)
- `npm run build` — compile TypeScript (`tsc`)
- `npm start` — build then run compiled `dist/index.js`
- `npm run lint` — ESLint
- `npm test` — run Jest test suite (ESM mode via `--experimental-vm-modules`)
- `npm run test:watch` / `npm run test:coverage`
- Run a single test file: `node --experimental-vm-modules node_modules/jest/bin/jest.js path/to/file.spec.ts`
- Tests must live under a `tests/` directory and be named `*.spec.ts` or `*.test.ts` (see `jest.config.js` `testMatch`) — files elsewhere are not picked up.

### Frontend (`frontend/`)
- `npm start` — `ng serve` with proxy to local backend (`proxy.conf.js`, backend expected on `localhost:3000`)
- `npm run build` — production build
- `npm test` — Karma/Jasmine unit tests (ChromeHeadless)
- `npm run test:ci` — unit tests + Cypress e2e (`cy:run`) against `http://localhost:4200`
- `npm run storybook` / `npm run build-storybook` — component documentation (Storybook 10 + Angular)

### Docker (repo root)
- `docker-compose.yml` spins up Postgres, backend, frontend, Storybook, and an ngrok tunnel (for testing on mobile) together — useful when you need the full stack running at once, e.g. `docker compose up`.

### CI
GitHub Actions (`.github/workflows/node.js.yml`) runs on push/PR to `main`: `npm ci` + `npm run build` for both backend and frontend. It does **not** run the test suites — don't assume CI is a safety net for test regressions.

## Backend architecture

Layered/DDD structure under `backend/src/`, per bounded context (`Banco`, `Conta`, `CartaoCredito`, `Categoria`, `DespesaRecorrente`, `Transacao`, `User`, `Estatisticas`, `IACategorizacao`, `Auth`):

```
domain/<Context>/Entities/       # AggregateRoot / Entity subclasses, private constructor + static create()
domain/<Context>/ValueObjects/   # Value Objects (validated primitives)
domain/Shared/ValueObjects/      # Cross-context VOs (Nome, Icon, ...)
repos/<Context>/                 # Repository implementations (TypeORM-backed)
repos/<Context>/IRepos/          # Repository interfaces
services/<Context>/              # Business logic, orchestrates repos + domain
services/<Context>/IServices/    # Service interfaces (injected via these types)
controllers/<Context>/           # HTTP request handling, maps Result -> HTTP response
dto/                             # Data Transfer Objects (API request/response shapes)
mappers/                         # Domain entity <-> DTO <-> persistence entity conversions
persistence/entities/            # TypeORM entities (separate from domain entities)
api/routes/                      # Express routers + Swagger/OpenAPI JSDoc annotations
api/middlewares/                 # isAuth (JWT/session), authorize (RBAC)
loaders/                         # Bootstrap: express app, TypeORM DataSource, DI container, logger, seed
core/domain/                     # Base classes: AggregateRoot, Entity, ValueObject, UniqueEntityID, DomainEvents
core/logic/                      # Result/Either (explicit error handling, no thrown exceptions for business errors), Guard, AppError
core/infra/                      # BaseController, Repo/Mapper interfaces
```

Key conventions:
- **Result pattern**: domain/service methods return `Result<T>` (`core/logic/Result.ts`) instead of throwing for expected failures. Controllers check `result.isFailure` and map `result.error` to HTTP status codes (see `controllers/Banco/BancoController.ts` for the pattern: 404 for "not found", 401 for "Unauthorized", 400 otherwise).
- **Domain entities**: always created via a private constructor + static `create(props, id?)` that runs `Guard` checks and returns `Result<Entity>` — never `new Entity(...)` directly outside the class.
- **Dependency injection**: `typedi`, wired manually. Adding a new repo/service/controller requires registering it in **two places**: `backend/src/config/index.ts` (name + relative import path) and `backend/src/loaders/index.ts` (adding it to the `repos`/`services`/`controllers` arrays passed to `dependencyInjectorLoader`). The DI loader dynamically `import()`s each path and calls `Container.set(name, Container.get(class))`, then constructors use `@Inject('Name')` with the corresponding `IXxxService`/`IXxxRepo` interface type.
- **Auth/RBAC**: `isAuth` middleware supports both JWT Bearer tokens and session cookies, populating `req.currentUser` (`AuthUser`: id/role/email/...). `authorize([...roles])` middleware runs after `isAuth` for role gating. Roles: `Admin`, `User`, `Guest`. Use `getEffectiveUserId(req)` (in `isAuth.ts`) to get a scoping user id — returns `undefined` for Admins so queries return all users' data, or the caller's own id otherwise.
- **ESM throughout**: backend is `"type": "module"`; internal imports use explicit `.js` extensions even in `.ts` source (NodeNext resolution) — keep this when adding new files.
- **Config**: all env vars are read once in `backend/src/config/index.ts` (dotenv). `POSTGRES_URL` (or `DATABASE_URL`) is required outside development-with-missing-.env.
- Swagger/OpenAPI docs are authored inline as JSDoc `@openapi` comments directly above each route definition in `api/routes/*.ts` and served at `/api-docs`.
- Test coverage in the backend is currently minimal (effectively one spec file for `DomainEvents`) — don't assume existing behavior is pinned by tests; check manually or add tests when changing business logic.

## Frontend architecture

Angular 20 standalone-components app (no NgModules) with SSR (Angular Universal) under `frontend/src/app/`:

```
features/<feature>/
  components/<action>/   # e.g. criar/ editar/ listar/ per feature, standalone components
  dto/                    # API request/response shapes
  models/                 # Frontend-side domain models
  mappers/                # DTO <-> model conversion
  services/               # HttpClient wrappers, one per feature, calling `${environment.apiBaseUrl}/<resource>`
layout/                   # navbar, header, sidebar, footer, app-layout shell
guards/                   # RoleGuard (canActivateChild, route.data.allowedRoles), NoLoginGuard
services/                 # Cross-feature services (menu, notifications, selected-banco)
shared/components/        # Reusable UI (button, icon, pagination, entity-card, ...) — documented in Storybook
```

Key conventions:
- Routes are lazy-loaded per feature via `loadChildren` in `app.routes.ts`, each feature exporting its own `routes` (e.g. `features/bancos/bancos.routes.ts`). Route-level `data: { allowedRoles: [...] }` drives `RoleGuard` authorization — add this on every new feature route.
- `environment.apiBaseUrl` (`/api`) is the base for all HTTP calls; requests use `withCredentials: true` since auth is session/cookie-based on top of JWT.
- `proxy.conf.js`/`proxy.conf.json` proxy `/api` to `http://localhost:3000` during `ng serve` for local dev against a locally running backend.

## Cross-cutting notes

- Backend and frontend are independent npm projects (no shared package/workspace tooling) — install and run commands separately in each directory.
- Domain model overview is diagrammed in `docs/domain_model.puml` (`docs/domain_model.svg` rendered version) — check it before making structural changes to entities/relationships.
