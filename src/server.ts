import { paraglideMiddleware } from '#/paraglide/server'
import { localeCookieRedirect } from '#/features/i18n/localeRedirect'
import handler from '@tanstack/react-start/server-entry'

// Liveness probe for Render's health check and the external keep-alive cron.
// Answered before i18n and the router so it never triggers SSR or a DB query.
const HEALTH_PATH = '/health'

// Paraglide SSR middleware: detects the locale from the incoming request
// (url → cookie → Accept-Language → baseLocale), sets the cookie, and exposes
// the locale via AsyncLocalStorage so server-rendered `m.*()` calls resolve to
// the right language. We pass the ORIGINAL `req` (not the middleware's modified
// request) because TanStack Router de/re-localizes URLs itself via `rewrite`;
// using the modified request would delocalize twice and cause a redirect loop.
export default {
  fetch(req: Request): Promise<Response> {
    if (new URL(req.url).pathname === HEALTH_PATH) {
      return Promise.resolve(
        new Response('ok', {
          headers: {
            'content-type': 'text/plain',
            'cache-control': 'no-store',
          },
        }),
      )
    }
    const redirect = localeCookieRedirect(req)
    if (redirect) return Promise.resolve(redirect)
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
}
