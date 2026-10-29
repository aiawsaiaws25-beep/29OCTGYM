// Public numbers for the landing page.
import { sql } from '../lib/server/db.js'
import { allow, route } from '../lib/server/http.js'
import { ensureWeekClasses } from '../lib/server/classSchedule.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'GET')) return
  await ensureWeekClasses()
  const rows = await sql`
    SELECT
      (SELECT count(*) FROM users)::int AS members,
      (SELECT count(*) FROM workouts WHERE status = 'completed')::int AS workouts_completed,
      (SELECT count(*) FROM classes
        WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days')::int AS classes_this_week
  `
  const r = rows[0]
  res.status(200).json({ members: r.members, workoutsCompleted: r.workouts_completed, classesThisWeek: r.classes_this_week })
})
