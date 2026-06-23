// Gratis bekendheid-tool (geen social media) voor de Robin-apps.
//   node tools/growth.mjs reddit                 # vind Reddit-posts waar je app past
//   node tools/growth.mjs seo "<zoekwoord>"      # genereer een SEO-blogdraft
//   node tools/growth.mjs directories            # toon directory-tracker
//   node tools/growth.mjs directories done <naam> [url]   # markeer als ingediend
//
// Config per app onderaan in APPS; kies met env APP=flights (default) of arg --app=<naam>.
// SEO gebruikt een AI-key: CEREBRAS_API_KEY / GROQ_API_KEY / GEMINI_API_KEY (eerste die er is).
// Output: ./growth-output/  (blogs) en ./growth-data/  (tracker-state).

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// ─────────────────────────── App-configuratie ───────────────────────────
const APPS = {
  flights: {
    name: 'Flights.',
    url: 'https://apps.apple.com/app/id6763154998',
    pitch: 'Slimme vluchtzoeker met AI-assistent (flAIghts), prijswacht en weer-gekoppeld ontdekken — vindt de béste vlucht, niet alleen de goedkoopste.',
    audience: 'Nederlandse reizigers die zelf goedkope/flexibele vluchten zoeken',
    niche: 'vluchten zoeken / goedkope vluchten / travel deals',
    lang: 'nl',
    // zoekwoorden voor SEO + Reddit
    keywords: [
      'goedkope vluchten vinden', 'wanneer vlucht boeken goedkoopst', 'goedkoopste maand om te vliegen',
      'flexibel vluchten zoeken', 'prijsalert vluchten', 'cheap flights finder',
      'best time to book flights', 'flight price tracker', 'cheapest month to fly',
    ],
    // subreddits waar de doelgroep zit
    subreddits: ['travel', 'Flights', 'TravelHacks', 'Shoestring', 'solotravel', 'Netherlands', 'awardtravel', 'onebag'],
  },
  ludoryn: {
    name: 'Ludoryn',
    url: 'https://ludoryn-web.vercel.app',
    pitch: 'Speel bordspellen online met vrienden — direct in de browser, geen installatie (Flikflak, Kriskras, 1000 Bommen, Grub Hunt e.a.).',
    audience: 'mensen die online met vrienden bordspellen/partyspellen willen spelen',
    niche: 'online bordspellen / multiplayer browsergames',
    lang: 'nl',
    keywords: [
      'play board games online with friends', 'online board games free no download',
      'browser board games multiplayer', 'party games online with friends',
      'digital board game night', 'online dice games with friends',
    ],
    subreddits: ['boardgames', 'tabletopgames', 'WebGames', 'IndieGaming', 'playmygame', 'incremental_games'],
  },
  tripsync: {
    name: 'TripSync',
    url: 'https://tripsync-jade.vercel.app',
    pitch: 'Beslis samen met je groep waar je heen gaat — voorstellen, stemmen, knopen doorhakken, zonder eindeloze appjes.',
    audience: 'groepen vrienden/familie die samen een reis plannen',
    niche: 'groepsreis plannen / samen beslissen waarheen',
    lang: 'nl',
    keywords: [
      'plan a trip with friends app', 'how to decide where to travel as a group',
      'group trip planning tool', 'travel voting app', 'group vacation planning',
      'app to pick a holiday destination together',
    ],
    subreddits: ['travel', 'TravelHacks', 'roadtrip', 'solotravel', 'productivity', 'SideProject'],
  },
  echoo: {
    name: 'Echo.',
    url: 'https://echo-omega-umber.vercel.app',
    pitch: 'Laat een kort geluidsfragment achter op de plek waar je bent; wie later langskomt, hoort jouw echo. Locatiegebonden audio.',
    audience: 'mensen die van locatiegebonden, creatieve sociale apps houden',
    niche: 'locatiegebonden audio / geo-social / soundmap',
    lang: 'nl',
    keywords: [
      'location based audio app', 'leave a voice message at a place',
      'geotagged audio app', 'soundmap app', 'audio left at a location',
      'location based social audio',
    ],
    subreddits: ['SideProject', 'InternetIsBeautiful', 'iosapps', 'androidapps', 'apphookup', 'sideproject'],
  },
}

// intentie-signalen → een post is een goede kans om te reageren
const INTENT = [
  'how do i', 'how to find', 'best site', 'best app', 'best way', 'any app', 'any site', 'tool for',
  'recommend', 'looking for', 'alternative to', 'cheapest way', 'is there a',
  'welke site', 'welke app', 'tips voor', 'goedkoopste manier', 'hoe vind ik', 'aanrader', 'iemand een',
]

const DIRECTORIES = [
  'Product Hunt', 'AlternativeTo', 'G2', 'Capterra', 'SaaSHub', 'BetaList', 'Slant',
  'StackShare', 'Indie Hackers', 'Hacker News (Show HN)', "There's An AI For That",
  'Toolify.ai', 'Futurepedia', 'Uneed', 'Launching Next', 'BetaPage', 'Startup Stash', 'app.co',
]

// ─────────────────────────── Helpers ───────────────────────────
const argv = process.argv.slice(2)
const cmd = argv[0]
const appKey = (argv.find(a => a.startsWith('--app=')) || `--app=${process.env.APP || 'flights'}`).split('=')[1]
const APP = APPS[appKey]
if (!APP) { console.error(`Onbekende app "${appKey}". Beschikbaar: ${Object.keys(APPS).join(', ')}`); process.exit(1) }

const OUT = join(process.cwd(), 'growth-output')
const DATA = join(process.cwd(), 'growth-data')
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function callAI(prompt) {
  const oai = async (url, key, model) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 2200 }) })
    if (!r.ok) throw new Error(`${url} ${r.status}`)
    return (await r.json()).choices[0].message.content
  }
  if (process.env.CEREBRAS_API_KEY) { try { return await oai('https://api.cerebras.ai/v1/chat/completions', process.env.CEREBRAS_API_KEY, 'llama-3.3-70b') } catch {} }
  if (process.env.GROQ_API_KEY) { try { return await oai('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile') } catch {} }
  if (process.env.GEMINI_API_KEY) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }) })
    return (await r.json()).candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  }
  throw new Error('Geen AI-key gevonden. Zet CEREBRAS_API_KEY, GROQ_API_KEY of GEMINI_API_KEY.')
}

// ─────────────────────────── 1) Reddit-leads ───────────────────────────
// Reddit blokkeert anonieme .json (403) → app-only OAuth via een gratis "script"-app:
// https://www.reddit.com/prefs/apps → "create app" type=script → zet
// REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET als env.
// Geen echte naam in de UA — neutraal + instelbare pseudo-handle via env REDDIT_USER.
const UA = { 'User-Agent': `${appKey}-growth/1.0 (by u/${process.env.REDDIT_USER || 'anon'})` }
async function redditToken() {
  const id = process.env.REDDIT_CLIENT_ID, secret = process.env.REDDIT_CLIENT_SECRET
  if (!id || !secret) {
    console.error('Reddit-creds ontbreken. Maak een gratis "script"-app op https://www.reddit.com/prefs/apps')
    console.error('en zet REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET als env-variabele.')
    process.exit(1)
  }
  const r = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded', ...UA },
    body: 'grant_type=client_credentials',
  })
  if (!r.ok) { console.error('Reddit-token fout:', r.status, await r.text().catch(() => '')); process.exit(1) }
  return (await r.json()).access_token
}
async function reddit() {
  const token = await redditToken()
  const H = { ...UA, Authorization: 'Bearer ' + token }
  const seen = new Set(), leads = []
  const queries = APP.keywords.slice(0, 6)
  for (const sub of APP.subreddits) {
    for (const q of queries) {
      const url = `https://oauth.reddit.com/r/${sub}/search?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&t=year&limit=15`
      try {
        const j = await (await fetch(url, { headers: H })).json()
        for (const c of j?.data?.children || []) {
          const p = c.data
          if (!p || seen.has(p.id)) continue
          seen.add(p.id)
          const text = `${p.title} ${p.selftext || ''}`.toLowerCase()
          const hits = INTENT.filter(s => text.includes(s))
          if (!hits.length && !p.title.includes('?')) continue   // alleen vragen/intentie
          leads.push({
            sub, score: hits.length + (p.title.includes('?') ? 1 : 0), ups: p.ups,
            title: p.title, url: 'https://reddit.com' + p.permalink,
            age_days: Math.round((Date.now() / 1000 - p.created_utc) / 86400),
          })
        }
      } catch (e) { /* rate limit / netwerk → overslaan */ }
      await new Promise(r => setTimeout(r, 700))
    }
  }
  leads.sort((a, b) => b.score - a.score || b.ups - a.ups)
  const top = leads.slice(0, 30)
  console.log(`\n${top.length} Reddit-kansen voor ${APP.name} (sorteer: relevantie):\n`)
  for (const l of top) {
    console.log(`r/${l.sub} · ▲${l.ups} · ${l.age_days}d · score ${l.score}`)
    console.log(`  ${l.title}`)
    console.log(`  ${l.url}\n`)
  }
  console.log('⚠️ Reageer authentiek en behulpzaam — noem je app alleen als het écht de vraag beantwoordt;')
  console.log('   de meeste subreddits bannen openlijke promotie. Lees per subreddit de regels.')
  mkdirSync(DATA, { recursive: true })
  writeFileSync(join(DATA, `reddit-${appKey}.json`), JSON.stringify(top, null, 2))
}

// ─────────────────────────── 2) SEO-blogdraft ───────────────────────────
async function seo(keyword) {
  if (!keyword) { console.error('Geef een zoekwoord: node tools/growth.mjs seo "goedkoopste maand om te vliegen"'); process.exit(1) }
  const prompt = `Schrijf een SEO-geoptimaliseerde blogpost in het ${APP.lang === 'nl' ? 'Nederlands' : 'Engels'} rond het zoekwoord: "${keyword}".
Context — app om subtiel (niet spammerig) één keer natuurlijk te noemen als oplossing: ${APP.name} — ${APP.pitch}
Doelgroep: ${APP.audience}. Niche: ${APP.niche}.
Lever in Markdown met: een pakkende H1, een meta description (max 155 tekens, als regel "> meta: ..."), 4-6 H2-secties, korte alinea's, een bulletlijst, en een FAQ met 3 vragen. Praktisch en waardevol; gebruik het zoekwoord en varianten natuurlijk in koppen en tekst.`
  console.log(`Genereren voor "${keyword}"…`)
  const md = await callAI(prompt)
  mkdirSync(OUT, { recursive: true })
  const file = join(OUT, `${slug(keyword)}.md`)
  writeFileSync(file, md)
  console.log('✓ Blogdraft:', file)
}

// ─────────────────────────── 3) Directory-tracker ───────────────────────────
function loadTracker() {
  mkdirSync(DATA, { recursive: true })
  const file = join(DATA, `directories-${appKey}.json`)
  let state
  if (existsSync(file)) state = JSON.parse(readFileSync(file, 'utf8'))
  else state = DIRECTORIES.map(name => ({ name, status: 'todo', url: '', date: '' }))
  return { file, state }
}
function directories() {
  const { file, state } = loadTracker()
  const sub = argv[1]
  if (sub === 'done') {
    const name = argv.slice(2).filter(a => !a.startsWith('http')).join(' ')
    const url = argv.find(a => a.startsWith('http')) || ''
    const row = state.find(d => d.name.toLowerCase().includes(name.toLowerCase()))
    if (!row) { console.error(`Directory "${name}" niet gevonden. Bekend: ${state.map(d => d.name).join(', ')}`); process.exit(1) }
    row.status = 'done'; row.url = url; row.date = new Date().toISOString().slice(0, 10)
    writeFileSync(file, JSON.stringify(state, null, 2))
    console.log(`✓ ${row.name} → ingediend${url ? ' (' + url + ')' : ''}`)
    return
  }
  const done = state.filter(d => d.status === 'done').length
  console.log(`\nDirectory-tracker voor ${APP.name} — ${done}/${state.length} ingediend\n`)
  for (const d of state) {
    const mark = d.status === 'done' ? '✅' : '⬜'
    console.log(`${mark} ${d.name}${d.date ? '  · ' + d.date : ''}${d.url ? '  · ' + d.url : ''}`)
  }
  console.log(`\nMarkeer met: node tools/growth.mjs directories done "Product Hunt" https://...`)
  writeFileSync(file, JSON.stringify(state, null, 2))  // seed bij eerste run
}

// ─────────────────────────── Dispatch ───────────────────────────
const run = { reddit, seo: () => seo(argv.slice(1).filter(a => !a.startsWith('--')).join(' ')), directories }[cmd]
if (!run) { console.log('Gebruik: node tools/growth.mjs <reddit|seo "zoekwoord"|directories>  [--app=flights]'); process.exit(0) }
run()
