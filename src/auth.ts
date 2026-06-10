// Cookie-gebaseerde auth zoals gebruikt in Ludoryn en Flights (legacy):
//  - wachtwoorden: scrypt met per-wachtwoord salt, opgeslagen als "salt:hash"
//  - sessietoken: base64(JSON payload) + "." + HMAC-SHA256 — in httpOnly-cookie `<app>-token`
//
// Gebruik per app:
//   const auth = makeAuth('ludoryn')
//   auth.hashPassword(pw) / auth.verifyPassword(pw, stored)
//   auth.createToken({ id, username }) / auth.verifyToken(token)
//   auth.COOKIE_NAME / auth.COOKIE_OPTIONS

import crypto from 'crypto'

export interface TokenPayload {
  id: number
  username: string
}

export function makeAuth(app: string, secret?: string) {
  const SECRET = secret ?? process.env.AUTH_SECRET ?? `${app}-default-secret-change-me`

  function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${hash}`
  }

  function verifyPassword(password: string, stored: string): boolean {
    try {
      const [salt, hash] = stored.split(':')
      const derived = crypto.scryptSync(password, salt, 64).toString('hex')
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'))
    } catch {
      return false
    }
  }

  function createToken(payload: TokenPayload): string {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64')
    const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64')
    return `${data}.${sig}`
  }

  function verifyToken(token: string): TokenPayload | null {
    try {
      const dot = token.lastIndexOf('.')
      const data = token.slice(0, dot)
      const sig = token.slice(dot + 1)
      const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64')
      if (sig !== expected) return null
      return JSON.parse(Buffer.from(data, 'base64').toString())
    } catch {
      return null
    }
  }

  return {
    hashPassword,
    verifyPassword,
    createToken,
    verifyToken,
    COOKIE_NAME: `${app}-token`,
    COOKIE_OPTIONS: {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dagen
    },
  }
}
