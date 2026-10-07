import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import type {
  ProjectType,
  SkillCategory,
  SkillLevel,
  Stat,
} from '#/features/data/types'

// Drizzle is the DB source of truth. It must stay aligned with `types.ts`
// (TS contract) and `schemas.ts` (Zod). When a field changes, touch all three:
//   1. schema.ts (here) → `pnpm db:generate`   2. types.ts   3. schemas.ts
//
// Note on null vs undefined: Postgres nullable columns read back as `null`, but
// the TS interfaces use optional (`undefined`). The read layer
// (server/portfolio-data.ts) normalises `null` → `undefined` so the object
// returned to the app matches `types.ts` exactly.

/** Singleton: always a single row with id = SINGLETON_ID. */
export const personalInfo = pgTable('personal_info', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  taglines: jsonb('taglines').$type<string[]>().notNull(),
  bio: text('bio').notNull(),
  location: text('location').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  github: text('github').notNull(),
  linkedin: text('linkedin').notNull(),
  cvUrl: text('cv_url').notNull().default(''),
  profilePhoto: text('profile_photo').notNull(),
  available: boolean('available').notNull(),
  stats: jsonb('stats').$type<Stat[]>().notNull(),
  // Optional English translations (nullable → undefined in TS). When unset the
  // public site falls back to the French value. Admin/data stay French-first.
  titleEn: text('title_en'),
  taglinesEn: jsonb('taglines_en').$type<string[]>(),
  bioEn: text('bio_en'),
  locationEn: text('location_en'),
  statsEn: jsonb('stats_en').$type<Stat[]>(),
})

export const skills = pgTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').$type<SkillCategory>().notNull(),
  level: text('level').$type<SkillLevel>(),
  // Persistence-only: stable display order (skills have no `order` in the TS
  // type and no admin reorder; this keeps insertion order deterministic).
  position: integer('position').notNull().default(0),
})

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  stack: jsonb('stack').$type<string[]>().notNull(),
  type: text('type').$type<ProjectType>().notNull(),
  year: text('year').notNull(),
  liveUrl: text('live_url'),
  githubUrl: text('github_url'),
  image: text('image'),
  highlights: jsonb('highlights').$type<string[]>().notNull(),
  featured: boolean('featured').notNull(),
  // Maps to `Project.order` — drives dnd-kit reorder persistence.
  order: integer('order').notNull().default(0),
  // Optional English translations; fall back to French when unset.
  titleEn: text('title_en'),
  descriptionEn: text('description_en'),
  highlightsEn: jsonb('highlights_en').$type<string[]>(),
})

export const experiences = pgTable('experiences', {
  id: text('id').primaryKey(),
  role: text('role').notNull(),
  company: text('company').notNull(),
  period: text('period').notNull(),
  stack: jsonb('stack').$type<string[]>().notNull(),
  bullets: jsonb('bullets').$type<string[]>().notNull(),
  // Maps to `Experience.order`.
  order: integer('order').notNull().default(0),
  // Optional English translations; fall back to French when unset.
  roleEn: text('role_en'),
  bulletsEn: jsonb('bullets_en').$type<string[]>(),
})

export const educationEntries = pgTable('education_entries', {
  id: text('id').primaryKey(),
  degree: text('degree').notNull(),
  school: text('school').notNull(),
  period: text('period').notNull(),
  description: text('description'),
  // Persistence-only stable order (no `order` in TS type, no admin reorder).
  position: integer('position').notNull().default(0),
  // Optional English translations; fall back to French when unset.
  degreeEn: text('degree_en'),
  descriptionEn: text('description_en'),
})

/** Singleton: always a single row with id = SINGLETON_ID. Holds `lastUpdated`. */
export const settings = pgTable('settings', {
  id: integer('id').primaryKey(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull(),
})

// Contact-form submissions. Standalone — NOT part of `PortfolioData` (it is
// inbound user data, not editable site content), so it has no place in the
// portfolio seed/export/reset and never bumps `settings.lastUpdated`.
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})
