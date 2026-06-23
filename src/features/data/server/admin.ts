import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

/**
 * Verify the admin password server-side. The password lives in `ADMIN_PASSWORD`
 * (NOT `VITE_ADMIN_PASSWORD` — the `VITE_` prefix would embed it in the client
 * bundle). Returns only a boolean; the secret never reaches the browser.
 */
export const verifyAdminPassword = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ password: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD ?? 'admin2025'
    return { isValid: data.password === expected }
  })
