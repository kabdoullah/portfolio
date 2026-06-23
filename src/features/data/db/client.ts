import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '#/features/data/db/schema'

// The ONE place that instantiates the DB connection. Everything else imports
// `db` from here — never a second client. Server-only: this file (and anything
// importing it) must only be reached through `src/features/data/server/*`,
// which TanStack Start strips from the client bundle. Never import it from a
// component.
//
// Dev:  DATABASE_URL unset → local file `file:portfolio.db`.
// Prod: set DATABASE_URL (libsql://… for Turso) + DATABASE_AUTH_TOKEN.
const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:portfolio.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
