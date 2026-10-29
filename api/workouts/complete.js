// POST { workoutId, durationSeconds } marks a workout completed.
import { sql } from '../../lib/server/db.js'
import { allow, body, fail, route } from '../../lib/server/http.js'
import { requireUser } from '../../lib/server/auth.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'POST')) return
  const user = await requireUser(req, res)
  if (!user) return
  const { workoutId, durationSeconds } = body(req)
  const id = Number(workoutId)
  if (!id) return fail(res, 400, 'workoutId is required.')
  const minutes = Math.max(1, Math.round((Number(durationSeconds) || 0) / 60))

  const rows = await sql`
    UPDATE workouts
    SET status = 'completed',
        completed_at = now(),
        started_at = COALESCE(started_at, now()),
        duration_minutes = ${minutes}
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id, status, duration_minutes, completed_at
  `
  if (!rows.length) return fail(res, 404, 'Workout not found.')
  res.status(200).json({ workout: rows[0] })
})
