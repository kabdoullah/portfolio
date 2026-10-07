# Deploy to Render + Neon

The app is a TanStack Start server (Render web service, native Node runtime,
free plan) backed by Neon Postgres. Content edited in `/admin` lives in Neon and
survives redeploys.

## What the repo provides

- `render.yaml` — Blueprint: region `ohio` (same AWS region as Neon, us-east-2),
  build `npx pnpm@11.18.0 install --frozen-lockfile && npx pnpm@11.18.0 build`,
  start `npm run start`, auto-deploy on every commit to `main`.
- `npm run start` → `scripts/migrate.ts` (applies migrations, seeds defaults
  only on an empty DB) then `vite preview` on `$PORT` (injected by Render).
- `engines.node: 22.x`.

## 1. Neon

1. Project in **AWS us-east-2** (matches the Render `ohio` region in `render.yaml`).
2. The default `main` branch is production. A `dev` branch is for local work.
3. For each branch, copy the **direct** connection string: the host must NOT
   contain `-pooler` (turn "Connection pooling" off in the Connect dialog).
   `?sslmode=require&channel_binding=require` can stay as is.
4. Local: put the `dev` URL in `.env.local` (`DATABASE_URL=…`), then
   `pnpm db:migrate && pnpm db:seed`.

## 2. Move production data from Railway (one time)

1. Inside the Railway service (`railway ssh`, interactive), make a consistent
   copy (`VACUUM INTO` also captures pages still in the WAL file), print its
   checksum and the row count of every table:
   ```bash
   node -e "const {DatabaseSync}=require('node:sqlite'); const d=new DatabaseSync('/data/portfolio.db'); d.exec(\"VACUUM INTO '/tmp/export.db'\"); for (const t of ['personal_info','skills','projects','experiences','education_entries','settings','messages']) console.log(t, d.prepare('select count(*) n from '+t).get().n)"
   sha256sum /tmp/export.db
   ```
   Note the counts and the checksum.
2. Download it. `tr -d '\r'` strips carriage returns a terminal may add:
   ```bash
   railway ssh -- base64 /tmp/export.db | tr -d '\r' | base64 --decode > portfolio-prod.db
   ```
   If that one-liner does not work with your CLI version, run `base64 /tmp/export.db`
   in the interactive session, paste the output into `export.b64` locally, then
   `tr -d '\r' < export.b64 | base64 --decode > portfolio-prod.db`.
3. **Verify before going further** — all three must hold, otherwise download again:
   ```bash
   shasum -a 256 portfolio-prod.db        # must equal the Railway checksum
   node -e "const {DatabaseSync}=require('node:sqlite'); const d=new DatabaseSync('portfolio-prod.db',{readOnly:true}); console.log(d.prepare('pragma integrity_check').get()); for (const t of ['personal_info','skills','projects','experiences','education_entries','settings','messages']) console.log(t, d.prepare('select count(*) n from '+t).get().n)"
   ```
   `integrity_check` must print `ok`, and every count must equal the Railway counts.
4. Rehearse on the dev branch: `pnpm db:transfer ./portfolio-prod.db --force`,
   then check `pnpm dev`.
5. Production (an inline `DATABASE_URL` wins over `.env.local`):
   ```bash
   DATABASE_URL='<main direct URL>' pnpm db:migrate
   DATABASE_URL='<main direct URL>' pnpm db:transfer ./portfolio-prod.db
   ```
   The script validates everything before writing and refuses to overwrite a
   non-empty database unless `--force` is passed. Re-running with `--force` is
   safe: content is replaced, already-copied messages are skipped.
6. Compare the counts printed by `db:transfer` with the Railway counts, then delete
   `portfolio-prod.db` and `export.b64` once the cutover is verified (they hold visitors'
   contact messages).

## 3. Render

1. Dashboard → **New → Blueprint** → pick `kabdoullah/portfolio`, branch `main`.
2. Enter the `sync: false` variables:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon `main` direct connection string |
   | `ADMIN_PASSWORD` | admin password (NOT `VITE_`-prefixed) |

3. Deploy. Migrations are a no-op and the seed is skipped (the DB already has
   content).

## 4. Cut over

1. Verify on the `*.onrender.com` URL: `/`, `/en/`, an `/admin` edit that
   survives a reload, the messages inbox.
2. Only then shut down the Railway service.
3. Once the native deploy is confirmed, delete `Dockerfile` and `.dockerignore`.
   If the native build fails while installing pnpm, set `runtime: docker` in
   `render.yaml` instead — the Dockerfile is the tested fallback.

## Notes

- Free plan: the service sleeps after 15 min without traffic; the next visit
  waits ~1 min. Upgrade by changing `plan` in `render.yaml`.
- Neon suspends idle compute after 5 min; the first query after that is
  slightly slower.
- The admin password is checked server-side; it never reaches the browser.
