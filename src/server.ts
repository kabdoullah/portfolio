import { paraglideMiddleware } from '#/paraglide/server'
import { localeCookieRedirect } from '#/features/i18n/localeRedirect'
import handler from '@tanstack/react-start/server-entry'

// Paraglide SSR middleware: detects the locale from the incoming request
// (url → cookie → Accept-Language → baseLocale), sets the cookie, and exposes
// the locale via AsyncLocalStorage so server-rendered `m.*()` calls resolve to
// the right language. We pass the ORIGINAL `req` (not the middleware's modified
// request) because TanStack Router de/re-localizes URLs itself via `rewrite`;
// using the modified request would delocalize twice and cause a redirect loop.
export default {
  fetch(req: Request): Promise<Response> {
    const redirect = localeCookieRedirect(req)
    if (redirect) return Promise.resolve(redirect)
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
}
