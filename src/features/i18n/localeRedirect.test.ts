import { describe, expect, it } from 'vitest'
import {
  deLocalizeUrl,
  extractLocaleFromHeader,
  extractLocaleFromUrl,
  localizeUrl,
} from '#/paraglide/runtime'
import { localeCookieRedirect, readCookie } from '#/features/i18n/localeRedirect'

const ORIGIN = 'https://example.com'

function htmlRequest(path: string, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${path}`, {
    headers: { accept: 'text/html', ...headers },
  })
}

describe('locale detection → URL prefix', () => {
  it('maps a browser Accept-Language to the right locale', () => {
    expect(extractLocaleFromHeader(htmlRequest('/', { 'accept-language': 'en-US,en;q=0.9' }))).toBe('en')
    expect(extractLocaleFromHeader(htmlRequest('/', { 'accept-language': 'fr-FR,fr;q=0.9' }))).toBe('fr')
  })

  it('localizes a path to the prefix expected for each detected locale', () => {
    // fr is the unprefixed base; en lives under /en/.
    expect(localizeUrl(`${ORIGIN}/`, { locale: 'fr' }).pathname).toBe('/')
    expect(localizeUrl(`${ORIGIN}/`, { locale: 'en' }).pathname).toBe('/en/')
  })

  it('extracts the locale back from a prefixed/unprefixed URL', () => {
    expect(extractLocaleFromUrl(`${ORIGIN}/`)).toBe('fr')
    expect(extractLocaleFromUrl(`${ORIGIN}/en/`)).toBe('en')
    expect(extractLocaleFromUrl(`${ORIGIN}/en/projects`)).toBe('en')
  })

  it('de-localizes an /en/ URL to the canonical fr path', () => {
    expect(deLocalizeUrl(`${ORIGIN}/en/projects`).pathname).toBe('/projects')
  })
})

describe('readCookie', () => {
  it('parses a value from the Cookie header', () => {
    const req = htmlRequest('/', { cookie: 'foo=1; PARAGLIDE_LOCALE=en; bar=2' })
    expect(readCookie(req, 'PARAGLIDE_LOCALE')).toBe('en')
  })

  it('returns undefined when absent or no header', () => {
    expect(readCookie(htmlRequest('/'), 'PARAGLIDE_LOCALE')).toBeUndefined()
    expect(readCookie(htmlRequest('/', { cookie: 'x=1' }), 'PARAGLIDE_LOCALE')).toBeUndefined()
  })
})

describe('localeCookieRedirect (cookie-only, fr base unprefixed)', () => {
  it('redirects a bare HTML request to /en/ when the EN cookie is set', () => {
    const res = localeCookieRedirect(htmlRequest('/', { cookie: 'PARAGLIDE_LOCALE=en' }))
    expect(res?.status).toBe(302)
    expect(res?.headers.get('location')).toBe('/en/')
  })

  it('preserves the path when redirecting', () => {
    const res = localeCookieRedirect(htmlRequest('/projects', { cookie: 'PARAGLIDE_LOCALE=en' }))
    expect(res?.headers.get('location')).toBe('/en/projects')
  })

  it('does not redirect without the EN cookie', () => {
    expect(localeCookieRedirect(htmlRequest('/'))).toBeUndefined()
    expect(localeCookieRedirect(htmlRequest('/', { cookie: 'PARAGLIDE_LOCALE=fr' }))).toBeUndefined()
  })

  it('does not redirect already-localized /en/ paths', () => {
    expect(localeCookieRedirect(htmlRequest('/en/', { cookie: 'PARAGLIDE_LOCALE=en' }))).toBeUndefined()
  })

  it('does not redirect the single-language /admin', () => {
    expect(localeCookieRedirect(htmlRequest('/admin', { cookie: 'PARAGLIDE_LOCALE=en' }))).toBeUndefined()
  })

  it('does not redirect non-HTML (asset / server-fn) requests', () => {
    const asset = new Request(`${ORIGIN}/favicon.svg`, {
      headers: { accept: 'image/svg+xml', cookie: 'PARAGLIDE_LOCALE=en' },
    })
    expect(localeCookieRedirect(asset)).toBeUndefined()
  })
})
