'use client'

// UI-primitieven in de huisstijl — stylen via components.css (rs-* klassen).
// Importeer in de app-layout:
//   import 'robin-shared/theme.css'
//   import 'robin-shared/components.css'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type BtnVariant = 'primary' | 'outline' | 'heart' | 'icon' | 'link' | 'remove'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  active?: boolean
}

export function Btn({ variant = 'primary', active, className = '', children, ...props }: BtnProps) {
  const cls = [
    'rs-btn',
    variant !== 'primary' ? `rs-btn--${variant}` : '',
    active ? 'rs-active' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <button {...props} className={cls}>
      {children}
    </button>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="rs-label">{children}</p>
}

export function StatusMsg({ error, children }: { error?: boolean; children: ReactNode }) {
  return <p className={`rs-status${error ? ' rs-status--error' : ''}`}>{children}</p>
}

export function Loader({ msg, size = 'md' }: { msg?: string; size?: 'sm' | 'md' }) {
  return (
    <div className={`rs-loader${size === 'sm' ? ' rs-loader--sm' : ''}`}>
      <div className="rs-loader__dots">
        {[0, 200, 400].map(delay => (
          <span key={delay} className="rs-loader__dot" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
      {msg && <p className="rs-loader__msg">{msg}</p>}
    </div>
  )
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`rs-card ${className}`.trim()} style={style}>{children}</div>
}
