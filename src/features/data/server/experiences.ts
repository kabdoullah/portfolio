import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/features/data/db/client'
import { experiences } from '#/features/data/db/schema'
import { experienceSchema } from '#/features/data/schemas'
import { touchLastUpdated } from '#/features/data/server/last-updated'

export const createExperience = createServerFn({ method: 'POST' })
  .validator((input: unknown) => experienceSchema.parse(input))
  .handler(async ({ data }) => {
    await db.insert(experiences).values(data)
    await touchLastUpdated()
    return data
  })

export const updateExperience = createServerFn({ method: 'POST' })
  .validator((input: unknown) => experienceSchema.parse(input))
  .handler(async ({ data }) => {
    await db.update(experiences).set(data).where(eq(experiences.id, data.id))
    await touchLastUpdated()
    return data
  })

export const deleteExperience = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.string().parse(input))
  .handler(async ({ data: id }) => {
    await db.delete(experiences).where(eq(experiences.id, id))
    await touchLastUpdated()
    return id
  })

export const reorderExperiences = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.array(z.string()).parse(input))
  .handler(async ({ data: orderedIds }) => {
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(experiences)
          .set({ order: index })
          .where(eq(experiences.id, id)),
      ),
    )
    await touchLastUpdated()
    return orderedIds
  })
