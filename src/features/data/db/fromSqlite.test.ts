import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { convertSqliteTables } from '#/features/data/db/fromSqlite'
import type { SqliteTables } from '#/features/data/db/fromSqlite'

// Raw rows exactly as `node:sqlite` returns them from the legacy Drizzle
// sqlite-core tables: snake_case columns, JSON as text, booleans as 0/1,
// timestamps as Unix SECONDS, absent values as NULL.
const LAST_UPDATED_SECONDS = 1_751_000_000 // 2025-06-27T04:53:20.000Z
const CREATED_AT_SECONDS = 1_750_000_000 // 2025-06-15T15:06:40.000Z

function legacyTables(): SqliteTables {
  return {
    personalInfo: [
      {
        id: 1,
        name: 'Jane Doe',
        title: 'Développeuse',
        taglines: '["Bonjour"]',
        bio: 'Bio FR',
        location: 'Abidjan',
        email: 'jane@example.com',
        phone: '',
        github: '',
        linkedin: '',
        cv_url: '',
        profile_photo: '',
        available: 1,
        stats: '[{"label":"Projets","value":"20"}]',
        title_en: 'Developer',
        taglines_en: null,
        bio_en: null,
        location_en: null,
        stats_en: null,
      },
    ],
    skills: [
      { id: 's2', name: 'Go', category: 'Backend', level: null, position: 1 },
      {
        id: 's1',
        name: 'React',
        category: 'Frontend',
        level: 'expert',
        position: 0,
      },
    ],
    projects: [
      {
        id: 'p2',
        title: 'Second',
        description: 'B',
        stack: '["Go"]',
        type: 'Personnel',
        year: '2024',
        live_url: null,
        github_url: 'https://github.com/x/y',
        highlights: '[]',
        featured: 0,
        order: 1,
        title_en: null,
        description_en: null,
        highlights_en: null,
      },
      {
        id: 'p1',
        title: 'Premier',
        description: 'A',
        stack: '["React","TS"]',
        type: 'Freelance',
        year: '2025',
        live_url: 'https://example.com',
        github_url: null,
        highlights: '["Rapide"]',
        featured: 1,
        order: 0,
        title_en: 'First',
        description_en: null,
        highlights_en: '["Fast"]',
      },
    ],
    experiences: [
      {
        id: 'e1',
        role: 'Dev',
        company: 'ACME',
        period: '2023 - 2025',
        stack: '["TS"]',
        bullets: '["Livré X"]',
        order: 0,
        role_en: null,
        bullets_en: '["Shipped X"]',
      },
    ],
    education: [
      {
        id: 'd1',
        degree: 'Master',
        school: 'UFHB',
        period: '2020',
        description: null,
        position: 0,
        degree_en: null,
        description_en: null,
      },
    ],
    settings: [{ id: 1, last_updated: LAST_UPDATED_SECONDS }],
    messages: [
      {
        id: 'm1',
        name: 'Bob',
        email: 'bob@example.com',
        message: 'Bonjour Jane !',
        read: 1,
        created_at: CREATED_AT_SECONDS,
      },
    ],
  }
}

describe('convertSqliteTables', () => {
  it('converts JSON text, 0/1 booleans, NULL and second timestamps', () => {
    const { data, messages } = convertSqliteTables(legacyTables())

    expect(data.personalInfo.taglines).toEqual(['Bonjour'])
    expect(data.personalInfo.stats).toEqual([{ label: 'Projets', value: '20' }])
    expect(data.personalInfo.available).toBe(true)
    expect(data.personalInfo.titleEn).toBe('Developer')
    expect(data.personalInfo.taglinesEn).toBeUndefined()
    expect(data.personalInfo.cvUrl).toBe('')
    expect(data.lastUpdated).toBe('2025-06-27T04:53:20.000Z')

    expect(messages).toEqual([
      {
        id: 'm1',
        name: 'Bob',
        email: 'bob@example.com',
        message: 'Bonjour Jane !',
        read: true,
        createdAt: '2025-06-15T15:06:40.000Z',
      },
    ])
  })

  it('orders projects/experiences by `order` and skills/education by `position`', () => {
    const { data } = convertSqliteTables(legacyTables())

    expect(data.projects.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(data.skills.map((s) => s.id)).toEqual(['s1', 's2'])
    expect(data.projects[0]).toMatchObject({
      featured: true,
      liveUrl: 'https://example.com',
      githubUrl: undefined,
      highlightsEn: ['Fast'],
      descriptionEn: undefined,
    })
    expect(data.skills[1].level).toBeUndefined()
    expect(data.education[0].description).toBeUndefined()
    expect(data.experiences[0].bulletsEn).toEqual(['Shipped X'])
  })

  it('accepts bigint integers (node:sqlite readBigInts mode)', () => {
    const tables = legacyTables()
    tables.settings = [{ id: 1n, last_updated: BigInt(LAST_UPDATED_SECONDS) }]
    tables.projects[0].order = 1n

    const { data } = convertSqliteTables(tables)

    expect(data.lastUpdated).toBe('2025-06-27T04:53:20.000Z')
    expect(data.projects.map((p) => p.order)).toEqual([0, 1])
  })

  it('falls back to the epoch when the settings row is missing', () => {
    const tables = legacyTables()
    tables.settings = []

    expect(convertSqliteTables(tables).data.lastUpdated).toBe(
      '1970-01-01T00:00:00.000Z',
    )
  })

  it('throws when there is no personal_info row', () => {
    const tables = legacyTables()
    tables.personalInfo = []

    expect(() => convertSqliteTables(tables)).toThrow(/personal_info/)
  })

  it('throws on a wrongly typed column, naming it', () => {
    const tables = legacyTables()
    tables.projects[0].title = 42

    expect(() => convertSqliteTables(tables)).toThrow(/title/)
  })

  it('rejects content that fails the Zod schema (nothing is returned)', () => {
    const tables = legacyTables()
    tables.personalInfo[0].taglines = '"not an array"'

    expect(() => convertSqliteTables(tables)).toThrow(ZodError)
  })
})
