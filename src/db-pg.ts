// Postgres via pg Pool (Neon-compatibel) — voor apps met langlopende queries
// of een custom server (Ludoryn). `query` geeft het volledige pg QueryResult
// terug (gebruik `const { rows } = await query(...)`).

import { Pool, type QueryResult } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.error('[DB] DATABASE_URL is niet gezet')
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL?.includes('neon.tech') ||
        process.env.DATABASE_URL?.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : false,
    })
    pool.on('error', err => {
      console.error('[DB] Pool error:', err.message)
    })
  }
  return pool
}

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const p = getPool()
  const start = Date.now()
  try {
    const res = await p.query(text, params)
    const duration = Date.now() - start
    if (duration > 2000) console.warn(`[DB] Trage query (${duration}ms):`, text.slice(0, 80))
    return res
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string }
    console.error('[DB] Query mislukt:', e.message, '| Query:', text.slice(0, 120), '| Code:', e.code)
    throw err
  }
}
