import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/features/data/db/client'
import { skills } from '#/features/data/db/schema'
import { skillSchema } from '#/features/data/schemas'
import { touchLastUpdated } from '#/features/data/server/last-updated'

/** Next display position = current count (append to the end). */
async function nextPosition(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(skills)
  return row.count
}

export const createSkill = createServerFn({ method: 'POST' })
  .validator((input: unknown) => skillSchema.parse(input))
  .handler(async ({ data }) => {
    await db.insert(skills).values({ ...data, position: await nextPosition() })
    await touchLastUpdated()
    return data
  })

export const updateSkill = createServerFn({ method: 'POST' })
  .validator((input: unknown) => skillSchema.parse(input))
  .handler(async ({ data }) => {
    // `position` is persistence-only — leave it untouched on edit.
    await db
      .update(skills)
      .set({
        name: data.name,
        category: data.category,
        level: data.level,
      })
      .where(eq(skills.id, data.id))
    await touchLastUpdated()
    return data
  })

export const deleteSkill = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.string().parse(input))
  .handler(async ({ data: id }) => {
    await db.delete(skills).where(eq(skills.id, id))
    await touchLastUpdated()
    return id
  })
