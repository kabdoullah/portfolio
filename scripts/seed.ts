/**
 * One-off seed: populate the DB with the default content. Run after the schema
 * is applied (`pnpm db:push` or `pnpm db:migrate`):
 *
 *   pnpm db:seed        # seed an already-migrated DB
 *   pnpm db:setup       # push schema + seed in one go
 *
 * Uses DATABASE_URL (loaded from .env.local by the npm script), like the app.
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
