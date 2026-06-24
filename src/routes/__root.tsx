import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import { PortfolioDataProvider } from '#/features/data/PortfolioDataContext'
import { ThemeProvider } from '#/components/layout/ThemeProvider'
import { Toaster } from '#/components/ui/sonner'
import { getLocale } from '#/paraglide/runtime'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    // Per-page title/description + hreflang live in the route heads (index for the
    // public site, admin for the dashboard) so the public SEO tags don't leak onto
    // /admin. Only locale-agnostic, document-wide tags stay here.
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // SSR and client both derive the locale from the same URL (the /en/ prefix
  // survives hydration), so `lang` is identical on both sides — no mismatch.
  // A locale switch does a full navigation (see LanguageToggle), so this shell
  // re-renders with the new lang on the next document load.
  const locale = getLocale()
  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <PortfolioDataProvider>{children}</PortfolioDataProvider>
          <Toaster richColors position="bottom-center" />
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
