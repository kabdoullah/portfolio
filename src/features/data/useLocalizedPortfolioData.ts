import { usePortfolioData } from '#/features/data/usePortfolioData'
import { localizePortfolioData } from '#/features/data/localize'
import { getLocale } from '#/paraglide/runtime'
import type { PortfolioData } from '#/features/data/types'

/**
 * Read-only view of the portfolio data with translatable fields resolved to the
 * active locale (French fallback when a translation is missing). Public sections
 * use this instead of `usePortfolioData()` so they render the right language
 * without per-field logic. Admin keeps `usePortfolioData()` to edit both languages.
 */
export function useLocalizedPortfolioData(): { data: PortfolioData } {
  const { data } = usePortfolioData()
  return { data: localizePortfolioData(data, getLocale()) }
}
