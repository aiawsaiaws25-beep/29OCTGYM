// GET ?date=YYYY-MM-DD  Returns today's workout for the user, generating one if none exists.
import { sql } from '../../lib/server/db.js'
import { allow, dateParam, route } from '../../lib/server/http.js'
import { requireUser } from '../../lib/server/auth.js'

// Focus rotation indexed by JS getDay() (0 = Sunday).
const ROTATION = [
  { groups: ['Cardio', 'Core'], name: 'Engine Day · Conditioning' },
  { groups: ['Chest', 'Arms'], name: 'Push Day · Power' },
  { groups: ['Back', 'Core'], name: 'Pull Day · Strength' },
  { groups: ['Legs', 'Core'], name: 'Leg Day · Foundation' },
  { groups: ['Chest', 'Back'], name: 'Upper Body · Volume' },
  { groups: ['Legs', 'Arms'], name: 'Lower & Arms · Pump' },
  { groups: ['Cardio', 'Core'], name: 'Sweat Session · Cardio' },
]

async function loadWorkout(workoutId) {
  const [workout] = await sql`
    SELECT id, name, workout_date, status, duration_minutes, started_at, completed_at
    FROM workouts WHERE id = ${workoutId}
  `
  const rows = await sql`
    SELECT we.id AS workout_exercise_id, we.order_index,
           e.id AS exercise_id, e.name, e.muscle_group, e.sets, e.reps, e.difficulty, e.rest_seconds, e.description,
           s.id AS set_id, s.set_number, s.completed
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN workout_sets s ON s.workout_exercise_id = we.id
    WHERE we.workout_id = ${workoutId}
    ORDER BY we.order_index, s.set_number
  `
  const byExercise = new Map()
  for (const r of rows) {
    if (!byExercise.has(r.workout_exercise_id)) {
      byExercise.set(r.workout_exercise_id, {
        id: r.workout_exercise_id,
        exercise_id: r.exercise_id,
        name: r.name,
        muscle_group: r.muscle_group,
        sets_planned: r.sets,
        reps: r.reps,
        difficulty: r.difficulty,
        rest_seconds: r.rest_seconds,
        description: r.description,
        sets: [],
      })
    }
    if (r.set_id) byExercise.get(r.workout_exercise_id).sets.push({ id: r.set_id, set_number: r.set_number, completed: r.completed })
  }
  return { ...workout, exercises: [...byExercise.values()] }
}

async function generate(userId, date) {
  const dayIdx = new Date(`${date}T12:00:00Z`).getUTCDay()
  const plan = ROTATION[dayIdx]
  const [g1, g2] = plan.groups
  const first = await sql`SELECT id, sets FROM exercises WHERE muscle_group = ${g1} ORDER BY random() LIMIT 3`
  const second = await sql`SELECT id, sets FROM exercises WHERE muscle_group = ${g2} ORDER BY random() LIMIT 2`
  const picks = [...first, ...second]

  const inserted = await sql`
    INSERT INTO workouts (user_id, name, workout_date)
    VALUES (${userId}, ${plan.name}, ${date})
    ON CONFLICT (user_id, workout_date) DO NOTHING
    RETURNING id
  `
  if (!inserted.length) {
    // Another request created it first.
    const [existing] = await sql`SELECT id FROM workouts WHERE user_id = ${userId} AND workout_date = ${date}`
    return existing.id
  }
  const workoutId = inserted[0].id
  for (let i = 0; i < picks.length; i++) {
    const [we] = await sql`
      INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
      VALUES (${workoutId}, ${picks[i].id}, ${i}) RETURNING id
    `
    for (let n = 1; n <= picks[i].sets; n++) {
      await sql`INSERT INTO workout_sets (workout_exercise_id, set_number) VALUES (${we.id}, ${n})`
    }
  }
  return workoutId
}

export default route(async (req, res) => {
  if (!allow(req, res, 'GET')) return
  const user = await requireUser(req, res)
  if (!user) return
  const date = dateParam(req, 'date')

  const existing = await sql`SELECT id FROM workouts WHERE user_id = ${user.id} AND workout_date = ${date}`
  const workoutId = existing.length ? existing[0].id : await generate(user.id, date)
  const workout = await loadWorkout(workoutId)
  res.status(200).json({ workout })
})
