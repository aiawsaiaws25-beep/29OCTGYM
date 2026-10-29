import bcrypt from 'bcryptjs'
import { sql } from '../../lib/server/db.js'
import { allow, body, fail, route } from '../../lib/server/http.js'
import { signSession, setSessionCookie } from '../../lib/server/auth.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'POST')) return
  const { email, password } = body(req)
  const cleanEmail = String(email || '').trim().toLowerCase()
  if (!cleanEmail || !password) return fail(res, 400, 'Email and password are required.')

  const rows = await sql`
    SELECT id, email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at
    FROM users WHERE email = ${cleanEmail}
  `
  const row = rows[0]
  const ok = row && (await bcrypt.compare(String(password), row.password_hash))
  if (!ok) return fail(res, 401, 'Wrong email or password. Give it another go.')

  const { password_hash, ...user } = row
  void password_hash
  setSessionCookie(res, await signSession(user.id))
  res.status(200).json({ user })
})
