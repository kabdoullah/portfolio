import type { Locale } from '#/paraglide/runtime'
import type { PortfolioData } from '#/features/data/types'

// Resolve French-first content against the active locale: when the locale is
// `en` and an English value is present (non-empty), use it; otherwise fall back
// to the French value. Empty string / empty array count as "no translation".
const text = (fr: string, en: string | undefined): string =>
  en && en.trim() ? en : fr

const list = (fr: string[], en: string[] | undefined): string[] =>
  en && en.length ? en : fr

/**
 * Returns `PortfolioData` with translatable text fields resolved to the active
 * locale. The shape is unchanged, so public components keep reading `project.title`
 * etc. and transparently get the English value on `/en/` (French fallback when a
 * translation is missing). For `fr` the data is returned as-is. Admin reads the
 * raw data (via `usePortfolioData`) so it can edit both languages.
 */
export function localizePortfolioData(
  data: PortfolioData,
  locale: Locale,
): PortfolioData {
  if (locale !== 'en') return data

  const pi = data.personalInfo
  return {
    ...data,
    personalInfo: {
      ...pi,
      title: text(pi.title, pi.titleEn),
      taglines: list(pi.taglines, pi.taglinesEn),
      bio: text(pi.bio, pi.bioEn),
      location: text(pi.location, pi.locationEn),
      // Per-stat label fallback (the numeric `value` is locale-neutral): an
      // all-empty statsEn array must not blank out the French labels.
      stats: pi.stats.map((s, i) => ({
        value: s.value,
        label: text(s.label, pi.statsEn?.[i]?.label),
      })),
    },
    projects: data.projects.map((p) => ({
      ...p,
      title: text(p.title, p.titleEn),
      description: text(p.description, p.descriptionEn),
      highlights: list(p.highlights, p.highlightsEn),
    })),
    experiences: data.experiences.map((e) => ({
      ...e,
      role: text(e.role, e.roleEn),
      bullets: list(e.bullets, e.bulletsEn),
    })),
    education: data.education.map((e) => ({
      ...e,
      degree: text(e.degree, e.degreeEn),
      description:
        e.description !== undefined
          ? text(e.description, e.descriptionEn)
          : e.descriptionEn,
    })),
  }
}
