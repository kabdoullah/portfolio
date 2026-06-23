import { db } from '#/features/data/db/client'
import {
  educationEntries,
  experiences,
  personalInfo,
  projects,
  settings,
  skills,
} from '#/features/data/db/schema'
import { getDefaultData } from '#/features/data/defaults'
import { SINGLETON_ID } from '#/features/data/db/constants'
import type { PortfolioData } from '#/features/data/types'

/**
 * Replace the entire DB contents with `data`. Used by the `db:seed` script
 * (first-run seed) and by the admin RESET / IMPORT server functions. Wrapped in
 * a transaction so a failure never leaves the DB half-written.
 */
export async function seedDatabase(
  data: PortfolioData = getDefaultData(),
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(skills)
    await tx.delete(projects)
    await tx.delete(experiences)
    await tx.delete(educationEntries)
    await tx.delete(personalInfo)
    await tx.delete(settings)

    await tx
      .insert(personalInfo)
      .values({ id: SINGLETON_ID, ...data.personalInfo })

    if (data.skills.length) {
      await tx
        .insert(skills)
        .values(data.skills.map((s, position) => ({ ...s, position })))
    }
    if (data.projects.length) {
      await tx.insert(projects).values(data.projects)
    }
    if (data.experiences.length) {
      await tx.insert(experiences).values(data.experiences)
    }
    if (data.education.length) {
      await tx
        .insert(educationEntries)
        .values(data.education.map((e, position) => ({ ...e, position })))
    }

    await tx
      .insert(settings)
      .values({ id: SINGLETON_ID, lastUpdated: new Date(data.lastUpdated) })
  })
}
