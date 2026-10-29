// POST { exerciseId, date? }  Adds an exercise (with its sets) to the user's workout for that day.
// DELETE { workoutExerciseId }  Removes an exercise from the workout.
import { sql } from '../../lib/server/db.js'
import { allow, body, dateParam, fail, route } from '../../lib/server/http.js'
import { requireUser } from '../../lib/server/auth.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'POST', 'DELETE')) return
  const user = await requireUser(req, res)
  if (!user) return
  const b = body(req)

  if (req.method === 'DELETE') {
    const weId = Number(b.workoutExerciseId)
    if (!weId) return fail(res, 400, 'workoutExerciseId is required.')
    const rows = await sql`
      DELETE FROM workout_exercises we
      USING workouts w
      WHERE we.id = ${weId} AND w.id = we.workout_id AND w.user_id = ${user.id} AND w.status <> 'completed'
      RETURNING we.id
    `
    if (!rows.length) return fail(res, 404, 'Exercise not found in an open workout.')
    return res.status(200).json({ ok: true })
  }

  const exerciseId = Number(b.exerciseId)
  if (!exerciseId) return fail(res, 400, 'exerciseId is required.')
  const date = typeof b.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : dateParam(req, 'date')

  const [exercise] = await sql`SELECT id, name, sets FROM exercises WHERE id = ${exerciseId}`
  if (!exercise) return fail(res, 404, 'That exercise does not exist.')

  let [workout] = await sql`SELECT id, status FROM workouts WHERE user_id = ${user.id} AND workout_date = ${date}`
  if (!workout) {
    const inserted = await sql`
      INSERT INTO workouts (user_id, name, workout_date) VALUES (${user.id}, ${'Custom Session'}, ${date})
      ON CONFLICT (user_id, workout_date) DO NOTHING RETURNING id, status
    `
    workout = inserted[0] || (await sql`SELECT id, status FROM workouts WHERE user_id = ${user.id} AND workout_date = ${date}`)[0]
  }
  if (workout.status === 'completed') return fail(res, 409, 'Today’s workout is already complete. Come back tomorrow!')

  const dup = await sql`SELECT id FROM workout_exercises WHERE workout_id = ${workout.id} AND exercise_id = ${exerciseId}`
  if (dup.length) return fail(res, 409, `${exercise.name} is already in today’s workout.`)

  const [{ next }] = await sql`SELECT COALESCE(max(order_index), -1) + 1 AS next FROM workout_exercises WHERE workout_id = ${workout.id}`
  const [we] = await sql`
    INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
    VALUES (${workout.id}, ${exerciseId}, ${Number(next)}) RETURNING id
  `
  for (let n = 1; n <= exercise.sets; n++) {
    await sql`INSERT INTO workout_sets (workout_exercise_id, set_number) VALUES (${we.id}, ${n})`
  }
  res.status(201).json({ workoutId: workout.id, workoutExerciseId: we.id, sets: exercise.sets, name: exercise.name })
})
