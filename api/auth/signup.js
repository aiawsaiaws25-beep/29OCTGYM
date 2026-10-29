import bcrypt from 'bcryptjs'
import { sql } from '../../lib/server/db.js'
import { allow, body, fail, route } from '../../lib/server/http.js'
import { signSession, setSessionCookie } from '../../lib/server/auth.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default route(async (req, res) => {
  if (!allow(req, res, 'POST')) return
  const { email, password, fullName, weeklyGoalWorkouts, weeklyGoalMinutes } = body(req)

  const cleanEmail = String(email || '').trim().toLowerCase()
  const name = String(fullName || '').trim()
  const goalWorkouts = Number(weeklyGoalWorkouts) || 4
  const goalMinutes = Number(weeklyGoalMinutes) || 150

  if (!EMAIL_RE.test(cleanEmail)) return fail(res, 400, 'Please enter a valid email address.')
  if (!password || String(password).length < 8) return fail(res, 400, 'Password must be at least 8 characters.')
  if (name.length < 2) return fail(res, 400, 'Please tell us your name.')
  if (goalWorkouts < 1 || goalWorkouts > 14) return fail(res, 400, 'Weekly workouts goal must be between 1 and 14.')
  if (goalMinutes < 10 || goalMinutes > 2000) return fail(res, 400, 'Weekly minutes goal must be between 10 and 2000.')

  const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`
  if (existing.length) return fail(res, 409, 'An account with that email already exists. Try logging in.')

  const passwordHash = await bcrypt.hash(String(password), 10)
  const rows = await sql`
    INSERT INTO users (email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes)
    VALUES (${cleanEmail}, ${passwordHash}, ${name}, ${goalWorkouts}, ${goalMinutes})
    RETURNING id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at
  `
  const user = rows[0]
  setSessionCookie(res, await signSession(user.id))
  res.status(201).json({ user })
})
