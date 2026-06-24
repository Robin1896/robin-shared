// Bluesky-poster (gratis, open AT Protocol API) voor de Robin-apps.
// Postt waardevolle tips uit de blog met een nette link-kaart — geen spam.
//
//   BSKY_HANDLE=jij.bsky.social BSKY_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx \
//     node tools/social.mjs flights            # post de volgende tip (rouleert)
//   node tools/social.mjs flights "eigen tekst" https://link   # post iets eigens
//
// App-password maak je op bsky.app → Settings → Privacy and Security → App Passwords.
// State (welke tips al gepost) in ./growth-data/bsky-<app>.json.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const SITE = 'https://frontend-robin1896s-projects.vercel.app'

const TIPS = {
  flights: [
    { t: 'Wanneer boek je een vlucht het goedkoopst? De zoete plek is meestal 6–10 weken vóór vertrek. ✈️', u: SITE + '/blog/wanneer-vlucht-boeken', ti: 'Wanneer kun je het beste een vlucht boeken?' },
    { t: 'De goedkoopste maand om te vliegen verschilt per bestemming — mik op de shoulder season en bespaar tot de helft. 🌍', u: SITE + '/blog/goedkoopste-maand-vliegen', ti: 'Wat is de goedkoopste maand om te vliegen?' },
    { t: '9 praktische tips om goedkope vluchten te vinden — van flexibele datums tot alternatieve luchthavens.', u: SITE + '/blog/goedkope-vluchten-vinden', ti: 'Goedkope vluchten vinden: 9 tips' },
    { t: 'Stop met handmatig prijzen checken: een prijsalert seint je zodra je vlucht goedkoper wordt. 🔔', u: SITE + '/blog/prijsalert-vluchten', ti: 'Prijsalert voor vluchten: zo werkt een prijswacht' },
    { t: 'Alleen handbagage = goedkoper en sneller. Let op: bij budgetmaatschappijen is een trolley vaak een betaalde extra.', u: SITE + '/blog/vliegen-met-handbagage', ti: 'Vliegen met alleen handbagage' },
    { t: 'Vanaf Eindhoven, Brussel of Düsseldorf is dezelfde route soms tientallen euro’s goedkoper. Reken de rijtijd mee.', u: SITE + '/blog/goedkoper-vliegen-andere-luchthaven', ti: 'Goedkoper vliegen vanaf een andere luchthaven' },
    { t: 'Een tussenstop is vaak goedkoper — en met TAP/Icelandair/Turkish pak je er gratis een stad bij. 🏙️', u: SITE + '/blog/gratis-stopover', ti: 'Gratis stopover: een extra stad cadeau' },
    { t: 'Wat is de goedkoopste dag om te vliegen? Dinsdag, woensdag en zaterdag zijn meestal het voordeligst.', u: SITE + '/blog/goedkoopste-dag-om-te-vliegen', ti: 'Wat is de goedkoopste dag om te vliegen?' },
    { t: 'Vertraagde of geannuleerde vlucht? Onder EU261 heb je vaak recht op €250–€600 compensatie. Ken je rechten.', u: SITE + '/blog/vluchtvertraging-compensatie', ti: 'Vluchtvertraging: waar heb je recht op?' },
    { t: 'Een weekendje weg vliegen onder €100? Met flexibele datums en de juiste steden kan het. 🧳', u: SITE + '/blog/goedkoop-weekendje-weg-vliegen', ti: 'Weekendje weg vliegen onder €100' },
  ],
}

const app = process.argv[2] || 'flights'
const customText = process.argv[3]
const customUrl = process.argv[4]
const HANDLE = process.env.BSKY_HANDLE
const PW = process.env.BSKY_APP_PASSWORD
if (!HANDLE || !PW) { console.error('Zet BSKY_HANDLE + BSKY_APP_PASSWORD als env (app-password van bsky.app).'); process.exit(1) }

const PDS = 'https://bsky.social'
async function xrpc(method, body, token) {
  const r = await fetch(`${PDS}/xrpc/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${method} ${r.status}: ${JSON.stringify(j).slice(0, 200)}`)
  return j
}

// kies de tip
let tip
if (customText) tip = { t: customText, u: customUrl || SITE, ti: 'Flights.' }
else {
  const list = TIPS[app] || []
  if (!list.length) { console.error('Geen tips voor app', app); process.exit(1) }
  mkdirSync(join(process.cwd(), 'growth-data'), { recursive: true })
  const stateFile = join(process.cwd(), 'growth-data', `bsky-${app}.json`)
  const posted = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : []
  let idx = list.findIndex((_, i) => !posted.includes(i))
  if (idx === -1) { posted.length = 0; idx = 0 } // ronde rond → opnieuw
  tip = list[idx]
  posted.push(idx); writeFileSync(stateFile, JSON.stringify(posted))
}

const sess = await xrpc('com.atproto.server.createSession', { identifier: HANDLE, password: PW })
const record = {
  $type: 'app.bsky.feed.post',
  text: tip.t,
  createdAt: new Date().toISOString(),
  langs: ['nl'],
  embed: { $type: 'app.bsky.embed.external', external: { uri: tip.u, title: tip.ti, description: 'Flights. — vind de beste vlucht, niet alleen de goedkoopste.' } },
}
const res = await xrpc('com.atproto.repo.createRecord', { repo: sess.did, collection: 'app.bsky.feed.post', record }, sess.accessJwt)
console.log('✓ Gepost op Bluesky:', res.uri)
