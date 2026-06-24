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
  /** base64 data URL or path under /public */
  profilePhoto: string
  available: boolean
  stats: Stat[]
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
}

export interface Experience {
  id: string
  role: string
  company: string
  period: string
  stack: string[]
  bullets: string[]
  order: number
}

export interface Education {
  id: string
  degree: string
  school: string
  period: string
  description?: string
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
