import { createServerFn } from '@tanstack/react-start'
import { asc } from 'drizzle-orm'
import { db } from '#/features/data/db/client'
import {
  educationEntries,
  experiences,
  projects,
  skills,
} from '#/features/data/db/schema'
import { getDefaultData } from '#/features/data/defaults'
import type {
  Education,
  Experience,
  PortfolioData,
  Project,
  Skill,
} from '#/features/data/types'

/** SQLite reads nullable columns back as `null`; the TS types use `undefined`. */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value ?? undefined
}

/**
 * Aggregate the whole `PortfolioData` for initial load — replaces the old
 * `loadPortfolioData()` (localStorage read). Returns exactly the shape declared
 * in `types.ts`. If the DB has not been seeded yet, falls back to defaults so
 * the site still renders (mirrors the old first-run behaviour).
 */
export const getPortfolioData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PortfolioData> => {
    const [pi, skillRows, projectRows, experienceRows, educationRows, stng] =
      await Promise.all([
        db.query.personalInfo.findFirst(),
        db.query.skills.findMany({ orderBy: [asc(skills.position)] }),
        db.query.projects.findMany({ orderBy: [asc(projects.order)] }),
        db.query.experiences.findMany({ orderBy: [asc(experiences.order)] }),
        db.query.educationEntries.findMany({
          orderBy: [asc(educationEntries.position)],
        }),
        db.query.settings.findFirst(),
      ])

    if (!pi) return getDefaultData()

    const skillList: Skill[] = skillRows.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      level: nullToUndefined(s.level),
    }))

    const projectList: Project[] = projectRows.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      stack: p.stack,
      type: p.type,
      year: p.year,
      liveUrl: nullToUndefined(p.liveUrl),
      githubUrl: nullToUndefined(p.githubUrl),
      highlights: p.highlights,
      featured: p.featured,
      order: p.order,
    }))

    const experienceList: Experience[] = experienceRows.map((e) => ({
      id: e.id,
      role: e.role,
      company: e.company,
      period: e.period,
      stack: e.stack,
      bullets: e.bullets,
      order: e.order,
    }))

    const educationList: Education[] = educationRows.map((e) => ({
      id: e.id,
      degree: e.degree,
      school: e.school,
      period: e.period,
      description: nullToUndefined(e.description),
    }))

    return {
      personalInfo: {
        name: pi.name,
        title: pi.title,
        taglines: pi.taglines,
        bio: pi.bio,
        location: pi.location,
        email: pi.email,
        phone: pi.phone,
        github: pi.github,
        linkedin: pi.linkedin,
        cvUrl: pi.cvUrl,
        profilePhoto: pi.profilePhoto,
        available: pi.available,
        stats: pi.stats,
      },
      skills: skillList,
      projects: projectList,
      experiences: experienceList,
      education: educationList,
      lastUpdated: (stng?.lastUpdated ?? new Date(0)).toISOString(),
    }
  },
)
