// App Store + social-media screenshot-generator voor alle Robin-apps.
// Maakt per scherm een 1290x2796 (iPhone 6.7") beeld: huisstijl-achtergrond,
// marketing-caption bovenaan, app-screenshot in een telefoon-mockup eronder.
//
// Vereist Playwright (chromium). Draai vanuit een repo die @playwright/test heeft:
//   node tools/screenshots.mjs            # alle apps
//   node tools/screenshots.mjs flights    # één app
//
// Output: ./appstore-screenshots/<app>/<n>-<slug>.png
//
// Pas APPS hieronder aan om schermen/captions te wijzigen.

import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const COLORS = { bg: '#f4efe6', card: '#fffdf9', ink: '#1a1d2e', brand: '#c14a1f', muted: '#8a8478' }

// Device-viewport waarop de app gerenderd wordt (CSS px). 3x scale → scherpe shots.
const DEVICE = { width: 402, height: 874, scale: 3 }
// App Store iPhone 6.7" doel: 1290 x 2796
const FRAME = { width: 1290, height: 2796 }

export const APPS = {
  flights: {
    baseUrl: 'https://frontend-robin1896s-projects.vercel.app',
    accent: COLORS.brand,
    screens: [
      { slug: 'zoek',      caption: 'Vind de goedkoopste vlucht', route: '/', wait: 3500 },
      { slug: 'ontdek',    caption: 'Ontdek waar je heen kunt',   route: '/', wait: 3500 },
    ],
  },
  ludoryn: {
    baseUrl: 'https://ludoryn-web.vercel.app',
    accent: COLORS.brand,
    screens: [
      { slug: 'home',  caption: 'Speel bordspellen online',     route: '/', wait: 3000 },
      { slug: 'lobby', caption: 'Direct een tegenstander',      route: '/lobby?game=grub', wait: 3000 },
    ],
  },
  tripsync: {
    baseUrl: 'https://tripsync-jade.vercel.app',
    accent: COLORS.brand,
    screens: [
      { slug: 'home', caption: 'Kies samen je bestemming', route: '/', wait: 3000 },
    ],
  },
  echoo: {
    baseUrl: 'https://echo-omega-umber.vercel.app',
    accent: COLORS.brand,
    screens: [
      { slug: 'support', caption: 'Laat je stem achter waar je was', route: '/support', wait: 2500 },
    ],
  },
}

function framePage(caption, imgDataUrl, accent) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=DM+Sans:wght@500;700&display=swap');
    * { margin:0; box-sizing:border-box; }
    body { width:${FRAME.width}px; height:${FRAME.height}px; background:${COLORS.bg};
      display:flex; flex-direction:column; align-items:center; overflow:hidden;
      background-image:radial-gradient(circle at 20% 8%, rgba(193,74,31,.07) 0%, transparent 42%),
        radial-gradient(circle at 82% 92%, rgba(26,29,46,.05) 0%, transparent 42%); }
    .cap { font-family:'Instrument Serif',serif; font-style:italic; font-size:96px; color:${COLORS.ink};
      text-align:center; line-height:1.08; margin:150px 90px 70px; max-width:1050px; }
    .cap b { color:${accent}; font-style:normal; }
    .phone { width:1080px; border-radius:64px; overflow:hidden; box-shadow:0 50px 120px rgba(26,29,46,.22);
      border:14px solid ${COLORS.ink}; background:${COLORS.ink}; }
    .phone img { width:100%; display:block; }
  </style></head><body>
    <div class="cap">${caption}</div>
    <div class="phone"><img src="${imgDataUrl}"/></div>
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
        const raw = await page.screenshot()
        const dataUrl = 'data:image/png;base64,' + raw.toString('base64')
        const frame = await dev.newPage()
        await frame.setViewportSize({ width: FRAME.width, height: FRAME.height })
        await frame.setContent(framePage(s.caption, dataUrl, cfg.accent), { waitUntil: 'networkidle' })
        await frame.waitForTimeout(600)
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
