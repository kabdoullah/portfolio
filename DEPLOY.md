# Deploy to Railway

This app is a TanStack Start server + SQLite (libsql). On Railway it runs as a
Node service backed by a **persistent volume** (so the SQLite file survives
redeploys). Free-tier friendly, no external database account required.

## What the repo already provides

- `railway.json` — NIXPACKS build, `pnpm start` as the start command.
- `pnpm start` → runs `scripts/migrate.ts` (applies migrations, seeds defaults
  only on an empty DB) then serves the production build via `vite preview` on
  `$PORT`.
- `engines.node >= 20`.

## One-time setup in the Railway dashboard

1. **New Project → Deploy from GitHub repo** → pick `kabdoullah/portfolio`
   (branch `main`). Railway auto-builds with Nixpacks (`pnpm install` +
   `pnpm build`) and starts with `pnpm start`.

2. **Add a Volume** (Service → Settings → Volumes):
   - Mount path: `/data`
   - This is where the SQLite file lives. Without it, data resets on every deploy.

3. **Variables** (Service → Variables):
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `file:/data/portfolio.db` |
   | `ADMIN_PASSWORD` | your admin password (NOT `VITE_`-prefixed) |

   Railway injects `PORT` automatically — do not set it.

4. **Deploy.** First boot runs migrations and seeds default content. Visit the
   generated `*.up.railway.app` URL; `/admin` uses `ADMIN_PASSWORD`.

## Updating content vs. redeploying

Edits made in `/admin` are written to the DB on the volume and **persist across
redeploys** (the seed only runs when the DB is empty). To wipe back to defaults,
delete the volume (or the `portfolio.db` file on it) and redeploy.

## Notes

- `@libsql/client` stays server-only (verified: not in the client bundle).
- The admin password is checked server-side; it is never shipped to the browser.
- To move to Turso later (e.g. for serverless hosts): set `DATABASE_URL` to the
  `libsql://…` URL and add `DATABASE_AUTH_TOKEN`. No code change needed.
