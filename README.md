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

### Design system (kleuren + typografie)
`theme.css` is de single source of truth — alle apps mappen hun lokale variabelen
op de `--rs-*` tokens, dus een kleurwijziging hier verandert alle apps:

```css
/* Tailwind v4 apps (Flights, TripSync, Echoo) */
@theme { --color-bg: var(--rs-bg); --color-dark: var(--rs-ink); ... }
/* CSS-var apps (Ludoryn) */
:root { --bg: var(--rs-bg); --text: var(--rs-ink); --accent: var(--rs-brand); ... }
```

In de app-layout (vóór globals.css):
```ts
import 'robin-shared/theme.css'
import 'robin-shared/components.css'   // voor de rs-* componenten
```

Palet: bg `#f4efe6` · card `#fffdf9` · ink `#1a1d2e` · brand `#c14a1f` · muted `#8a8478` · dim `#c0bab3` · success `#2d7a3a`
Typografie: **Instrument Serif** (display) · **DM Sans** (body) · **JetBrains Mono** (labels, uppercase + ruime tracking)
Donker thema: opt-in via `theme-dark.css` (TripSync).
TS-constanten voor inline styles/canvas: `import { colors, fonts } from 'robin-shared/tokens'`.

### UI-componenten
`robin-shared/components` (+ `components.css`): `Btn` (primary/outline/link/remove),
`SectionLabel`, `StatusMsg`, `Loader`, `Card` — huisstijl-primitieven zonder
Tailwind-afhankelijkheid. Nieuwe UI bouw je hiermee; bestaande app-specifieke
componenten (Ludoryn `ui.tsx`, Flights Tailwind-componenten) migreren geleidelijk.

### App-icons (huisstijl)
Crème achtergrond `#ede8dd`, donkere Georgia-serif letter `#1a1d2e`, rode stip `#c14a1f`:

```bash
node icons/make-icon.js <letter> <output.png>   # 1024×1024
```

### Spelnamen (Ludoryn)
Nooit merknamen tonen: Flikflak (niet Beverbende/Cabo), Kriskras (niet Qwixx),
Basteon (niet Carcassonne), Treinreis/Traxion, Vleugels, Kolonis, Grub/Wormenjacht.
