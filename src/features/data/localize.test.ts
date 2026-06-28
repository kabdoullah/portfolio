import { describe, expect, it } from 'vitest'
import { localizePortfolioData } from '#/features/data/localize'
import type { PortfolioData } from '#/features/data/types'

const base: PortfolioData = {
  personalInfo: {
    name: 'Jane Doe',
    title: 'Développeuse',
    taglines: ['Bonjour'],
    bio: 'Bio FR',
    location: 'Abidjan',
    email: '',
    phone: '',
    github: '',
    linkedin: '',
    cvUrl: '',
    profilePhoto: '',
    available: true,
    stats: [
      { label: 'Années', value: '5' },
      { label: 'Projets', value: '20' },
    ],
    titleEn: 'Developer',
    taglinesEn: ['Hello'],
    bioEn: 'Bio EN',
    // locationEn intentionally unset → falls back to French
    statsEn: [{ label: 'Years', value: '5' }], // only first label translated
  },
  skills: [{ id: 's1', name: 'React', category: 'Frontend' }],
  projects: [
    {
      id: 'p1',
      title: 'Projet',
      description: 'Desc FR',
      stack: ['React'],
      type: 'Personnel',
      year: '2024',
      highlights: ['Point FR'],
      featured: false,
      order: 0,
      titleEn: 'Project',
      // descriptionEn unset → fallback
      highlightsEn: ['Point EN'],
    },
  ],
  experiences: [
    {
      id: 'e1',
      role: 'Dév',
      company: 'ACME',
      period: '2024',
      stack: [],
      bullets: ['Fait FR'],
      order: 0,
      roleEn: 'Developer',
      // bulletsEn unset → fallback
    },
  ],
  education: [
    {
      id: 'ed1',
      degree: 'Master',
      school: 'INP-HB',
      period: '2020',
      description: 'Desc FR',
      degreeEn: 'MSc',
      descriptionEn: 'Desc EN',
    },
  ],
  lastUpdated: '2024-01-01T00:00:00.000Z',
}

describe('localizePortfolioData', () => {
  it('returns data unchanged for the base locale (fr)', () => {
    expect(localizePortfolioData(base, 'fr')).toBe(base)
  })

  it('swaps translated fields to English on en', () => {
    const en = localizePortfolioData(base, 'en')
    expect(en.personalInfo.title).toBe('Developer')
    expect(en.personalInfo.taglines).toEqual(['Hello'])
    expect(en.personalInfo.bio).toBe('Bio EN')
    expect(en.projects[0].title).toBe('Project')
    expect(en.projects[0].highlights).toEqual(['Point EN'])
    expect(en.experiences[0].role).toBe('Developer')
    expect(en.education[0].degree).toBe('MSc')
    expect(en.education[0].description).toBe('Desc EN')
  })

  it('falls back to French when an English value is missing', () => {
    const en = localizePortfolioData(base, 'en')
    expect(en.personalInfo.location).toBe('Abidjan') // locationEn unset
    expect(en.projects[0].description).toBe('Desc FR') // descriptionEn unset
    expect(en.experiences[0].bullets).toEqual(['Fait FR']) // bulletsEn unset
  })

  it('falls back per-stat-label (a partial statsEn must not blank labels)', () => {
    const en = localizePortfolioData(base, 'en')
    expect(en.personalInfo.stats[0].label).toBe('Years') // translated
    expect(en.personalInfo.stats[1].label).toBe('Projets') // no En → fallback
    expect(en.personalInfo.stats.map((s) => s.value)).toEqual(['5', '20'])
  })

  it('treats empty-string / empty-array English as missing', () => {
    const withEmpty = localizePortfolioData(
      {
        ...base,
        projects: [
          { ...base.projects[0], titleEn: '   ', highlightsEn: [] },
        ],
      },
      'en',
    )
    expect(withEmpty.projects[0].title).toBe('Projet') // blank En → fallback
    expect(withEmpty.projects[0].highlights).toEqual(['Point FR'])
  })
})
