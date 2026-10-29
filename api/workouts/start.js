// POST { workoutId } marks a planned workout as in progress.
import { sql } from '../../lib/server/db.js'
import { allow, body, fail, route } from '../../lib/server/http.js'
import { requireUser } from '../../lib/server/auth.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'POST')) return
  const user = await requireUser(req, res)
  if (!user) return
  const id = Number(body(req).workoutId)
  if (!id) return fail(res, 400, 'workoutId is required.')

  const rows = await sql`
    UPDATE workouts
    SET status = CASE WHEN status = 'completed' THEN status ELSE 'in_progress' END,
        started_at = COALESCE(started_at, now())
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id, status, started_at
  `
  if (!rows.length) return fail(res, 404, 'Workout not found.')
  res.status(200).json({ workout: rows[0] })
})
