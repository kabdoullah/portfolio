import { getDefaultData } from '#/features/data/defaults'
import { portfolioDataSchema } from '#/features/data/schemas'
import type { PortfolioData } from '#/features/data/types'

export const STORAGE_KEY = 'portfolio_data'

const isBrowser = typeof window !== 'undefined'

/**
 * Read persisted data. Falls back to defaults when there is no storage (SSR),
 * nothing saved yet, or the stored payload fails schema validation.
 */
export function loadPortfolioData(): PortfolioData {
  if (!isBrowser) return getDefaultData()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()
    const parsed = portfolioDataSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : getDefaultData()
  } catch {
    return getDefaultData()
  }
}

/** Persist data, stamping `lastUpdated`. Returns the stored object. No-op on SSR. */
export function savePortfolioData(data: PortfolioData): PortfolioData {
  const updated: PortfolioData = { ...data, lastUpdated: new Date().toISOString() }
  if (isBrowser) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }
  return updated
}

/** Trigger a browser download of the data as pretty-printed JSON. */
export function exportDataAsJson(data: PortfolioData): void {
  if (!isBrowser) return
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'portfolio-data.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Parse + validate an uploaded JSON file. Rejects if the file is not valid JSON
 * or does not match the PortfolioData schema, so callers never apply bad data.
 */
export function importDataFromJson(file: File): Promise<PortfolioData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.onload = (event) => {
      try {
        const json = JSON.parse(String(event.target?.result ?? ''))
        const parsed = portfolioDataSchema.safeParse(json)
        if (!parsed.success) {
          reject(new Error('Fichier JSON invalide : structure non reconnue'))
          return
        }
        resolve(parsed.data)
      } catch {
        reject(new Error('Fichier JSON invalide'))
      }
    }
    reader.readAsText(file)
  })
}
