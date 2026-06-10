// Dezelfde waarden als theme.css, maar als TS-constanten — voor inline styles,
// canvas (icon-generator), e-mails en plekken zonder CSS-variabelen.

export const colors = {
  bg: '#f4efe6',
  card: '#fffdf9',
  surface2: '#ede8df',
  ink: '#1a1d2e',
  muted: '#8a8478',
  dim: '#c0bab3',
  brand: '#c14a1f',
  success: '#2d7a3a',
  red: '#c0392b',
  amber: '#b8860b',
  border: 'rgba(26,29,46,0.10)',
  borderHover: 'rgba(26,29,46,0.22)',
} as const

export const fonts = {
  serif: "'Instrument Serif', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const

// App-icon huisstijl (zie icons/make-icon.js): crème vlak, serif letter, rode stip
export const icon = {
  background: '#ede8dd',
  letter: '#1a1d2e',
  dot: '#c14a1f',
} as const
