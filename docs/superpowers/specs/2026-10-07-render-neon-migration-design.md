# Migration Railway + SQLite → Render + Neon (Postgres)

Date: 2026-10-07 — Status: approved design, pending spec review

## Goal

Run the portfolio (public site + `/admin`) on **Render** with **Neon Postgres** as the only
database, replacing Railway + SQLite/libsql. All production content **and** contact messages are
carried over. App behaviour is unchanged.

### Success criteria

- Site and `/admin` served from Render, backed by Neon; admin edits persist across redeploys.
- Production content + messages from the Railway SQLite file present in Neon after cutover.
- `tsc`, `pnpm lint`, `pnpm test`, `pnpm build` green; SSR smoke-tested against a Neon dev branch.

**Out of scope**: server-side admin auth (known existing gap), switching away from `vite preview`,
any change to `PortfolioData` shape, Server Functions, or UI.

## Decisions

| Topic | Decision | Why |
| --- | --- | --- |
| Driver | `postgres` (postgres.js) + `drizzle-orm/postgres-js` | Long-running Node server; supports the interactive transaction in `seedDatabase()`. neon-http lacks it; `pg` adds weight for no gain. |
| Connection | Neon **direct** (unpooled) URL in `DATABASE_URL` | Single Render instance, small pool; migrations need a direct connection anyway. |
| Dev DB | A Neon **dev branch**; `DATABASE_URL` required everywhere | One driver, dev = prod. No local-file fallback. |
| Hosting | Render web service, **native Node runtime**, **free plan** | Docker only existed to work around Railway's Nixpacks/corepack crash with pnpm 11.1.2; Render's native runtime needs no extra file. Free plan sleeps after 15 min idle (~1 min cold start), accepted for now. |
| Migrations | Drop SQLite history, generate one fresh Postgres baseline | SQLite migrations cannot replay on Postgres. |
| Data transfer | One-off script reading the SQLite file via `node:sqlite` | Built into Node 22 → `@libsql/client` can be removed entirely. |

## Design

### 1. Database client — `src/features/data/db/client.ts`

- `postgres(process.env.DATABASE_URL, { idle_timeout })` → `drizzle(client, { schema })`.
- `DATABASE_URL` missing → throw a clear error at startup (no silent fallback).
  `DATABASE_AUTH_TOKEN` is removed everywhere.
- `idle_timeout` (named constant in `db/constants.ts`) so idle connections close
  before Neon's compute auto-suspends (5 min) and are reopened cleanly.
- Stays server-only (same rule as today).

### 2. Schema — `src/features/data/db/schema.ts`

`sqlite-core` → `pg-core`, same table and column names:

| SQLite | Postgres |
| --- | --- |
| `text(…, { mode: 'json' }).$type<T>()` | `jsonb(…).$type<T>()` |
| `integer(…, { mode: 'boolean' })` | `boolean(…)` |
| `integer(…, { mode: 'timestamp' })` | `timestamp(…, { withTimezone: true })` (reads as `Date`) |
| singleton `integer('id').primaryKey({ autoIncrement: true })` | `integer('id').primaryKey()` (always `SINGLETON_ID`) |
| `integer` / `text` | unchanged |

Inferred row types stay the same, so `types.ts`, `schemas.ts` (`SchemaTypeChecks`), the read
mapping in `server/portfolio-data.ts`, `last-updated.ts` (`onConflictDoUpdate`), and `seed.ts`
(transaction) need no logic change. The schema header comment drops the SQLite-specific wording.

### 3. Migrations & tooling

- `drizzle.config.ts`: `dialect: 'postgresql'`, `dbCredentials: { url: DATABASE_URL }`.
- Delete `drizzle/0000…0003` + `drizzle/meta`, run `pnpm db:generate` → one Postgres baseline.
- `scripts/migrate.ts`: `drizzle-orm/postgres-js/migrator`; then close the client instead of relying
  only on `process.exit`. Seed-only-if-empty logic unchanged.
- `scripts/seed.ts`: update the doc comment (no Turso/local-file mention).
- Dependencies: add `postgres`; remove `@libsql/client`.

### 4. Render deployment

- New `render.yaml` (Blueprint): one `web` service, `runtime: node`, `plan: free`, `branch: main`,
  `autoDeploy: true`, `healthCheckPath: /`;
  - `buildCommand: npx pnpm@11.1.2 install --frozen-lockfile && npx pnpm@11.1.2 build`
    (pnpm pinned to the locally tested version, installed via `npx`, NOT corepack — corepack is
    what crashed with pnpm 11.1.2 on Railway);
  - `startCommand: npm run start` (the `start` script only needs `tsx`/`vite` from `node_modules`,
    so no pnpm at runtime);
  - `envVars`: `DATABASE_URL` and `ADMIN_PASSWORD` with `sync: false` (entered in the dashboard).
- Node version: Render honours `engines.node: "22.x"` (and `.nvmrc`); `node:sqlite` is only used by
  the local transfer script, not at runtime.
- `PORT` is injected by Render; `pnpm start` already uses `${PORT:-3000}`.
- Delete `railway.json`. No persistent volume needed.
- **Docker fallback**: keep `Dockerfile` + `.dockerignore` until the first native deploy succeeds.
  If the native build fails on pnpm setup, switch `render.yaml` to `runtime: docker` (the existing
  `Dockerfile` already works). Once the native deploy is verified, delete both files.

### 5. Data transfer — `scripts/transfer-from-sqlite.ts`

Usage: `pnpm db:transfer <path/portfolio.db> [--force]` with `DATABASE_URL` pointing at Neon prod.

1. Open the SQLite file read-only with `node:sqlite`.
2. **Pure conversion** (separate module, unit-tested): rows → `PortfolioData` + `Message[]`.
   JSON text → parsed; `0/1` → boolean; Drizzle SQLite timestamps (Unix **seconds**) → `Date`/ISO;
   `NULL` → `undefined`; projects/experiences sorted by `order`, skills/education by `position`.
3. Validate with `portfolioDataSchema.parse` (abort on failure; nothing written).
4. Safety: if Neon already has a `personal_info` row, abort unless `--force`.
5. Write content via existing `seedDatabase(data)` (transactional, full replace), then insert
   messages with `onConflictDoNothing()` → re-running after a partial failure is safe.
6. Print counts per table.

### 6. Cutover order (documented in `DEPLOY.md`)

1. Create Neon project (prod = `main` branch) + a `dev` branch.
2. Extract `portfolio.db` from the Railway volume (`railway ssh`, base64-piped to avoid binary
   corruption), check it opens.
3. Locally: `DATABASE_URL=<prod> pnpm db:migrate` then `pnpm db:transfer ./portfolio.db`.
4. Create the Render service from `render.yaml`, set env vars, deploy. Migrate is a no-op and the
   seed is skipped (DB not empty).
5. Verify the public site, `/en/`, `/admin` edits, messages inbox. Only then shut down Railway and
   delete `Dockerfile` + `.dockerignore` (section 4).

Rollback: Railway stays untouched until step 5, so reverting = keep using Railway.

### 7. Docs & config

- `.env.local.example`: `DATABASE_URL` (Neon dev branch, required) + `ADMIN_PASSWORD`.
- `DEPLOY.md`: rewritten for Render + Neon (sections 4–6).
- `CLAUDE.md`: stack/env/commands/data-flow wording updated (Postgres, Neon, Render, `db:transfer`).

## Testing

- Vitest: the SQLite-row → `PortfolioData`/`Message` conversion (JSON, booleans, seconds → Date,
  null → undefined, ordering), plus the converted fixture passes `portfolioDataSchema`.
- Static: `tsc`, `pnpm lint`, `pnpm build`.
- Integration against the Neon dev branch (needs the user's dev `DATABASE_URL` in `.env.local`):
  `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev` → SSR HTML of `/` and `/en/` contains DB content;
  an admin edit persists after reload.
- Transfer dry run: run the script against the dev branch with a copy of the prod SQLite file.

## Risks

- **Free-plan cold starts** (~1 min after 15 min idle) — accepted; upgrade = change `plan`.
- **Neon auto-suspend** adds a short first-query latency after idle; mitigated by `idle_timeout`.
- **Extracting the SQLite file** from Railway is manual; the script validates before writing.
- **pnpm 11 on Render's native runtime** is untested until the first deploy; fallback is
  `runtime: docker` with the kept `Dockerfile`.
