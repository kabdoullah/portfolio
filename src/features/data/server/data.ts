import { createServerFn } from '@tanstack/react-start'
import { seedDatabase } from '#/features/data/db/seed'
import { getDefaultData } from '#/features/data/defaults'
import { portfolioDataSchema } from '#/features/data/schemas'

/**
 * Replace all content with a validated JSON payload. Zod validation is
 * mandatory before any write — the same rule the old localStorage import
 * followed, now enforced server-side for the DB.
 */
export const importPortfolioData = createServerFn({ method: 'POST' })
  .validator((input: unknown) => portfolioDataSchema.parse(input))
  .handler(async ({ data }) => {
    await seedDatabase(data)
    return data
  })

/**
 * Reset everything to the seed defaults. Destructive and NOT reversible by a
 * page refresh (unlike the old localStorage version) — the caller must confirm
 * before invoking this.
 */
export const resetToDefaults = createServerFn({ method: 'POST' }).handler(
  async () => {
    const defaults = getDefaultData()
    await seedDatabase(defaults)
    return defaults
  },
)
