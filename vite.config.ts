// vitest/config re-exports vite's defineConfig with the `test` field typed.
import { defineConfig } from 'vitest/config'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // Locale logic is plain Request/URL handling — no DOM needed.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  // Production is served via `vite preview` (see the `start` script). Vite blocks
  // requests with an unknown Host header; allow the platform domain (Railway) so
  // the public URL is not rejected with a 403.
  preview: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    // Paraglide must run before the router/start plugins so the generated
    // `src/paraglide` modules exist when routes are compiled.
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      outputStructure: 'message-modules',
      // Emit .d.ts so the generated JS modules are typed under `tsc --noEmit`
      // (strict mode rejects the implicit-any JS otherwise).
      emitTsDeclarations: true,
      cookieName: 'PARAGLIDE_LOCALE',
      strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
      // fr is the base locale and stays unprefixed (/about); only en is
      // prefixed (/en/about). Listing both locales keeps de/localizeUrl
      // unambiguous — `en` (more specific) is matched before the `fr` catch-all.
      urlPatterns: [
        {
          pattern: '/:path(.*)?',
          localized: [
            ['en', '/en/:path(.*)?'],
            ['fr', '/:path(.*)?'],
          ],
        },
      ],
    }),
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})

export default config
