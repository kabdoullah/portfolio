import { portfolioDataSchema } from '#/features/data/schemas'
import type { PortfolioData } from '#/features/data/types'

// Client-side JSON export/import helpers. Persistence itself now lives in the
// database (see `server/*` Server Functions); these only handle the
// browser-side file download/upload for the admin's backup/restore feature.

const isBrowser = typeof window !== 'undefined'

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
 * The Server Function validates again before writing to the DB.
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
