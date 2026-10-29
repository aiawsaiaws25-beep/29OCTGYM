// POST { setId, completed } ticks or unticks a set. Marks the workout in_progress on the first tick.
import { sql } from '../../lib/server/db.js'
import { allow, body, fail, route } from '../../lib/server/http.js'
import { requireUser } from '../../lib/server/auth.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'POST')) return
  const user = await requireUser(req, res)
  if (!user) return
  const { setId, completed } = body(req)
  const id = Number(setId)
  if (!id) return fail(res, 400, 'setId is required.')
  const done = Boolean(completed)

  const rows = await sql`
    UPDATE workout_sets s
    SET completed = ${done}, completed_at = CASE WHEN ${done} THEN now() ELSE NULL END
    FROM workout_exercises we
    JOIN workouts w ON w.id = we.workout_id
    WHERE s.id = ${id} AND we.id = s.workout_exercise_id AND w.user_id = ${user.id}
    RETURNING w.id AS workout_id
  `
  if (!rows.length) return fail(res, 404, 'That set was not found.')
  const workoutId = rows[0].workout_id

  if (done) {
    await sql`
      UPDATE workouts SET status = 'in_progress', started_at = COALESCE(started_at, now())
      WHERE id = ${workoutId} AND status = 'planned'
    `
  }
  res.status(200).json({ ok: true, workoutId })
})
