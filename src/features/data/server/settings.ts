import { createServerFn } from '@tanstack/react-start'
import { db } from '#/features/data/db/client'
import { personalInfo } from '#/features/data/db/schema'
import { SINGLETON_ID } from '#/features/data/db/constants'
import { touchLastUpdated } from '#/features/data/server/last-updated'
import { personalInfoSchema } from '#/features/data/schemas'

export const updatePersonalInfo = createServerFn({ method: 'POST' })
  .validator((input: unknown) => personalInfoSchema.parse(input))
  .handler(async ({ data }) => {
    const now = new Date()
    await db
      .insert(personalInfo)
      .values({ id: SINGLETON_ID, ...data })
      .onConflictDoUpdate({ target: personalInfo.id, set: data })
    await touchLastUpdated(now)
    return data
  })
