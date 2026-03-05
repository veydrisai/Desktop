import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { SESSION_COOKIE } from './sessionCookie'

const SESSION_SECRET = process.env.SESSION_SECRET || 'voice-roi-dev-secret-change-in-production'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = {
  userId: string
  email: string
  role: 'admin' | 'client'
  onboardingComplete: boolean
  allowedModules?: string[]
}

function sign(value: string): string {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('hex')
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHmac('sha256', SESSION_SECRET).update(salt + password).digest('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = createHmac('sha256', SESSION_SECRET).update(salt + password).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export function createSessionCookie(payload: SessionPayload): string {
  const data = JSON.stringify(payload)
  const encoded = Buffer.from(data, 'utf-8').toString('base64url')
  const sig = sign(encoded)
  return `${encoded}.${sig}`
}

const debugLog = (msg: string) => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG === '1' || process.env.DEBUG === 'true') {
    console.log(`[auth] ${msg}`)
  }
}

export function parseSessionCookie(cookie: string | undefined): SessionPayload | null {
  if (!cookie) {
    debugLog('cookie missing')
    return null
  }
  const [encoded, sig] = cookie.split('.')
  if (!encoded || !sig || sign(encoded) !== sig) {
    debugLog('cookie invalid (bad signature or format)')
    return null
  }
  try {
    const data = Buffer.from(encoded, 'base64url').toString('utf-8')
    return JSON.parse(data) as SessionPayload
  } catch {
    debugLog('cookie invalid (decode/parse failed)')
    return null
  }
}

export function getSessionCookieSpec(): { name: string; maxAge: number; httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string } {
  return {
    name: SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
}

export { SESSION_COOKIE } from './sessionCookie'
