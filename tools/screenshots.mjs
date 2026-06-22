// App Store + social-media screenshot-generator voor alle Robin-apps.
// Maakt per scherm een 1290x2796 (iPhone 6.7") beeld in "fancy" stijl:
// pastel-achtergrond, vette marketing-headline met accentwoord, optionele badge,
// en de échte app-screenshot in een realistisch toestel met Dynamic Island.
//
// Vereist Playwright (chromium):
//   npx playwright install chromium      # eenmalig
//   node tools/screenshots.mjs           # alle apps
//   node tools/screenshots.mjs flights   # één app
//
// Output: ./appstore-screenshots/<app>/<n>-<slug>.png
//
// Pas APPS hieronder aan om schermen/headlines/kleuren te wijzigen.

import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'
import { join } from 'path'

const COLORS = { bg: '#f4efe6', card: '#fffdf9', ink: '#1a1d2e', brand: '#c14a1f', muted: '#8a8478' }
// Pastel-achtergronden (huisstijl-zacht) om per scherm te rouleren.
const PASTELS = ['#f4efe6', '#efebf7', '#e9f0f7', '#e8f3ec', '#f7eee9']

// Device-viewport waarop de app gerenderd wordt (CSS px). 3x scale → scherpe shots.
const DEVICE = { width: 402, height: 874, scale: 3 }
// App Store iPhone 6.7" doel: 1290 x 2796
const FRAME = { width: 1290, height: 2796 }

// helper: datum ~45 dagen vooruit (YYYY-MM-DD) zodat shots niet verouderen
const soon = (() => { const d = new Date(); d.setDate(d.getDate() + 45); return d.toISOString().slice(0, 10) })()

// klik een bottombar-tab op label en wacht
const tab = (label, ms = 3500) => async (page) => {
  await page.click(`button:has-text("${label}")`, { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(ms)
}

export const APPS = {
  flights: {
    baseUrl: 'https://frontend-robin1896s-projects.vercel.app',
    screens: [
      { slug: 'zoek',    headline: 'Niet de goedkoopste.<br>De <b>beste</b> vlucht.', badge: 'Slim sorteren',
        route: `/?from=AMS&to=BCN&date=${soon}`, wait: 7000 },
      { slug: 'flaights', headline: 'Vraag het gewoon<br>aan <b>flAIghts</b>.', badge: 'AI-assistent',
        route: '/', wait: 1500, prepare: tab('flAIghts', 3000) },
      { slug: 'prijswacht', headline: 'Volg de prijs,<br>wij <b>waarschuwen</b>.', badge: 'Prijsalert',
        route: `/?from=AMS&to=BCN&date=${soon}`, wait: 7000,
        prepare: async (page) => { await page.mouse.wheel(0, 360); await page.waitForTimeout(700) } },
    ],
  },
  ludoryn: {
    baseUrl: 'https://ludoryn-web.vercel.app',
    screens: [
      { slug: 'home',  headline: 'Speel <b>bordspellen</b><br>online.', route: '/', wait: 3000 },
      { slug: 'lobby', headline: 'Direct een<br><b>tegenstander</b>.', route: '/lobby?game=grub', wait: 3000 },
    ],
  },
  tripsync: {
    baseUrl: 'https://tripsync-jade.vercel.app',
    screens: [
      { slug: 'home', headline: 'Kies <b>samen</b><br>je bestemming.', route: '/', wait: 3000 },
    ],
  },
  echoo: {
    baseUrl: 'https://echo-omega-umber.vercel.app',
    screens: [
      { slug: 'support', headline: 'Laat je <b>stem</b><br>achter.', route: '/support', wait: 2500 },
    ],
  },
}

function framePage(headline, badge, imgDataUrl, bg, accent) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700;800&display=swap');
    * { margin:0; box-sizing:border-box; }
    body { width:${FRAME.width}px; height:${FRAME.height}px; font-family:'DM Sans',sans-serif;
      display:flex; flex-direction:column; align-items:center; overflow:hidden;
      background:
        radial-gradient(120% 80% at 18% 0%, ${accent}16 0%, transparent 46%),
        radial-gradient(120% 80% at 85% 100%, ${COLORS.ink}12 0%, transparent 46%),
        linear-gradient(165deg, #ffffff 0%, ${bg} 40%, ${bg} 100%); }
    .head { font-weight:800; font-size:88px; line-height:1.06; letter-spacing:-2px; color:${COLORS.ink};
      text-align:center; margin:126px 80px 0; max-width:1120px; }
    .head b { color:${accent}; }
    .badge { display:inline-block; margin-top:36px; padding:15px 32px; border-radius:100px;
      font-weight:700; font-size:31px; letter-spacing:.3px; color:${accent};
      background:#ffffffcc; box-shadow:0 6px 22px ${accent}22; border:2px solid ${accent}2e; }
    .stage { flex:1; display:flex; align-items:center; justify-content:center; width:100%; padding:54px 0 70px; }
    /* realistische iPhone (titanium-rand, uniforme bezel, Dynamic Island, zijknoppen) */
    .device { position:relative; width:884px; padding:16px; border-radius:98px;
      background:linear-gradient(150deg,#40434f,#16181f 36%,#0d0f15 72%,#2c2f39);
      box-shadow:0 72px 145px rgba(26,29,46,.34), 0 10px 28px rgba(26,29,46,.24),
        inset 0 0 0 2px rgba(255,255,255,.07); }
    .screen { position:relative; border-radius:82px; overflow:hidden; background:#000;
      box-shadow:inset 0 0 0 3px #000; }
    .screen img { width:100%; display:block; }
    .island { position:absolute; top:24px; left:50%; transform:translateX(-50%);
      width:118px; height:35px; background:#000; border-radius:20px; z-index:3; }
    .gloss { position:absolute; inset:0; z-index:2; pointer-events:none;
      background:linear-gradient(122deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 24%); }
    .btn { position:absolute; background:linear-gradient(180deg,#23262f,#0d0f15); border-radius:5px; }
    .b-mute { left:-7px; top:208px; width:7px; height:48px; }
    .b-vup  { left:-7px; top:312px; width:7px; height:88px; }
    .b-vdn  { left:-7px; top:420px; width:7px; height:88px; }
    .b-pwr  { right:-7px; top:340px; width:7px; height:140px; }
  </style></head><body>
    <div class="head">${headline}</div>
    ${badge ? `<div style="text-align:center;"><span class="badge">${badge}</span></div>` : ''}
    <div class="stage">
      <div class="device">
        <div class="btn b-mute"></div><div class="btn b-vup"></div>
        <div class="btn b-vdn"></div><div class="btn b-pwr"></div>
        <div class="screen"><div class="island"></div><div class="gloss"></div><img src="${imgDataUrl}"/></div>
      </div>
    </div>
  </body></html>`
}

async function run(only) {
  const browser = await chromium.launch()
  const entries = Object.entries(APPS).filter(([k]) => !only || k === only)

  for (const [app, cfg] of entries) {
    const outDir = join(process.cwd(), 'appstore-screenshots', app)
    mkdirSync(outDir, { recursive: true })
    const dev = await browser.newContext({
      viewport: { width: DEVICE.width, height: DEVICE.height },
      deviceScaleFactor: DEVICE.scale, isMobile: true, hasTouch: true, locale: 'nl-NL',
    })
    let i = 0
    for (const s of cfg.screens) {
      i++
      const page = await dev.newPage()
      try {
        await page.goto(cfg.baseUrl + s.route, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
        await page.waitForTimeout(s.wait ?? 2500)
        if (s.prepare) await s.prepare(page)
        const raw = await page.screenshot()
        const dataUrl = 'data:image/png;base64,' + raw.toString('base64')
        const bg = s.bg ?? PASTELS[(i - 1) % PASTELS.length]
        const accent = s.accent ?? COLORS.brand
        const frame = await dev.newPage()
        await frame.setViewportSize({ width: FRAME.width, height: FRAME.height })
        await frame.setContent(framePage(s.headline, s.badge, dataUrl, bg, accent), { waitUntil: 'networkidle' })
        await frame.waitForTimeout(700)
        const out = join(outDir, `${String(i).padStart(2, '0')}-${s.slug}.png`)
        await frame.screenshot({ path: out })
        await frame.close()
        console.log('✓', app, out)
      } catch (e) {
        console.error('✗', app, s.slug, e.message)
      }
      await page.close()
    }
    await dev.close()
  }
  await browser.close()
}

run(process.argv[2]).catch(e => { console.error(e); process.exit(1) })
