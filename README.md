# robin-shared

Gedeelde library voor alle Robin-apps: **Flights**, **Ludoryn**, **TripSync**, **Echoo**.
Alles wat in meerdere apps voorkomt hoort hier — niet kopiëren tussen repos.

## Installatie

```bash
npm install github:Robin1896/robin-shared
```

De package levert TypeScript-bron; voeg in elke Next-app toe aan `next.config`:

```js
transpilePackages: ['robin-shared']
```

## Modules

| Import | Inhoud | Dependencies |
|---|---|---|
| `robin-shared` of `robin-shared/log` | `makeLogApi(app)`, `makeDbLogApi(query, app)` | geen |
| `robin-shared/api` | `API`, `apiUrl()`, `apiFetch()` | geen |
| `robin-shared/auth` | `makeAuth(app)` → hash/verify wachtwoord, HMAC-cookietoken | geen (node crypto) |
| `robin-shared/db-pg` | `getPool()`, `query()` (pg QueryResult) | `pg` |
| `robin-shared/db-neon` | `query()` (rows), `queryOne()` | `@neondatabase/serverless` |
| `robin-shared/email` | `sendPasswordResetEmail()` | `resend` |
| `icons/make-icon.js` | App-icon generator in huisstijl | `canvas` |

Per app maak je dunne lokale wrappers zodat call-sites kort blijven:

```ts
// lib/log.ts
import { makeLogApi } from 'robin-shared'
export const logApi = makeLogApi('flights')
```

## Conventies

### App-namen (logging + cookies)
`flights` · `ludoryn` · `tripsync` · `echoo`

### Logging
Alle apps loggen naar dezelfde Neon `app_logs` tabel, dashboard: https://admin-robin.vercel.app
- HTTP-route (default): vereist `ADMIN_KEY` env op het Vercel-project
- Directe insert (`makeDbLogApi`): voor apps die zelf op die database zitten (TripSync)
- Elke API-route logt: methode, pad, status, duur; middleware logt page views

### Auth
- Cookie `<app>-token` (httpOnly, SameSite=lax, 30 dagen), HMAC-SHA256 getekend met `AUTH_SECRET` env
- Wachtwoorden: scrypt, opgeslagen als `salt:hash`
- Login/registratie geven `{ username }` terug — géén token in de body
- Wachtwoord vergeten: e-mail met reset-LINK (token 1 uur geldig, tabel `password_reset_tokens`)

### Database
- Neon Postgres, connection string in `DATABASE_URL` env
- Serverless routes: `db-neon`; custom server / pool-gebruik: `db-pg`

### API-calls in hybride apps (web + Capacitor iOS)
Nooit kale `fetch('/api/...')` — altijd via `apiUrl()`/`${API}` zodat de statisch
gebundelde iOS-app de calls naar de Vercel-backend stuurt (`NEXT_PUBLIC_API_BASE`).

### App-icons (huisstijl)
Crème achtergrond `#ede8dd`, donkere Georgia-serif letter `#1a1d2e`, rode stip `#c14a1f`:

```bash
node icons/make-icon.js <letter> <output.png>   # 1024×1024
```

### Spelnamen (Ludoryn)
Nooit merknamen tonen: Flikflak (niet Beverbende/Cabo), Kriskras (niet Qwixx),
Basteon (niet Carcassonne), Treinreis/Traxion, Vleugels, Kolonis, Grub/Wormenjacht.
