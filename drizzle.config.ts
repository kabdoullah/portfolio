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
