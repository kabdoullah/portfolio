import { queryOptions } from '@tanstack/react-query'
import { getPortfolioData } from '#/features/data/server/portfolio-data'

export const PORTFOLIO_DATA_KEY = ['portfolio-data'] as const

// Shared query definition so the SSR loader (root route) and the client
// `useQuery` (PortfolioDataProvider) use the identical key + fetcher. The root
// loader prefetches this into the query cache during SSR; the integration
// dehydrates it, so the first render already has the real DB data (and the
// English content on /en/) instead of the seed defaults.
export const portfolioDataQueryOptions = queryOptions({
  queryKey: PORTFOLIO_DATA_KEY,
  queryFn: () => getPortfolioData(),
})
