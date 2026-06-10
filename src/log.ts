// Centrale logging — alle apps loggen naar dezelfde Neon `app_logs` tabel,
// zichtbaar op https://admin-robin.vercel.app
//
// Twee transports:
//  - makeLogApi(app):   HTTP POST naar admin-robin (vereist ADMIN_KEY env) — standaard
//  - makeDbLogApi(...): directe insert voor apps met eigen DATABASE_URL naar dezelfde DB

export interface LogOpts {
  method: string
  path: string
  status: number
  durationMs: number
  userId?: string | null
  groupCode?: string | null
  error?: string | null
  ip?: string | null
  /** optionele override van de app-naam (bijv. een log-ingest endpoint dat voor meerdere apps logt) */
  app?: string
}

export type LogApi = (opts: LogOpts) => Promise<void>

/** Fire-and-forget logging via admin-robin. Gebruik: `export const logApi = makeLogApi('flights')` */
export function makeLogApi(app: string): LogApi {
  return async (opts: LogOpts) => {
    const key = process.env.ADMIN_KEY
    if (!key) return
    fetch('https://admin-robin.vercel.app/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, ...opts, app: opts.app ?? app }),
    }).catch(() => {})
  }
}

type QueryFn = (sql: string, params?: unknown[]) => Promise<unknown>

/** Directe insert in app_logs — voor apps die op dezelfde Neon-database zitten (zoals TripSync). */
export function makeDbLogApi(query: QueryFn, app: string): LogApi {
  return async (opts: LogOpts) => {
    query(
      `INSERT INTO app_logs (app, method, path, status_code, duration_ms, user_id, group_code, error, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        opts.app ?? app,
        opts.method.toUpperCase(),
        opts.path,
        opts.status,
        opts.durationMs,
        opts.userId ?? null,
        opts.groupCode ?? null,
        opts.error ?? null,
        opts.ip ?? null,
      ],
    ).catch(() => {}) // fire-and-forget, blokkeert nooit de response
  }
}
