// GET /api/exercises?group=Chest  Exercise library, optionally filtered by muscle group.
import { sql } from '../lib/server/db.js'
import { allow, fail, route } from '../lib/server/http.js'

export const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export default route(async (req, res) => {
  if (!allow(req, res, 'GET')) return
  const group = req.query?.group
  if (group && group !== 'All' && !MUSCLE_GROUPS.includes(group)) {
    return fail(res, 400, `Unknown muscle group. Use one of: ${MUSCLE_GROUPS.join(', ')}.`)
  }
  const exercises =
    group && group !== 'All'
      ? await sql`
          SELECT id, name, muscle_group, sets, reps, difficulty, rest_seconds, description
          FROM exercises WHERE muscle_group = ${group} ORDER BY difficulty, name`
      : await sql`
          SELECT id, name, muscle_group, sets, reps, difficulty, rest_seconds, description
          FROM exercises ORDER BY muscle_group, difficulty, name`
  res.status(200).json({ exercises })
})
