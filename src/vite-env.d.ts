/// <reference types="vite/client" />

// The admin password is now read server-side as `process.env.ADMIN_PASSWORD`
// (see src/features/data/server/admin.ts), never via a VITE_ client env var.
interface ImportMetaEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
