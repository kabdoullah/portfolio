export type SkillCategory =
  | 'Backend'
  | 'Mobile'
  | 'Frontend'
  | 'DevOps'
  | 'IA/Data'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type ProjectType = 'Freelance' | 'Entreprise' | 'Personnel'

export interface Stat {
  label: string
  value: string
}

export interface PersonalInfo {
  name: string
  title: string
  taglines: string[]
  bio: string
  location: string
  email: string
  phone: string
  github: string
  linkedin: string
  /** URL to a downloadable CV/résumé (external link or path under /public); '' when unset */
  cvUrl: string
  /** base64 data URL or path under /public */
  profilePhoto: string
  available: boolean
  stats: Stat[]
  // Optional English translations. When unset/empty the public site falls back
  // to the French field above. Names/contact/URLs are not translated.
  titleEn?: string
  taglinesEn?: string[]
  bioEn?: string
  locationEn?: string
  statsEn?: Stat[]
}

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  level?: SkillLevel
}

export interface Project {
  id: string
  title: string
  description: string
  stack: string[]
  type: ProjectType
  year: string
  liveUrl?: string
  githubUrl?: string
  highlights: string[]
  featured: boolean
  order: number
  // Optional English translations; fall back to French when unset. `stack`,
  // `type`, `year` and URLs are not translated.
  titleEn?: string
  descriptionEn?: string
  highlightsEn?: string[]
}

export interface Experience {
  id: string
  role: string
  company: string
  period: string
  stack: string[]
  bullets: string[]
  order: number
  // Optional English translations; fall back to French when unset. `company`
  // (proper noun), `period` and `stack` are not translated.
  roleEn?: string
  bulletsEn?: string[]
}

export interface Education {
  id: string
  degree: string
  school: string
  period: string
  description?: string
  // Optional English translations; fall back to French when unset. `school`
  // (proper noun) and `period` are not translated.
  degreeEn?: string
  descriptionEn?: string
}

// Contact-form submission. Standalone entity, NOT part of `PortfolioData`.
export interface Message {
  id: string
  name: string
  email: string
  message: string
  read: boolean
  /** ISO timestamp of submission */
  createdAt: string
}

export interface PortfolioData {
  personalInfo: PersonalInfo
  skills: Skill[]
  projects: Project[]
  experiences: Experience[]
  education: Education[]
  /** ISO timestamp set on every save */
  lastUpdated: string
}
