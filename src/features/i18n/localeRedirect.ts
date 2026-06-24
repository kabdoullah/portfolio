import { cookieName, localizeUrl } from '#/paraglide/runtime'

/** Read a single cookie value from the raw request `Cookie` header (SSR-safe;
 * paraglide's `extractLocaleFromCookie` needs `document` and can't run here). */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get('cookie')
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

/** On a bare (fr-canonical, unprefixed) document request, honour a previously
 * chosen English preference by redirecting to the /en/ equivalent. We only act
 * on the persisted cookie — never Accept-Language — so first-time visitors and
 * crawlers keep the stable fr canonical, and only an explicit prior toggle moves
 * them. Skips /en/* (already localized), /admin/* (single-language tool), and
 * non-HTML requests (assets, server fns) so we never redirect those. */
export function localeCookieRedirect(req: Request): Response | undefined {
  const accept = req.headers.get('accept') ?? ''
  if (!accept.includes('text/html')) return undefined

  const url = new URL(req.url)
  const path = url.pathname
  const isLocalized = path === '/en' || path.startsWith('/en/')
  const isAdmin = path === '/admin' || path.startsWith('/admin/')
  if (isLocalized || isAdmin) return undefined

  if (readCookie(req, cookieName) !== 'en') return undefined

  const target = localizeUrl(url, { locale: 'en' })
  return new Response(null, {
    status: 302,
    headers: { Location: target.pathname + target.search },
  })
}
