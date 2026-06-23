import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/features/data/db/client'
import { educationEntries } from '#/features/data/db/schema'
import { educationSchema } from '#/features/data/schemas'
import { touchLastUpdated } from '#/features/data/server/last-updated'

/** Next display position = current count (append to the end). */
async function nextPosition(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(educationEntries)
  return row.count
}

export const createEducation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => educationSchema.parse(input))
  .handler(async ({ data }) => {
    await db
      .insert(educationEntries)
      .values({ ...data, position: await nextPosition() })
    await touchLastUpdated()
    return data
  })

export const updateEducation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => educationSchema.parse(input))
  .handler(async ({ data }) => {
    // `position` is persistence-only — leave it untouched on edit.
    await db
      .update(educationEntries)
      .set({
        degree: data.degree,
        school: data.school,
        period: data.period,
        description: data.description,
      })
      .where(eq(educationEntries.id, data.id))
    await touchLastUpdated()
    return data
  })

export const deleteEducation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.string().parse(input))
  .handler(async ({ data: id }) => {
    await db.delete(educationEntries).where(eq(educationEntries.id, id))
    await touchLastUpdated()
    return id
  })
