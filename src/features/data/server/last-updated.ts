import { db } from '#/features/data/db/client'
import { settings } from '#/features/data/db/schema'
import { SINGLETON_ID } from '#/features/data/db/constants'

// Server-only helper, deliberately in its own file. It must NOT live alongside a
// Server Function that the client imports: it is a plain (non-`createServerFn`)
// function that touches `db`, so the TanStack server-fn split would leave its
// `db/client` import (→ @libsql/client, Node built-ins) in the client bundle and
// crash the browser. Importers are server-fn handlers only.

/**
 * Bump `lastUpdated`. Side effect of every mutation — callers never set it.
 * Inserts the settings row if it does not exist yet.
 */
export async function touchLastUpdated(when: Date = new Date()): Promise<void> {
  await db
    .insert(settings)
    .values({ id: SINGLETON_ID, lastUpdated: when })
    .onConflictDoUpdate({ target: settings.id, set: { lastUpdated: when } })
}
