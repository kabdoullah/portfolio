import { useContext } from 'react'
import { PortfolioDataContext } from '#/features/data/PortfolioDataContext'
import type { PortfolioDataContextValue } from '#/features/data/PortfolioDataContext'

/** Single read/write entry point for portfolio data. Must be used within PortfolioDataProvider. */
export function usePortfolioData(): PortfolioDataContextValue {
  const context = useContext(PortfolioDataContext)
  if (!context) {
    throw new Error(
      'usePortfolioData must be used within a PortfolioDataProvider',
    )
  }
  return context
}
