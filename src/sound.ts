// Gedeelde Web Audio geluids-engine voor alle apps. Combineert de ASMR-clicks
// (Ludoryn) en de beep-effecten (TripSync). Geen samples — alles gesynthetiseerd.
//
// Gebruik:
//   import { initSound, playClick, setMuted } from 'robin-shared/sound'
//   initSound('ludoryn')   // mute-voorkeur onder <app>_muted in localStorage

let ctx: AudioContext | null = null
let muted = false
let muteKey = 'rs_muted'

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
  }
  return ctx
}

function resume(): AudioContext | null {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
  return c
}

// ── beep-primitief (TripSync-stijl) ─────────────────────────────────────────
function beep(freq: number, duration: number, gain = 0.18, type: OscillatorType = 'sine') {
  if (muted) return
  const ac = resume()
  if (!ac) return
  const run = () => {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.connect(g); g.connect(ac.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ac.currentTime)
    g.gain.setValueAtTime(gain, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
  }
  if (ac.state === 'suspended') ac.resume().then(run).catch(() => {})
  else run()
}

// ── ASMR-clicks (Ludoryn-stijl) ─────────────────────────────────────────────
export function playClick() {
  if (muted) return
  const c = resume(); if (!c) return
  const t = c.currentTime
  const osc = c.createOscillator(), gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(420, t)
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.06)
  gain.gain.setValueAtTime(0.18, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(gain); gain.connect(c.destination)
  osc.start(t); osc.stop(t + 0.09)
  const bufSize = Math.floor(c.sampleRate * 0.04)
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.06
  const src = c.createBufferSource(); src.buffer = buf
  const ng = c.createGain()
  ng.gain.setValueAtTime(0.12, t)
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
  src.connect(ng); ng.connect(c.destination); src.start(t)
}

export function playPress() {
  if (muted) return
  const c = resume(); if (!c) return
  const t = c.currentTime
  const osc = c.createOscillator(), gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(260, t)
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.05)
  gain.gain.setValueAtTime(0.1, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
  osc.connect(gain); gain.connect(c.destination)
  osc.start(t); osc.stop(t + 0.07)
}

export function playTick() {
  if (muted) return
  const c = resume(); if (!c) return
  const t = c.currentTime
  const osc = c.createOscillator(), gain = c.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(600, t)
  osc.frequency.exponentialRampToValueAtTime(350, t + 0.04)
  gain.gain.setValueAtTime(0.14, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  osc.connect(gain); gain.connect(c.destination)
  osc.start(t); osc.stop(t + 0.06)
}

export function playNav() {
  if (muted) return
  const c = resume(); if (!c) return
  const t = c.currentTime
  const bufSize = Math.floor(c.sampleRate * 0.07)
  const buf = c.createBuffer(1, bufSize, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource(); src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1800, t)
  filter.frequency.exponentialRampToValueAtTime(600, t + 0.07)
  filter.Q.value = 1.5
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.07, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  src.connect(filter); filter.connect(gain); gain.connect(c.destination)
  src.start(t)
}

// ── melodische effecten ─────────────────────────────────────────────────────
export function playSuccess() {
  beep(520, 0.08, 0.12)
  setTimeout(() => beep(660, 0.1, 0.12), 80)
}

export function playWinner() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((n, i) => setTimeout(() => beep(n, 0.25, 0.18), i * 120))
  setTimeout(() => {
    ;[1047, 1175, 1319, 1047].forEach((n, i) => setTimeout(() => beep(n, 0.2, 0.16), i * 100))
  }, 600)
}

export function playAlarm() {
  beep(880, 0.15, 0.2, 'square')
  setTimeout(() => beep(660, 0.2, 0.2, 'square'), 150)
}

// ── mute ────────────────────────────────────────────────────────────────────
export function isMuted(): boolean { return muted }

export function setMuted(val: boolean) {
  muted = val
  if (typeof window !== 'undefined') localStorage.setItem(muteKey, val ? '1' : '0')
}

export function initSound(appKey?: string) {
  if (appKey) muteKey = `${appKey}_muted`
  if (typeof window !== 'undefined') muted = localStorage.getItem(muteKey) === '1'
}
