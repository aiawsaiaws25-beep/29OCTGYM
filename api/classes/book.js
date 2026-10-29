// POST { classId } toggles a booking for the logged-in user.
import { sql } from '../../lib/server/db.js'
import { allow, body, fail, route } from '../../lib/server/http.js'
import { requireUser } from '../../lib/server/auth.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'POST')) return
  const user = await requireUser(req, res)
  if (!user) return
  const classId = Number(body(req).classId)
  if (!classId) return fail(res, 400, 'classId is required.')

  const rows = await sql`
    SELECT c.id, c.title, c.capacity,
           (SELECT count(*) FROM class_bookings b WHERE b.class_id = c.id)::int AS booked_count,
           EXISTS (SELECT 1 FROM class_bookings b WHERE b.class_id = c.id AND b.user_id = ${user.id}) AS booked
    FROM classes c WHERE c.id = ${classId}
  `
  const cls = rows[0]
  if (!cls) return fail(res, 404, 'That class no longer exists.')

  if (cls.booked) {
    await sql`DELETE FROM class_bookings WHERE class_id = ${classId} AND user_id = ${user.id}`
    return res.status(200).json({ booked: false, spots_left: cls.capacity - cls.booked_count + 1 })
  }
  if (cls.booked_count >= cls.capacity) return fail(res, 409, 'This class is full. Try another time.')

  await sql`INSERT INTO class_bookings (user_id, class_id) VALUES (${user.id}, ${classId}) ON CONFLICT DO NOTHING`
  res.status(201).json({ booked: true, spots_left: cls.capacity - cls.booked_count - 1 })
})
