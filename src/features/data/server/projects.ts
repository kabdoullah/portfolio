import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/features/data/db/client'
import { projects } from '#/features/data/db/schema'
import { projectSchema } from '#/features/data/schemas'
import { touchLastUpdated } from '#/features/data/server/last-updated'

export const createProject = createServerFn({ method: 'POST' })
  .validator((input: unknown) => projectSchema.parse(input))
  .handler(async ({ data }) => {
    await db.insert(projects).values(data)
    await touchLastUpdated()
    return data
  })

export const updateProject = createServerFn({ method: 'POST' })
  .validator((input: unknown) => projectSchema.parse(input))
  .handler(async ({ data }) => {
    await db.update(projects).set(data).where(eq(projects.id, data.id))
    await touchLastUpdated()
    return data
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.string().parse(input))
  .handler(async ({ data: id }) => {
    await db.delete(projects).where(eq(projects.id, id))
    await touchLastUpdated()
    return id
  })

export const reorderProjects = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.array(z.string()).parse(input))
  .handler(async ({ data: orderedIds }) => {
    await Promise.all(
      orderedIds.map((id, index) =>
        db.update(projects).set({ order: index }).where(eq(projects.id, id)),
      ),
    )
    await touchLastUpdated()
    return orderedIds
  })
