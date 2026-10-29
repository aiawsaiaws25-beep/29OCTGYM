import { sql } from '../../lib/server/db.js'
import { allow, route } from '../../lib/server/http.js'
import { currentUser } from '../../lib/server/auth.js'
import { ensureWeekClasses } from '../../lib/server/classSchedule.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'GET')) return
  await ensureWeekClasses()
  const user = await currentUser(req)
  const userId = user?.id ?? 0
  const classes = await sql`
    SELECT c.id, c.title, c.category, c.coach_name, c.start_time, c.duration_minutes, c.capacity, c.intensity,
           (SELECT count(*) FROM class_bookings b WHERE b.class_id = c.id)::int AS booked_count,
           EXISTS (SELECT 1 FROM class_bookings b WHERE b.class_id = c.id AND b.user_id = ${userId}) AS booked
    FROM classes c
    WHERE c.start_time >= date_trunc('week', now()) AND c.start_time < date_trunc('week', now()) + interval '7 days'
    ORDER BY c.start_time
  `
  res.status(200).json({
    classes: classes.map((c) => ({ ...c, spots_left: Math.max(0, c.capacity - c.booked_count) })),
  })
})
