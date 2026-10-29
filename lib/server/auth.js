// JWT + cookie helpers. Server only.
import { SignJWT, jwtVerify } from 'jose'
import { sql } from './db.js'

export const COOKIE_NAME = 'pf_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function secretKey() {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    const err = new Error('JWT_SECRET is missing or too short. Restart the dev server to generate one.')
    err.status = 503
    throw err
  }
  return new TextEncoder().encode(s)
}

export async function signSession(userId) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

export function parseCookies(req) {
  if (req.cookies && typeof req.cookies === 'object') return req.cookies
  const header = req.headers?.cookie
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    try {
      out[k] = decodeURIComponent(v)
    } catch {
      out[k] = v
    }
  }
  return out
}

function cookieString(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : ''
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', cookieString(token, MAX_AGE_SECONDS))
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', cookieString('', 0))
}

export const USER_COLUMNS = 'id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at'

/** Returns the logged-in user row, or null. */
export async function currentUser(req) {
  const token = parseCookies(req)[COOKIE_NAME]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    const id = Number(payload.sub)
    if (!id) return null
    const rows = await sql`SELECT id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at FROM users WHERE id = ${id}`
    return rows[0] || null
  } catch {
    return null
  }
}

/** Like currentUser, but sends a 401 and returns null when logged out. */
export async function requireUser(req, res) {
  const user = await currentUser(req)
  if (!user) {
    res.status(401).json({ error: 'Please log in to continue.' })
    return null
  }
  return user
}
