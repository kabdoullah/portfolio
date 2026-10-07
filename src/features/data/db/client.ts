import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '#/features/data/db/schema'
import { DB_IDLE_TIMEOUT_SECONDS } from '#/features/data/db/constants'

// The ONE place that instantiates the DB connection. Everything else imports
// `db` from here — never a second client. Server-only: this file (and anything
// importing it) must only be reached through `src/features/data/server/*`,
// which TanStack Start strips from the client bundle, or from `scripts/*`.
// Never import it from a component.
//
// DATABASE_URL is the Neon *direct* (unpooled) connection string — the `dev`
// branch locally (.env.local), the `main` branch on Render. Required: failing
// loudly here beats a cryptic connection error on the first query.
const url = process.env.DATABASE_URL
if (!url) {
  throw new Error(
    'DATABASE_URL is not set — point it at a Neon Postgres database (see .env.local.example)',
  )
}

/** Raw postgres.js pool — exported only so scripts can close it (`queryClient.end()`). */
export const queryClient = postgres(url, {
  idle_timeout: DB_IDLE_TIMEOUT_SECONDS,
})

export const db = drizzle(queryClient, { schema })
