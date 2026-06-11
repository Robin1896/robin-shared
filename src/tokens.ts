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

// Game-identiteitskleuren (Ludoryn) — één accent per spel, hier gedefinieerd
// en nergens anders. Keys = interne game-ids (routes), commentaar = speelnaam.
export const gameColors = {
  grub:             { accent: '#00C875', dark: '#0A9659' }, // Grub Hunt / Wormenjacht
  qwixx:            { accent: '#FFCA28', dark: '#C79A00' }, // Kriskras
  carcassonne:      { accent: '#66BB6A', dark: '#2E7D32' }, // Basteon
  beverbende:       { accent: '#2EC4B6', dark: '#0D7A73' }, // Flikflak
  'ticket-to-ride': { accent: '#4285F4', dark: '#1A57C2' }, // Traxion / Treinreis
  catan:            { accent: '#FF5252', dark: '#C62828' }, // Kolonis
  wingspan:         { accent: '#4A90D9', dark: '#1F5C99' }, // Vleugels
  rummikub:         { accent: '#FF7043', dark: '#BF360C' },
  bommen:           { accent: '#0088C8', dark: '#005F8C' }, // 1000 Bommen
} as const

export type GameId = keyof typeof gameColors
