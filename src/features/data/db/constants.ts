/** Singleton tables (personal_info + settings) always live on row id = 1. */
export const SINGLETON_ID = 1

/**
 * Close idle pool connections well before Neon suspends its compute (after
 * 5 min of inactivity), so the next query opens a fresh connection instead of
 * failing on one the server already dropped.
 */
export const DB_IDLE_TIMEOUT_SECONDS = 60
