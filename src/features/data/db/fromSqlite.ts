import { z } from 'zod'
import { messageSchema, portfolioDataSchema } from '#/features/data/schemas'
import type { Message, PortfolioData } from '#/features/data/types'

// Converts raw rows read from the legacy Railway SQLite database (Drizzle
// sqlite-core storage: snake_case columns, JSON as text, booleans as 0/1,
// timestamps as Unix seconds) into the app's shapes. Pure and I/O-free so it is
// unit-tested; only `scripts/transfer-from-sqlite.ts` uses it. The legacy file
// is untrusted input, so the result is Zod-validated before it is returned.

/** One row as returned by `node:sqlite` (`StatementSync#all`). */
export type SqliteRow = Record<string, unknown>

export interface SqliteTables {
  personalInfo: SqliteRow[]
  skills: SqliteRow[]
  projects: SqliteRow[]
  experiences: SqliteRow[]
  education: SqliteRow[]
  settings: SqliteRow[]
  messages: SqliteRow[]
}

const MS_PER_SECOND = 1000

function wrongType(column: string, expected: string, value: unknown): Error {
  return new Error(
    `Legacy column "${column}": expected ${expected}, got ${typeof value}`,
  )
}

function str(row: SqliteRow, column: string): string {
  const value = row[column]
  if (typeof value !== 'string') throw wrongType(column, 'text', value)
  return value
}

function optStr(row: SqliteRow, column: string): string | undefined {
  return row[column] == null ? undefined : str(row, column)
}

function num(row: SqliteRow, column: string): number {
  const value = row[column]
  if (typeof value === 'bigint') return Number(value)
  if (typeof value !== 'number') throw wrongType(column, 'integer', value)
  return value
}

function bool(row: SqliteRow, column: string): boolean {
  return num(row, column) !== 0
}

// JSON shape is checked by the Zod parse at the end, hence `unknown` here.
function json(row: SqliteRow, column: string): unknown {
  return JSON.parse(str(row, column))
}

function optJson(row: SqliteRow, column: string): unknown {
  return row[column] == null ? undefined : json(row, column)
}

function isoFromSeconds(row: SqliteRow, column: string): string {
  return new Date(num(row, column) * MS_PER_SECOND).toISOString()
}

const byColumn =
  (column: string) =>
  (a: SqliteRow, b: SqliteRow): number =>
    num(a, column) - num(b, column)

export function convertSqliteTables(tables: SqliteTables): {
  data: PortfolioData
  messages: Message[]
} {
  const pi = tables.personalInfo.at(0)
  if (!pi) {
    throw new Error(
      'Legacy database has no personal_info row — nothing to transfer',
    )
  }
  const stng = tables.settings.at(0)

  const data = {
    personalInfo: {
      name: str(pi, 'name'),
      title: str(pi, 'title'),
      taglines: json(pi, 'taglines'),
      bio: str(pi, 'bio'),
      location: str(pi, 'location'),
      email: str(pi, 'email'),
      phone: str(pi, 'phone'),
      github: str(pi, 'github'),
      linkedin: str(pi, 'linkedin'),
      cvUrl: str(pi, 'cv_url'),
      profilePhoto: str(pi, 'profile_photo'),
      available: bool(pi, 'available'),
      stats: json(pi, 'stats'),
      titleEn: optStr(pi, 'title_en'),
      taglinesEn: optJson(pi, 'taglines_en'),
      bioEn: optStr(pi, 'bio_en'),
      locationEn: optStr(pi, 'location_en'),
      statsEn: optJson(pi, 'stats_en'),
    },
    skills: [...tables.skills].sort(byColumn('position')).map((row) => ({
      id: str(row, 'id'),
      name: str(row, 'name'),
      category: str(row, 'category'),
      level: optStr(row, 'level'),
    })),
    projects: [...tables.projects].sort(byColumn('order')).map((row) => ({
      id: str(row, 'id'),
      title: str(row, 'title'),
      description: str(row, 'description'),
      stack: json(row, 'stack'),
      type: str(row, 'type'),
      year: str(row, 'year'),
      liveUrl: optStr(row, 'live_url'),
      githubUrl: optStr(row, 'github_url'),
      highlights: json(row, 'highlights'),
      featured: bool(row, 'featured'),
      order: num(row, 'order'),
      titleEn: optStr(row, 'title_en'),
      descriptionEn: optStr(row, 'description_en'),
      highlightsEn: optJson(row, 'highlights_en'),
    })),
    experiences: [...tables.experiences]
      .sort(byColumn('order'))
      .map((row) => ({
        id: str(row, 'id'),
        role: str(row, 'role'),
        company: str(row, 'company'),
        period: str(row, 'period'),
        stack: json(row, 'stack'),
        bullets: json(row, 'bullets'),
        order: num(row, 'order'),
        roleEn: optStr(row, 'role_en'),
        bulletsEn: optJson(row, 'bullets_en'),
      })),
    education: [...tables.education]
      .sort(byColumn('position'))
      .map((row) => ({
        id: str(row, 'id'),
        degree: str(row, 'degree'),
        school: str(row, 'school'),
        period: str(row, 'period'),
        description: optStr(row, 'description'),
        degreeEn: optStr(row, 'degree_en'),
        descriptionEn: optStr(row, 'description_en'),
      })),
    // Same fallback as the read layer (server/portfolio-data.ts).
    lastUpdated: stng
      ? isoFromSeconds(stng, 'last_updated')
      : new Date(0).toISOString(),
  }

  const messages = tables.messages.map((row) => ({
    id: str(row, 'id'),
    name: str(row, 'name'),
    email: str(row, 'email'),
    message: str(row, 'message'),
    read: bool(row, 'read'),
    createdAt: isoFromSeconds(row, 'created_at'),
  }))

  return {
    data: portfolioDataSchema.parse(data),
    messages: z.array(messageSchema).parse(messages),
  }
}
