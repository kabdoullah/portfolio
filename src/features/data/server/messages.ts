import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/features/data/db/client'
import { messages } from '#/features/data/db/schema'
import { newMessageSchema } from '#/features/data/schemas'
import type { Message } from '#/features/data/types'

// Contact-form messages live outside `PortfolioData`, so these functions do NOT
// go through `usePortfolioData()` / the portfolio cache and never touch
// `lastUpdated`. `createMessage` is public (the visitor form); the rest are
// admin-only by virtue of the client-side `/admin` gate — same posture as the
// other CRUD server functions in this project.

/** Public: persist a contact-form submission. Server assigns id/read/createdAt. */
export const createMessage = createServerFn({ method: 'POST' })
  .validator((input: unknown) => newMessageSchema.parse(input))
  .handler(async ({ data }) => {
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      message: data.message,
      read: false,
      createdAt: new Date(),
    })
  })

/** Admin: the full inbox, newest first. Normalises the timestamp to ISO. */
export const getMessages = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Message[]> => {
    const rows = await db.query.messages.findMany({
      orderBy: [desc(messages.createdAt)],
    })
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
    }))
  },
)

/** Admin: flip a message's read flag. */
export const setMessageRead = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ id: z.string(), read: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    await db
      .update(messages)
      .set({ read: data.read })
      .where(eq(messages.id, data.id))
    return data
  })

/** Admin: permanently delete a message. */
export const deleteMessage = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.string().parse(input))
  .handler(async ({ data: id }) => {
    await db.delete(messages).where(eq(messages.id, id))
    return id
  })
