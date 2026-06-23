/**
 * Production migrate-on-start. Runs the generated Drizzle migrations against the
 * configured database (DATABASE_URL), then seeds the default content ONLY if the
 * DB is empty — so redeploys never wipe edited content. Idempotent: safe to run
 * on every boot. Invoked by the `start` script before the server comes up.
 */
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from '#/features/data/db/client'
import { seedDatabase } from '#/features/data/db/seed'

async function main() {
  await migrate(db, { migrationsFolder: 'drizzle' })

  const existing = await db.query.personalInfo.findFirst()
  if (existing) {
    console.log('✓ migrations applied — existing content preserved')
  } else {
    await seedDatabase()
    console.log('✓ migrations applied + seeded default content (first run)')
  }
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('✗ migrate-on-start failed:', error)
  process.exit(1)
})
