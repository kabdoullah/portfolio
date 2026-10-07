/**
 * One-off: copy the legacy Railway SQLite database into Postgres (Neon).
 *
 *   pnpm db:transfer ./portfolio.db            # target must be migrated and empty
 *   pnpm db:transfer ./portfolio.db --force    # replace existing content
 *
 * DATABASE_URL (from .env.local or the shell) is the TARGET. Content is
 * validated (Zod) before anything is written, then written through
 * `seedDatabase()` (one transaction, full replace). Messages are inserted with
 * ON CONFLICT DO NOTHING, so a re-run with --force never duplicates them.
 */
import { DatabaseSync } from 'node:sqlite'
import { convertSqliteTables } from '#/features/data/db/fromSqlite'
import type { SqliteTables } from '#/features/data/db/fromSqlite'
import { db, queryClient } from '#/features/data/db/client'
import { messages } from '#/features/data/db/schema'
import { seedDatabase } from '#/features/data/db/seed'

const USAGE = 'Usage: pnpm db:transfer <path/to/portfolio.db> [--force]'

function readLegacyTables(path: string): SqliteTables {
  const sqlite = new DatabaseSync(path, { readOnly: true })
  try {
    // Fixed table names (never user input) — no injection surface.
    const all = (table: string) =>
      sqlite.prepare(`SELECT * FROM ${table}`).all()
    return {
      personalInfo: all('personal_info'),
      skills: all('skills'),
      projects: all('projects'),
      experiences: all('experiences'),
      education: all('education_entries'),
      settings: all('settings'),
      messages: all('messages'),
    }
  } finally {
    sqlite.close()
  }
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const path = args.find((arg) => !arg.startsWith('--'))
  if (!path) throw new Error(USAGE)

  const { data, messages: inbox } = convertSqliteTables(readLegacyTables(path))

  const existing = await db.query.personalInfo.findFirst()
  if (existing && !force) {
    throw new Error(
      'Target database already has content — nothing written. Re-run with --force to replace it.',
    )
  }

  await seedDatabase(data)
  if (inbox.length) {
    await db
      .insert(messages)
      .values(inbox.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })))
      .onConflictDoNothing()
  }

  console.log(
    `✓ transferred: ${data.projects.length} projects, ${data.experiences.length} experiences, ` +
      `${data.skills.length} skills, ${data.education.length} education, ${inbox.length} messages`,
  )
}

main()
  .then(async () => {
    await queryClient.end()
    process.exit(0)
  })
  .catch(async (error: unknown) => {
    console.error('✗ transfer failed:', error)
    await queryClient.end()
    process.exit(1)
  })
