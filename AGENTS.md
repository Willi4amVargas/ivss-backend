# AGENTS.md — IVSS Backend

NestJS 11 REST API for the IVSS statistical automation pilot (Hospital Dr. Patrocinio Peñuela Ruíz, Medicina Interna). Single package, pnpm only (`pnpm-lock.yaml`; `pnpm-workspace.yaml` allow-lists post-install builds for `bcrypt` etc.). Domain comments and user-facing strings are in Spanish — keep them that way.

## Setup

- Copy `.env.example` → `.env`. `ConfigModule` reads only `.env`; `.env.development` / `.env.production` are untracked local templates.
- Needs a local Postgres DB named `ivss` (default creds in `.env.example`) plus `docker compose up -d`: `redis` (TypeORM query cache runs over Redis; the app won't work without it) and `whoicd/icd-api` on :5045 (ICD-11 lookups proxied by `src/icd-api`).

## Commands

- `pnpm start:dev` — watch mode. `pnpm build` + `pnpm start:prod` — prod runs `dist/main` (webpack bundles everything into one file; see nest-cli.json).
- `pnpm lint` — ESLint with `recommendedTypeChecked`, auto-fixes and reports type errors (acts as typecheck; there is no separate `typecheck` script).
- `pnpm test` — Jest, but the suite is nearly empty (only `src/app.controller.spec.ts`). One file: `npx jest patients`. `pnpm test:e2e` uses `test/jest-e2e.json`.

## Non-obvious architecture facts

- Global prefix is `api/v1`; Swagger at `/api/docs`.
- **Auth is global**: `AuthGuard` is bound via `APP_GUARD` in `auth.module.ts`, so every endpoint requires a Bearer JWT unless decorated with `@Public()` (`src/auth/auth.reflector.ts`). Read the caller with `@ActiveUser()` (`src/users/users.decorator.ts`); many list endpoints filter rows by the logged-in user.
- **Schema via migrations**: `synchronize` is disabled; tables come from `src/migrations/` (run automatically on boot via `migrationsRun`). The CLI config lives in `data-source.ts`; use `pnpm migration:generate src/migrations/<Name>`, `migration:run`, `migration:revert`, `migration:show`. Entities are in each module's `entities/` folder.
- **Manual Redis query caching**: list services build string cache keys (`getCacheKeyByWhere` in `src/utils/cache/`) passed as `cache: { id }` to TypeORM. If you change a query's `where`/filters, update the cache key too or stale results are served.
- Global `ValidationPipe` has `whitelist: true` but `transform` is **commented out** (`src/main.ts`) — DTOs don't auto-coerce types; incoming query strings stay strings unless handled explicitly.
- PDF export (`src/files/files.service.ts` + pdfmake in `clinical-records`) resolves fonts/assets from `__dirname/fonts` and `__dirname/assets`, which only exist because `nest-cli.json` copies `../fonts` and `../assets` into `dist/`. Don't remove that assets config; test exports after `pnpm build`.

## Deployment

Pushing to `master` triggers `.github/workflows/main.yml`: SSHes to the VPS, does `git restore . && git pull` (**discards any manual server edits — never rely on hotfixing the server**), `npm install && npm run build`, restarts the systemd service. Production env vars come from a sourced shell profile on the server (e.g. `/etc/profile.d/srft-sys.sh`), not from `.env` files. The deploy directory in the workflow is specific to the current VPS, not a fixed contract.

`api_documentation.md` at the repo root documents endpoints; prefer reading controllers/Swagger if it looks stale.
