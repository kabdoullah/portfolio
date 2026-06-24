import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type {
  ProjectType,
  SkillCategory,
  SkillLevel,
  Stat,
} from '#/features/data/types'

// Drizzle is the DB source of truth. It must stay aligned with `types.ts`
// (TS contract) and `schemas.ts` (Zod). When a field changes, touch all three:
//   1. schema.ts (here) → regenerate migration   2. types.ts   3. schemas.ts
//
// Note on null vs undefined: SQLite nullable columns read back as `null`, but
// the TS interfaces use optional (`undefined`). The read layer
// (server/portfolio-data.ts) normalises `null` → `undefined` so the object
// returned to the app matches `types.ts` exactly.

/** Singleton: always a single row with id = 1. */
export const personalInfo = sqliteTable('personal_info', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  title: text('title').notNull(),
  taglines: text('taglines', { mode: 'json' }).$type<string[]>().notNull(),
  bio: text('bio').notNull(),
  location: text('location').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  github: text('github').notNull(),
  linkedin: text('linkedin').notNull(),
  profilePhoto: text('profile_photo').notNull(),
  available: integer('available', { mode: 'boolean' }).notNull(),
  stats: text('stats', { mode: 'json' }).$type<Stat[]>().notNull(),
})

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').$type<SkillCategory>().notNull(),
  level: text('level').$type<SkillLevel>(),
  // Persistence-only: stable display order (skills have no `order` in the TS
  // type and no admin reorder; this keeps insertion order deterministic).
  position: integer('position').notNull().default(0),
})

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  stack: text('stack', { mode: 'json' }).$type<string[]>().notNull(),
  type: text('type').$type<ProjectType>().notNull(),
  year: text('year').notNull(),
  liveUrl: text('live_url'),
  githubUrl: text('github_url'),
  highlights: text('highlights', { mode: 'json' }).$type<string[]>().notNull(),
  featured: integer('featured', { mode: 'boolean' }).notNull(),
  // Maps to `Project.order` — drives dnd-kit reorder persistence.
  order: integer('order').notNull().default(0),
})

export const experiences = sqliteTable('experiences', {
  id: text('id').primaryKey(),
  role: text('role').notNull(),
  company: text('company').notNull(),
  period: text('period').notNull(),
  stack: text('stack', { mode: 'json' }).$type<string[]>().notNull(),
  bullets: text('bullets', { mode: 'json' }).$type<string[]>().notNull(),
  // Maps to `Experience.order`.
  order: integer('order').notNull().default(0),
})

export const educationEntries = sqliteTable('education_entries', {
  id: text('id').primaryKey(),
  degree: text('degree').notNull(),
  school: text('school').notNull(),
  period: text('period').notNull(),
  description: text('description'),
  // Persistence-only stable order (no `order` in TS type, no admin reorder).
  position: integer('position').notNull().default(0),
})

/** Singleton: always a single row with id = 1. Holds `lastUpdated`. */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
})

// Contact-form submissions. Standalone — NOT part of `PortfolioData` (it is
// inbound user data, not editable site content), so it has no place in the
// portfolio seed/export/reset and never bumps `settings.lastUpdated`.
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
