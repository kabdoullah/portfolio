import { z } from 'zod'
import type {
  Education,
  Experience,
  Message,
  PersonalInfo,
  PortfolioData,
  Project,
  Skill,
} from '#/features/data/types'

// Zod schemas mirror the interfaces in lib/types. Keep them aligned: a change
// in one must be reflected in the other (enforced by the type-level checks below).

export const skillCategorySchema = z.enum([
  'Backend',
  'Mobile',
  'Frontend',
  'DevOps',
  'IA/Data',
])

export const skillLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
])

export const projectTypeSchema = z.enum(['Freelance', 'Entreprise', 'Personnel'])

export const statSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const personalInfoSchema = z.object({
  name: z.string().min(1),
  title: z.string(),
  taglines: z.array(z.string()),
  bio: z.string(),
  location: z.string(),
  email: z.email().or(z.literal('')),
  phone: z.string(),
  github: z.string(),
  linkedin: z.string(),
  // Downloadable CV: a valid URL or empty. Validated before any write.
  cvUrl: z.url().or(z.literal('')),
  profilePhoto: z.string(),
  available: z.boolean(),
  stats: z.array(statSchema),
})

export const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: skillCategorySchema,
  level: skillLevelSchema.optional(),
})

export const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  stack: z.array(z.string()),
  type: projectTypeSchema,
  year: z.string(),
  liveUrl: z.url().optional().or(z.literal('')),
  githubUrl: z.url().optional().or(z.literal('')),
  highlights: z.array(z.string()),
  featured: z.boolean(),
  order: z.number().int(),
})

export const experienceSchema = z.object({
  id: z.string(),
  role: z.string().min(1),
  company: z.string(),
  period: z.string(),
  stack: z.array(z.string()),
  bullets: z.array(z.string()),
  order: z.number().int(),
})

export const educationSchema = z.object({
  id: z.string(),
  // Edited in place and persisted on each keystroke, so an empty draft must
  // validate (the Save-on-blur pattern of personalInfo doesn't apply here).
  degree: z.string(),
  school: z.string(),
  period: z.string(),
  description: z.string().optional(),
})

// Full Message shape (what the read layer returns). Kept aligned with the
// `Message` interface via the Equal check below.
export const messageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
})

// Public contact-form input — the only fields a visitor supplies. The server
// assigns id / read / createdAt. Validated before any DB write.
export const newMessageSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  message: z.string().min(10),
})

export const portfolioDataSchema = z.object({
  personalInfo: personalInfoSchema,
  skills: z.array(skillSchema),
  projects: z.array(projectSchema),
  experiences: z.array(experienceSchema),
  education: z.array(educationSchema),
  lastUpdated: z.string(),
})

// Compile-time guarantee that schema output stays in sync with the TS types.
// If a schema and its interface drift, `Equal` becomes `false`, and `Expect`
// rejects it (`false` does not extend `true`) — a TypeScript error at build time.
type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2
    ? true
    : false
type Expect<TValue extends true> = TValue

export type SchemaTypeChecks = [
  Expect<Equal<z.infer<typeof personalInfoSchema>, PersonalInfo>>,
  Expect<Equal<z.infer<typeof skillSchema>, Skill>>,
  Expect<Equal<z.infer<typeof projectSchema>, Project>>,
  Expect<Equal<z.infer<typeof experienceSchema>, Experience>>,
  Expect<Equal<z.infer<typeof educationSchema>, Education>>,
  Expect<Equal<z.infer<typeof messageSchema>, Message>>,
  Expect<Equal<z.infer<typeof portfolioDataSchema>, PortfolioData>>,
]
