/**
 * One-off seed: populate the DB with the default content. Run after the schema
 * is applied (`pnpm db:push` or `pnpm db:migrate`):
 *
 *   pnpm db:seed        # seed an already-migrated DB
 *   pnpm db:setup       # push schema + seed in one go
 *
 * Honours DATABASE_URL / DATABASE_AUTH_TOKEN (Turso) the same as the app;
 * defaults to the local `file:portfolio.db`.
 */
import { seedDatabase } from '#/features/data/db/seed'

seedDatabase()
  .then(() => {
    console.log('✓ Database seeded with default portfolio content')
    process.exit(0)
  })
  .catch((error: unknown) => {
    console.error('✗ Seed failed:', error)
    process.exit(1)
  })
