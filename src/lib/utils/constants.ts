import { m } from '#/paraglide/messages'
import type { SkillCategory } from '#/features/data/types'

/** In-page section anchors, also used by useActiveSection for scroll-spy. */
export const SECTION_IDS = {
  hero: 'accueil',
  about: 'a-propos',
  skills: 'competences',
  projects: 'projets',
  experience: 'experience',
  education: 'formation',
  contact: 'contact',
} as const

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS]

export interface NavItem {
  id: SectionId
  /** Locale-aware label getter — call at render so it reads the active locale. */
  label: () => string
}

export const NAV_ITEMS: NavItem[] = [
  { id: SECTION_IDS.about, label: m.nav_about },
  { id: SECTION_IDS.skills, label: m.nav_skills },
  { id: SECTION_IDS.projects, label: m.nav_projects },
  { id: SECTION_IDS.experience, label: m.nav_experience },
  { id: SECTION_IDS.education, label: m.nav_education },
  { id: SECTION_IDS.contact, label: m.nav_contact },
]

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Backend',
  'Mobile',
  'Frontend',
  'DevOps',
  'IA/Data',
]

export const PROJECT_FILTERS = ['Tous', 'Freelance', 'Entreprise', 'Personnel'] as const
export type ProjectFilter = (typeof PROJECT_FILTERS)[number]

/** Fraction of an element visible before scroll-reveal triggers. */
export const SCROLL_REVEAL_AMOUNT = 0.15

/** Typing-effect timings (ms). */
export const TYPING = {
  type: 90,
  delete: 45,
  holdFull: 1600,
  holdEmpty: 400,
} as const

export const ADMIN_AUTH_KEY = 'admin_auth'
