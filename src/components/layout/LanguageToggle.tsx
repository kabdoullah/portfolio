import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { cn } from '#/lib/utils'
import type { Locale } from '#/paraglide/runtime'

// Short labels + accessible names per locale. Kept here (not in messages) on
// purpose: a language switcher must read in each language's own script, so its
// labels are intentionally NOT translated.
const LOCALE_META: Record<Locale, { label: string; name: string }> = {
  fr: { label: 'FR', name: 'Français' },
  en: { label: 'EN', name: 'English' },
}

/**
 * Segmented FR/EN switch. `setLocale` persists the choice (PARAGLIDE_LOCALE
 * cookie) and does a full navigation to the current page's equivalent URL in the
 * target locale, so the server re-renders with the right `lang` and content.
 * `getLocale()` is derived from the URL on both server and client, so the active
 * state is hydration-safe without a mounted guard.
 */
export function LanguageToggle() {
  const active = getLocale()

  return (
    <div
      role="group"
      aria-label="Choix de la langue / Language"
      className="flex items-center rounded-md border border-border/60 text-xs font-semibold"
    >
      {locales.map((locale, index) => {
        const isActive = locale === active
        const meta = LOCALE_META[locale]
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={isActive}
            aria-label={
              isActive
                ? `Langue active : ${meta.name}`
                : `Afficher le site en ${meta.name}`
            }
            disabled={isActive}
            onClick={() => setLocale(locale)}
            className={cn(
              'px-2 py-1 transition-colors',
              index === 0 ? 'rounded-l-md' : 'rounded-r-md',
              isActive
                ? 'cursor-default text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
