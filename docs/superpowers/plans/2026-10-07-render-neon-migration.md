# Render + Neon Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the portfolio from Railway + SQLite/libsql to Render (native Node runtime) + Neon Postgres, carrying over all production content and contact messages.

**Architecture:** Only the persistence layer changes. Drizzle switches from `sqlite-core`/libsql to `pg-core`/postgres.js; every Server Function, `PortfolioData`, the React data flow and the UI stay untouched. A one-off script converts the legacy SQLite file (read with `node:sqlite`) into `PortfolioData` + `Message[]`, validates it with the existing Zod schemas and writes it through the existing `seedDatabase()`.

**Tech Stack:** TanStack Start, Drizzle ORM 0.45 + drizzle-kit 0.31, `postgres` (postgres.js), Neon, Render Blueprint, Vitest, Zod v4, Node 22 (`node:sqlite`).

**Spec:** `docs/superpowers/specs/2026-10-07-render-neon-migration-design.md`

## Global Constraints

- Package manager **pnpm 11.1.2**; imports use the `#/` alias; no barrel files; no `any` (TS strict).
- `DATABASE_URL` is **required** everywhere (dev = Neon `dev` branch, prod = Neon `main`), direct (unpooled) Neon URL. `DATABASE_AUTH_TOKEN` disappears.
- `db/client.ts` stays server-only — only `src/features/data/server/*`, `db/seed.ts` and `scripts/*` import it.
- No change to `types.ts`, `schemas.ts`, Server Function behaviour, or UI.
- No magic numbers: named constants (`db/constants.ts`); comments explain *why*.
- Render: `runtime: node`, `plan: free`, build `npx pnpm@11.1.2 install --frozen-lockfile && npx pnpm@11.1.2 build`, start `npm run start`. Keep `Dockerfile` + `.dockerignore` until the first native deploy is verified.
- Railway is not touched until the Render deploy is verified (rollback = keep Railway).
- Work on branch `feat/render-neon` (not `main`). Commit only with the user's go-ahead.

## Review Focus

1. **Neon connection string with `&channel_binding=require`** (Neon's dashboard default) — postgres.js may forward unknown query params as startup parameters and fail to connect. Expected: the app connects with the URL as copied, or the docs say exactly what to strip. → Task 2, Step 9.
2. **JSON columns double-encoded** (an array stored as a JSON *string* in `jsonb`) — the site would render `taglines` as one string. Expected: `jsonb_typeof(...) = 'array'`. → Task 2, Step 10.
3. **Legacy rows with `NULL` optional columns, `bigint` integers, and Unix-second timestamps** — expected: `undefined`, numbers, correct ISO dates (not 1970). → Task 1 tests.
4. **Re-running the transfer against a database that already has content** — expected: abort without `--force`; with `--force` content is replaced and existing messages are not duplicated. → Task 3, Steps 4–6.
5. **`DATABASE_URL` missing** (forgotten env var on Render or locally) — expected: an explicit error naming the variable, not a cryptic connection error. → Task 2, Step 8.

---

## File Structure

| File | Action | Responsibility |
| --- | --- | --- |
| `src/features/data/db/fromSqlite.ts` | Create | Pure: legacy SQLite rows → validated `PortfolioData` + `Message[]` |
| `src/features/data/db/fromSqlite.test.ts` | Create | Unit tests for the conversion |
| `src/features/data/db/schema.ts` | Rewrite | Drizzle `pg-core` schema |
| `src/features/data/db/client.ts` | Rewrite | postgres.js client + Drizzle instance, requires `DATABASE_URL` |
| `src/features/data/db/constants.ts` | Modify | Add `DB_IDLE_TIMEOUT_SECONDS` |
| `drizzle.config.ts` | Rewrite | `postgresql` dialect, loads `.env.local` in dev |
| `drizzle/` | Replace | One Postgres baseline migration |
| `scripts/migrate.ts` | Modify | postgres-js migrator, close the client |
| `scripts/seed.ts` | Modify | Doc comment only |
| `scripts/transfer-from-sqlite.ts` | Create | One-off SQLite → Neon copy |
| `src/features/data/server/last-updated.ts`, `server/portfolio-data.ts` | Modify | Comments only (no more SQLite/libsql wording) |
| `package.json` | Modify | deps (`postgres` in, `@libsql/client` out), scripts |
| `render.yaml` | Create | Render Blueprint |
| `railway.json` | Delete | — |
| `Dockerfile`, `vite.config.ts` | Modify | Comments only (Render instead of Railway) |
| `.env.local.example`, `DEPLOY.md`, `CLAUDE.md` | Rewrite/Modify | Docs |

---

### Task 1: Legacy SQLite → PortfolioData conversion (pure, tested) + legacy fixture

**Files:**
- Create: `src/features/data/db/fromSqlite.ts`
- Test: `src/features/data/db/fromSqlite.test.ts`
- Create (gitignored by `*.db`): `legacy-fixture.db` at the repo root

**Interfaces:**
- Consumes: `portfolioDataSchema`, `messageSchema` from `#/features/data/schemas`; `PortfolioData`, `Message` from `#/features/data/types`.
- Produces:
  ```ts
  export type SqliteRow = Record<string, unknown>
  export interface SqliteTables {
    personalInfo: SqliteRow[]; skills: SqliteRow[]; projects: SqliteRow[]
    experiences: SqliteRow[]; education: SqliteRow[]; settings: SqliteRow[]; messages: SqliteRow[]
  }
  export function convertSqliteTables(tables: SqliteTables): { data: PortfolioData; messages: Message[] }
  ```
  Throws `Error` on a missing `personal_info` row or a wrongly typed column, `ZodError` on invalid content.

- [ ] **Step 1: Create the branch**

```bash
git switch -c feat/render-neon
```

- [ ] **Step 2: Write the failing tests** — `src/features/data/db/fromSqlite.test.ts`

```ts
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
      { id: 's1', name: 'React', category: 'Frontend', level: 'expert', position: 0 },
    ],
    projects: [
      {
        id: 'p2', title: 'Second', description: 'B', stack: '["Go"]', type: 'Personnel',
        year: '2024', live_url: null, github_url: 'https://github.com/x/y',
        highlights: '[]', featured: 0, order: 1,
        title_en: null, description_en: null, highlights_en: null,
      },
      {
        id: 'p1', title: 'Premier', description: 'A', stack: '["React","TS"]', type: 'Freelance',
        year: '2025', live_url: 'https://example.com', github_url: null,
        highlights: '["Rapide"]', featured: 1, order: 0,
        title_en: 'First', description_en: null, highlights_en: '["Fast"]',
      },
    ],
    experiences: [
      {
        id: 'e1', role: 'Dev', company: 'ACME', period: '2023 - 2025', stack: '["TS"]',
        bullets: '["Livré X"]', order: 0, role_en: null, bullets_en: '["Shipped X"]',
      },
    ],
    education: [
      {
        id: 'd1', degree: 'Master', school: 'UFHB', period: '2020', description: null,
        position: 0, degree_en: null, description_en: null,
      },
    ],
    settings: [{ id: 1, last_updated: LAST_UPDATED_SECONDS }],
    messages: [
      {
        id: 'm1', name: 'Bob', email: 'bob@example.com', message: 'Bonjour Jane !',
        read: 1, created_at: CREATED_AT_SECONDS,
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
        id: 'm1', name: 'Bob', email: 'bob@example.com', message: 'Bonjour Jane !',
        read: true, createdAt: '2025-06-15T15:06:40.000Z',
      },
    ])
  })

  it('orders projects/experiences by `order` and skills/education by `position`', () => {
    const { data } = convertSqliteTables(legacyTables())

    expect(data.projects.map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(data.skills.map((s) => s.id)).toEqual(['s1', 's2'])
    expect(data.projects[0]).toMatchObject({
      featured: true, liveUrl: 'https://example.com', githubUrl: undefined,
      highlightsEn: ['Fast'], descriptionEn: undefined,
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

    expect(convertSqliteTables(tables).data.lastUpdated).toBe('1970-01-01T00:00:00.000Z')
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm exec vitest run src/features/data/db/fromSqlite.test.ts`
Expected: FAIL — cannot resolve `#/features/data/db/fromSqlite`.

- [ ] **Step 4: Implement** — `src/features/data/db/fromSqlite.ts`

```ts
import { z } from 'zod'
import { messageSchema, portfolioDataSchema } from '#/features/data/schemas'
import type { Message, PortfolioData } from '#/features/data/types'

// Converts raw rows read from the legacy Railway SQLite database (Drizzle
// sqlite-core storage: snake_case columns, JSON as text, booleans as 0/1,
// timestamps as Unix seconds) into the app's shapes. Pure and I/O-free so it is
// unit-tested; only `scripts/transfer-from-sqlite.ts` uses it. The legacy file
// is untrusted input, so the result is Zod-validated before it is returned.

/** One row as returned by `node:sqlite` (`StatementSync#all`). */
export type SqliteRow = Record<string, unknown>

export interface SqliteTables {
  personalInfo: SqliteRow[]
  skills: SqliteRow[]
  projects: SqliteRow[]
  experiences: SqliteRow[]
  education: SqliteRow[]
  settings: SqliteRow[]
  messages: SqliteRow[]
}

const MS_PER_SECOND = 1000

function wrongType(column: string, expected: string, value: unknown): Error {
  return new Error(
    `Legacy column "${column}": expected ${expected}, got ${typeof value}`,
  )
}

function str(row: SqliteRow, column: string): string {
  const value = row[column]
  if (typeof value !== 'string') throw wrongType(column, 'text', value)
  return value
}

function optStr(row: SqliteRow, column: string): string | undefined {
  return row[column] == null ? undefined : str(row, column)
}

function num(row: SqliteRow, column: string): number {
  const value = row[column]
  if (typeof value === 'bigint') return Number(value)
  if (typeof value !== 'number') throw wrongType(column, 'integer', value)
  return value
}

function bool(row: SqliteRow, column: string): boolean {
  return num(row, column) !== 0
}

// JSON shape is checked by the Zod parse at the end, hence `unknown` here.
function json(row: SqliteRow, column: string): unknown {
  return JSON.parse(str(row, column))
}

function optJson(row: SqliteRow, column: string): unknown {
  return row[column] == null ? undefined : json(row, column)
}

function isoFromSeconds(row: SqliteRow, column: string): string {
  return new Date(num(row, column) * MS_PER_SECOND).toISOString()
}

const byColumn =
  (column: string) =>
  (a: SqliteRow, b: SqliteRow): number =>
    num(a, column) - num(b, column)

export function convertSqliteTables(tables: SqliteTables): {
  data: PortfolioData
  messages: Message[]
} {
  const [pi] = tables.personalInfo
  if (!pi) {
    throw new Error('Legacy database has no personal_info row — nothing to transfer')
  }
  const [stng] = tables.settings

  const data = {
    personalInfo: {
      name: str(pi, 'name'),
      title: str(pi, 'title'),
      taglines: json(pi, 'taglines'),
      bio: str(pi, 'bio'),
      location: str(pi, 'location'),
      email: str(pi, 'email'),
      phone: str(pi, 'phone'),
      github: str(pi, 'github'),
      linkedin: str(pi, 'linkedin'),
      cvUrl: str(pi, 'cv_url'),
      profilePhoto: str(pi, 'profile_photo'),
      available: bool(pi, 'available'),
      stats: json(pi, 'stats'),
      titleEn: optStr(pi, 'title_en'),
      taglinesEn: optJson(pi, 'taglines_en'),
      bioEn: optStr(pi, 'bio_en'),
      locationEn: optStr(pi, 'location_en'),
      statsEn: optJson(pi, 'stats_en'),
    },
    skills: [...tables.skills].sort(byColumn('position')).map((row) => ({
      id: str(row, 'id'),
      name: str(row, 'name'),
      category: str(row, 'category'),
      level: optStr(row, 'level'),
    })),
    projects: [...tables.projects].sort(byColumn('order')).map((row) => ({
      id: str(row, 'id'),
      title: str(row, 'title'),
      description: str(row, 'description'),
      stack: json(row, 'stack'),
      type: str(row, 'type'),
      year: str(row, 'year'),
      liveUrl: optStr(row, 'live_url'),
      githubUrl: optStr(row, 'github_url'),
      highlights: json(row, 'highlights'),
      featured: bool(row, 'featured'),
      order: num(row, 'order'),
      titleEn: optStr(row, 'title_en'),
      descriptionEn: optStr(row, 'description_en'),
      highlightsEn: optJson(row, 'highlights_en'),
    })),
    experiences: [...tables.experiences].sort(byColumn('order')).map((row) => ({
      id: str(row, 'id'),
      role: str(row, 'role'),
      company: str(row, 'company'),
      period: str(row, 'period'),
      stack: json(row, 'stack'),
      bullets: json(row, 'bullets'),
      order: num(row, 'order'),
      roleEn: optStr(row, 'role_en'),
      bulletsEn: optJson(row, 'bullets_en'),
    })),
    education: [...tables.education].sort(byColumn('position')).map((row) => ({
      id: str(row, 'id'),
      degree: str(row, 'degree'),
      school: str(row, 'school'),
      period: str(row, 'period'),
      description: optStr(row, 'description'),
      degreeEn: optStr(row, 'degree_en'),
      descriptionEn: optStr(row, 'description_en'),
    })),
    // Same fallback as the read layer (server/portfolio-data.ts).
    lastUpdated: stng
      ? isoFromSeconds(stng, 'last_updated')
      : new Date(0).toISOString(),
  }

  const messages = tables.messages.map((row) => ({
    id: str(row, 'id'),
    name: str(row, 'name'),
    email: str(row, 'email'),
    message: str(row, 'message'),
    read: bool(row, 'read'),
    createdAt: isoFromSeconds(row, 'created_at'),
  }))

  return {
    data: portfolioDataSchema.parse(data),
    messages: z.array(messageSchema).parse(messages),
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec vitest run src/features/data/db/fromSqlite.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 6: Generate a real legacy SQLite fixture with the CURRENT (libsql) stack** — used by Task 3. Must run before Task 2 removes libsql.

```bash
DATABASE_URL="file:$(pwd)/legacy-fixture.db" pnpm db:setup
node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('legacy-fixture.db');
db.prepare('INSERT INTO messages (id, name, email, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)')
  .run('fixture-msg-1', 'Fixture', 'fixture@example.com', 'Message de test pour le transfert', 0, Math.floor(Date.now() / 1000));
console.log(db.prepare('SELECT count(*) AS n FROM projects').get(), db.prepare('SELECT count(*) AS n FROM messages').get());
"
```
Expected: `db:setup` prints `✓ Database seeded…`; the node line prints a non-zero project count and `{ n: 1 }` messages. `git status` must NOT list `legacy-fixture.db` (ignored by `*.db`).

- [ ] **Step 7: Lint + typecheck, then commit**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

```bash
git add src/features/data/db/fromSqlite.ts src/features/data/db/fromSqlite.test.ts
git commit -m "feat(data): pure legacy SQLite → PortfolioData conversion for the Neon transfer"
```

---

### Task 2: Switch Drizzle to Postgres (postgres.js + Neon)

**Files:**
- Rewrite: `src/features/data/db/schema.ts`, `src/features/data/db/client.ts`, `drizzle.config.ts`
- Modify: `src/features/data/db/constants.ts`, `scripts/migrate.ts`, `scripts/seed.ts`, `src/features/data/server/last-updated.ts:5-9`, `src/features/data/server/portfolio-data.ts:19`, `package.json`
- Replace: `drizzle/` (delete 0000–0003 + meta, generate a Postgres baseline)

**Interfaces:**
- Consumes: nothing new.
- Produces: `export const queryClient` (postgres.js `Sql`, used to close the pool) and `export const db` (unchanged name/role) from `#/features/data/db/client`; `DB_IDLE_TIMEOUT_SECONDS` from `#/features/data/db/constants`. Row types of every table stay identical (same TS types for every column), so all importers compile unchanged.

**Prerequisite:** the user has created a Neon project with a `dev` branch and put its **direct** connection string in `.env.local` as `DATABASE_URL=postgresql://…?sslmode=require`. Steps 1–7 do not need it; Steps 8–11 do. Ask for it before Step 8 if missing.

- [ ] **Step 1: Swap dependencies**

```bash
pnpm add postgres
pnpm remove @libsql/client
```
Expected: `package.json` lists `postgres`, no `@libsql/client`.

- [ ] **Step 2: Add the idle-timeout constant** — append to `src/features/data/db/constants.ts`

```ts

/**
 * Close idle pool connections well before Neon suspends its compute (after
 * 5 min of inactivity), so the next query opens a fresh connection instead of
 * failing on one the server already dropped.
 */
export const DB_IDLE_TIMEOUT_SECONDS = 60
```

- [ ] **Step 3: Rewrite `src/features/data/db/schema.ts`**

```ts
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
```

- [ ] **Step 4: Rewrite `src/features/data/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '#/features/data/db/schema'
import { DB_IDLE_TIMEOUT_SECONDS } from '#/features/data/db/constants'

// The ONE place that instantiates the DB connection. Everything else imports
// `db` from here — never a second client. Server-only: this file (and anything
// importing it) must only be reached through `src/features/data/server/*`,
// which TanStack Start strips from the client bundle, or from `scripts/*`.
// Never import it from a component.
//
// DATABASE_URL is the Neon *direct* (unpooled) connection string — the `dev`
// branch locally (.env.local), the `main` branch on Render. Required: failing
// loudly here beats a cryptic connection error on the first query.
const url = process.env.DATABASE_URL
if (!url) {
  throw new Error(
    'DATABASE_URL is not set — point it at a Neon Postgres database (see .env.local.example)',
  )
}

/** Raw postgres.js pool — exported only so scripts can close it (`queryClient.end()`). */
export const queryClient = postgres(url, { idle_timeout: DB_IDLE_TIMEOUT_SECONDS })

export const db = drizzle(queryClient, { schema })
```

- [ ] **Step 5: Rewrite `drizzle.config.ts`**

```ts
import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit does not read .env files: load the local one in dev. On Render the
// variables come from the environment and the file does not exist.
const LOCAL_ENV_FILE = '.env.local'
if (existsSync(LOCAL_ENV_FILE)) process.loadEnvFile(LOCAL_ENV_FILE)

export default defineConfig({
  schema: './src/features/data/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // `generate` needs no connection; `migrate`/`push` fail on an empty URL.
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
```

- [ ] **Step 6: Update scripts and comments**

`scripts/migrate.ts` — replace the import line and close the pool before exiting:

```ts
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db, queryClient } from '#/features/data/db/client'
import { seedDatabase } from '#/features/data/db/seed'

async function main() {
  await migrate(db, { migrationsFolder: 'drizzle' })

  const existing = await db.query.personalInfo.findFirst()
  if (existing) {
    console.log('✓ migrations applied — existing content preserved')
  } else {
    await seedDatabase()
    console.log('✓ migrations applied + seeded default content (first run)')
  }
  await queryClient.end()
  process.exit(0)
}
```
(keep the file's header comment and the existing `main().catch(...)` block unchanged.)

`scripts/seed.ts` — replace the last two lines of the header comment:

```ts
 * Uses DATABASE_URL (loaded from .env.local by the npm script), like the app.
```

`src/features/data/server/last-updated.ts` — in the header comment replace
`` `db/client` import (→ @libsql/client, Node built-ins) `` with `` `db/client` import (→ postgres.js, Node built-ins) ``.

`src/features/data/server/portfolio-data.ts:19` — replace
`/** SQLite reads nullable columns back as \`null\`; the TS types use \`undefined\`. */` with
`/** Postgres reads nullable columns back as \`null\`; the TS types use \`undefined\`. */`.

`package.json` scripts — tsx/node scripts load `.env.local` themselves (only the Vite dev server does it automatically, via TanStack Start's load-env plugin):

```json
"db:seed": "node --env-file-if-exists=.env.local --import tsx scripts/seed.ts",
"db:setup": "drizzle-kit push && node --env-file-if-exists=.env.local --import tsx scripts/seed.ts",
```
(`db:generate`, `db:migrate`, `db:push`, `start` stay as they are.)

- [ ] **Step 7: Replace the migration history and check static gates**

```bash
git rm -r -q drizzle
pnpm db:generate
grep -E "jsonb|boolean|timestamp with time zone" drizzle/0000_*.sql | head
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
grep -rlE "postgres\.js|drizzle-orm/postgres-js" dist .output 2>/dev/null | grep -i client | head
```
Expected: one `drizzle/0000_*.sql` containing `jsonb`, `boolean` and `timestamp with time zone`; tsc/lint/tests/build green; the last grep prints nothing (no DB driver in client assets — if the build output directory differs, check the client assets folder the build reports).

- [ ] **Step 8: Missing-URL error (Review Focus 5)**

Run: `env -u DATABASE_URL node --import tsx scripts/migrate.ts`
Expected: exit 1 with `DATABASE_URL is not set — point it at a Neon Postgres database`.

- [ ] **Step 9: Migrate + seed the Neon dev branch (Review Focus 1)**

```bash
pnpm db:migrate
pnpm db:seed
```
Expected: migration applied, `✓ Database seeded…`. If the connection fails with an error mentioning `channel_binding` (or another unrecognized parameter), remove `&channel_binding=require` from `DATABASE_URL` in `.env.local`, re-run, and record that instruction for `DEPLOY.md`/`.env.local.example` in Task 4.

- [ ] **Step 10: Verify JSON columns are real JSON arrays (Review Focus 2)**

```bash
node --env-file=.env.local --import tsx --input-type=module -e "
const { queryClient: sql } = await import('#/features/data/db/client');
console.log(await sql\`select jsonb_typeof(taglines) as taglines, jsonb_typeof(stats) as stats from personal_info\`);
await sql.end();
"
```
Expected: `[ { taglines: 'array', stats: 'array' } ]`. If `string`, stop: JSON is double-encoded — report before going further.

- [ ] **Step 11: SSR + admin smoke test**

Run `pnpm dev`, then in another shell:
```bash
curl -s localhost:3000/ | grep -o "Abdoulaye Kemogoha COULIBALY" | head -1
curl -s localhost:3000/en/ | grep -o "<html lang=\"en\"" | head -1
```
Expected: both print a match. Then in the browser: log into `/admin`, change a project title, reload — the change persists; send a message from the contact form — it appears in `/admin/messages`.

- [ ] **Step 12: Commit**

```bash
git add -A package.json pnpm-lock.yaml drizzle drizzle.config.ts scripts/migrate.ts scripts/seed.ts src/features/data
git commit -m "feat(data): move persistence from SQLite/libsql to Postgres (Neon) via postgres.js"
```

---

### Task 3: SQLite → Neon transfer script

**Files:**
- Create: `scripts/transfer-from-sqlite.ts`
- Modify: `package.json` (add `db:transfer`)

**Interfaces:**
- Consumes: `convertSqliteTables`, `SqliteTables` (Task 1); `db`, `queryClient` (Task 2); `seedDatabase` from `#/features/data/db/seed`; `messages` table from `#/features/data/db/schema`.
- Produces: CLI `pnpm db:transfer <path/to/portfolio.db> [--force]`.

- [ ] **Step 1: Write the script** — `scripts/transfer-from-sqlite.ts`

```ts
/**
 * One-off: copy the legacy Railway SQLite database into Postgres (Neon).
 *
 *   pnpm db:transfer ./portfolio.db            # target must be migrated and empty
 *   pnpm db:transfer ./portfolio.db --force    # replace existing content
 *
 * DATABASE_URL (from .env.local or the shell) is the TARGET. Content is
 * validated (Zod) before anything is written, then written through
 * `seedDatabase()` (one transaction, full replace). Messages are inserted with
 * ON CONFLICT DO NOTHING, so a re-run with --force never duplicates them.
 */
import { DatabaseSync } from 'node:sqlite'
import { convertSqliteTables } from '#/features/data/db/fromSqlite'
import type { SqliteTables } from '#/features/data/db/fromSqlite'
import { db, queryClient } from '#/features/data/db/client'
import { messages } from '#/features/data/db/schema'
import { seedDatabase } from '#/features/data/db/seed'

const USAGE = 'Usage: pnpm db:transfer <path/to/portfolio.db> [--force]'

function readLegacyTables(path: string): SqliteTables {
  const sqlite = new DatabaseSync(path, { readOnly: true })
  try {
    // Fixed table names (never user input) — no injection surface.
    const all = (table: string) => sqlite.prepare(`SELECT * FROM ${table}`).all()
    return {
      personalInfo: all('personal_info'),
      skills: all('skills'),
      projects: all('projects'),
      experiences: all('experiences'),
      education: all('education_entries'),
      settings: all('settings'),
      messages: all('messages'),
    }
  } finally {
    sqlite.close()
  }
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const path = args.find((arg) => !arg.startsWith('--'))
  if (!path) throw new Error(USAGE)

  const { data, messages: inbox } = convertSqliteTables(readLegacyTables(path))

  const existing = await db.query.personalInfo.findFirst()
  if (existing && !force) {
    throw new Error(
      'Target database already has content — nothing written. Re-run with --force to replace it.',
    )
  }

  await seedDatabase(data)
  if (inbox.length) {
    await db
      .insert(messages)
      .values(inbox.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })))
      .onConflictDoNothing()
  }

  console.log(
    `✓ transferred: ${data.projects.length} projects, ${data.experiences.length} experiences, ` +
      `${data.skills.length} skills, ${data.education.length} education, ${inbox.length} messages`,
  )
}

main()
  .then(async () => {
    await queryClient.end()
    process.exit(0)
  })
  .catch(async (error: unknown) => {
    console.error('✗ transfer failed:', error)
    await queryClient.end()
    process.exit(1)
  })
```

Add to `package.json` scripts:

```json
"db:transfer": "node --env-file-if-exists=.env.local --import tsx scripts/transfer-from-sqlite.ts",
```

- [ ] **Step 2: Static gates**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Bad input fails cleanly**

```bash
pnpm db:transfer
pnpm db:transfer ./does-not-exist.db
```
Expected: both exit non-zero — the first with the usage line, the second with an SQLite "unable to open database file" error. Nothing written.

- [ ] **Step 4: Refuses a non-empty target (Review Focus 4)** — the dev branch was seeded in Task 2.

Run: `pnpm db:transfer ./legacy-fixture.db`
Expected: exit 1, `Target database already has content — nothing written.`

- [ ] **Step 5: Transfers with --force**

Run: `pnpm db:transfer ./legacy-fixture.db --force`
Expected: `✓ transferred: N projects, … , 1 messages` with N equal to the project count printed in Task 1 Step 6.

- [ ] **Step 6: Re-run does not duplicate messages**

```bash
pnpm db:transfer ./legacy-fixture.db --force
node --env-file=.env.local --import tsx --input-type=module -e "
const { queryClient: sql } = await import('#/features/data/db/client');
console.log(await sql\`select count(*)::int as n from messages where id = 'fixture-msg-1'\`);
await sql.end();
"
```
Expected: second run succeeds; count is `[ { n: 1 } ]`. In `pnpm dev`, `/admin/messages` shows the fixture message with its original date.

- [ ] **Step 7: Commit**

```bash
git add scripts/transfer-from-sqlite.ts package.json
git commit -m "feat(data): one-off SQLite → Neon transfer script (content + messages)"
```

---

### Task 4: Render Blueprint, Railway removal, docs

**Files:**
- Create: `render.yaml`
- Delete: `railway.json`
- Modify: `Dockerfile` (header comment), `vite.config.ts:20-22` (comment), `.env.local.example`, `CLAUDE.md`
- Rewrite: `DEPLOY.md`

**Interfaces:** none (config + docs).

- [ ] **Step 1: Create `render.yaml`**

```yaml
# Render Blueprint — https://render.com/docs/blueprint-spec
# Native Node runtime (no Docker). Env vars marked `sync: false` are entered in
# the Render dashboard on first creation and are never committed.
services:
  - type: web
    name: portfolio
    runtime: node
    plan: free
    branch: main
    autoDeployTrigger: commit
    # pnpm pinned to the locally tested version via npx — NOT corepack, whose
    # shim crashed with pnpm 11.1.2 on the previous host.
    buildCommand: npx pnpm@11.1.2 install --frozen-lockfile && npx pnpm@11.1.2 build
    # `start` = migrate-on-start (seed only on an empty DB) then `vite preview`
    # on $PORT. It only needs tsx/vite from node_modules, so plain npm runs it.
    startCommand: npm run start
    healthCheckPath: /
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: ADMIN_PASSWORD
        sync: false
```

- [ ] **Step 2: Remove Railway config, retarget comments**

```bash
git rm -q railway.json
```

`Dockerfile` — replace the header comment (lines 1–5) with:

```dockerfile
# FALLBACK ONLY. Render deploys with its native Node runtime (render.yaml). Keep
# this file until the first native deploy is verified; if pnpm setup fails there,
# set `runtime: docker` in render.yaml. pnpm 11.1.2 is installed with npm, not
# corepack (corepack's shim crashes with pnpm 11.1.2).
```
and replace `# Railway injects PORT at runtime; …` with `` # The platform injects PORT at runtime; `start` runs migrate-on-start then serves. ``

`vite.config.ts` — replace `allow the platform domain (Railway)` with `allow the platform domain (Render)`.

- [ ] **Step 3: Rewrite `.env.local.example`**

```bash
# Copy to .env.local (never commit the real file).

# Admin dashboard password — verified server-side (server/admin.ts).
# NOT prefixed VITE_ on purpose: VITE_ vars are embedded in the client bundle.
ADMIN_PASSWORD=changeme

# Neon Postgres — REQUIRED. Use the `dev` branch's DIRECT (unpooled) connection
# string locally; production (`main` branch) is set in the Render dashboard.
DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```
If Task 2 Step 9 required stripping `channel_binding`, add the line `# Remove "&channel_binding=require" from the URL Neon gives you.` above `DATABASE_URL`.

- [ ] **Step 4: Rewrite `DEPLOY.md`**

````markdown
# Deploy to Render + Neon

The app is a TanStack Start server (Render web service, native Node runtime,
free plan) backed by Neon Postgres. Content edited in `/admin` lives in Neon and
survives redeploys.

## What the repo provides

- `render.yaml` — Blueprint: build `npx pnpm@11.1.2 install --frozen-lockfile && npx pnpm@11.1.2 build`,
  start `npm run start`, auto-deploy on `main`.
- `npm run start` → `scripts/migrate.ts` (applies migrations, seeds defaults
  only on an empty DB) then `vite preview` on `$PORT` (injected by Render).
- `engines.node: 22.x`.

## 1. Neon

1. Create a project (region close to Render's, e.g. Frankfurt for `frankfurt`).
2. The default `main` branch is production. Create a `dev` branch for local work.
3. For each branch copy the **direct** connection string (pooling OFF), ending in `?sslmode=require`.
4. Local: put the `dev` URL in `.env.local` (`DATABASE_URL=…`), then `pnpm db:migrate && pnpm db:seed`.

## 2. Move production data from Railway (one time)

1. Make a consistent copy of the SQLite file inside the Railway service (includes WAL content):
   ```bash
   railway ssh -- node -e "new (require('node:sqlite').DatabaseSync)('/data/portfolio.db').exec(\"VACUUM INTO '/tmp/export.db'\")"
   railway ssh -- base64 /tmp/export.db | base64 --decode > portfolio-prod.db
   ```
   (If `railway ssh -- <cmd>` is not available in your CLI version, open `railway ssh`
   interactively, run the same commands, and copy the base64 output.)
2. Check it opens: `node -e "console.log(new (require('node:sqlite').DatabaseSync)('portfolio-prod.db').prepare('select count(*) n from projects').get())"`.
3. Rehearse on the dev branch: `pnpm db:transfer ./portfolio-prod.db --force`, check `pnpm dev`.
4. Production: `DATABASE_URL='<main direct URL>' pnpm db:migrate`, then
   `DATABASE_URL='<main direct URL>' pnpm db:transfer ./portfolio-prod.db`.
   The script refuses to overwrite a non-empty database unless `--force` is passed.

## 3. Render

1. Dashboard → **New → Blueprint** → pick `kabdoullah/portfolio`, branch `main`.
2. Enter the `sync: false` variables:
   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon `main` direct connection string |
   | `ADMIN_PASSWORD` | admin password (NOT `VITE_`-prefixed) |
3. Deploy. Migrations are a no-op and the seed is skipped (the DB already has content).

## 4. Cut over

1. Verify on the `*.onrender.com` URL: `/`, `/en/`, an `/admin` edit that survives a reload,
   the messages inbox.
2. Only then shut down the Railway service.
3. Once the native deploy is confirmed, delete `Dockerfile` and `.dockerignore`.
   If the native build fails while installing pnpm, set `runtime: docker` in `render.yaml`
   instead — the Dockerfile is the tested fallback.

## Notes

- Free plan: the service sleeps after 15 min without traffic; the next visit waits
  ~1 min. Upgrade by changing `plan` in `render.yaml`.
- Neon suspends idle compute after 5 min; the first query after that is slightly slower.
- The admin password is checked server-side; it never reaches the browser.
````

Note on `DATABASE_URL=… pnpm db:migrate` in section 2.4: an inline `DATABASE_URL` wins over `.env.local` because `process.loadEnvFile` / `--env-file-if-exists` never override variables already set in the environment.

- [ ] **Step 5: Update `CLAUDE.md`** — exact replacements:

| Find | Replace with |
| --- | --- |
| `persisted in **SQLite via Drizzle**` | `persisted in **Neon Postgres via Drizzle**` |
| `` Deployed on Railway (see `DEPLOY.md`). `` | `` Deployed on Render (see `DEPLOY.md`). `` |
| `` - **Drizzle ORM** + **libsql** (`@libsql/client`): local SQLite file in dev, Turso or a file on a volume in prod `` | `` - **Drizzle ORM** + **postgres.js** on **Neon** (`dev` branch locally, `main` branch in prod) `` |
| `` `DATABASE_URL` / `DATABASE_AUTH_TOKEN` are unset in dev, which uses `file:portfolio.db`. `` | `` `DATABASE_URL` (required): Neon **direct** connection string — the `dev` branch locally. `` |
| `stored across SQLite tables` | `stored across Postgres tables` |

and add this row to the Commands table after `db:seed`:

```markdown
| `pnpm db:transfer <file.db> [--force]` | One-off copy of the legacy Railway SQLite file into the DB (see `DEPLOY.md`) |
```

- [ ] **Step 6: Final gates + leftover check**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
grep -rniE "libsql|turso|railway|DATABASE_AUTH_TOKEN" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs --exclude=pnpm-lock.yaml .
```
Expected: all green; the grep only matches `DEPLOY.md` section 2 (Railway data extraction), the `Dockerfile` comment (none expected after Step 2), `src/features/data/db/fromSqlite.ts` and `scripts/transfer-from-sqlite.ts` header comments ("legacy Railway SQLite").

- [ ] **Step 7: Commit**

```bash
git add render.yaml Dockerfile vite.config.ts .env.local.example DEPLOY.md CLAUDE.md
git commit -m "chore(deploy): Render blueprint (native Node) + Neon docs, drop Railway config"
```

After this task, the remaining steps are the user's (DEPLOY.md sections 2–4): production transfer, Render creation, verification, Railway shutdown, Dockerfile removal.
