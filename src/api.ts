// API-basis voor hybride web/Capacitor apps.
// Op web (zelfde origin) is de base leeg; in de native iOS/Android bundel wijst
// NEXT_PUBLIC_API_BASE (of NEXT_PUBLIC_API_URL) naar de Vercel-deployment.
//
// Regel: ELKE fetch naar /api/* gaat via apiUrl()/apiFetch() of `${API}/api/...`
// — kale fetch('/api/...') breekt in de statisch gebundelde iOS-app.

export const API = process.env.NEXT_PUBLIC_API_BASE ?? process.env.NEXT_PUBLIC_API_URL ?? ''

export function apiUrl(path: string): string {
  return `${API}${path}`
}

/** fetch-wrapper met console-logging; cookies gaan mee (credentials include) voor cross-origin native auth. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path)
  try {
    const res = await fetch(url, { credentials: 'include', ...init })
    if (!res.ok) console.warn(`[api] ${init?.method ?? 'GET'} ${url} -> ${res.status}`)
    return res
  } catch (err) {
    console.error(`[api] ${init?.method ?? 'GET'} ${url} — netwerkfout:`, err)
    throw err
  }
}
