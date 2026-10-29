// GET ?today=YYYY-MM-DD&weekStart=YYYY-MM-DD  Weekly activity, streaks, goals and totals for the user.
import { sql } from '../lib/server/db.js'
import { allow, dateParam, route } from '../lib/server/http.js'
import { requireUser } from '../lib/server/auth.js'
import { addDays, streaks, weeklyActivity } from '../lib/server/stats.js'

export default route(async (req, res) => {
  if (!allow(req, res, 'GET')) return
  const user = await requireUser(req, res)
  if (!user) return
  const today = dateParam(req, 'today')
  const weekStart = dateParam(req, 'weekStart')
  const weekEnd = addDays(weekStart, 6)

  const week = await sql`
    SELECT workout_date::text AS d, COALESCE(sum(duration_minutes), 0)::int AS minutes, count(*)::int AS workouts
    FROM workouts
    WHERE user_id = ${user.id} AND status = 'completed' AND workout_date BETWEEN ${weekStart} AND ${weekEnd}
    GROUP BY workout_date
  `
  const workoutsThisWeek = week.reduce((a, r) => a + Number(r.workouts), 0)
  const minutesThisWeek = week.reduce((a, r) => a + Number(r.minutes), 0)

  const allDates = await sql`
    SELECT DISTINCT workout_date::text AS d FROM workouts
    WHERE user_id = ${user.id} AND status = 'completed'
  `
  const { current, longest } = streaks(allDates.map((r) => r.d), today)

  const [totals] = await sql`
    SELECT
      (SELECT count(*) FROM workouts WHERE user_id = ${user.id} AND status = 'completed')::int AS workouts_completed,
      (SELECT COALESCE(sum(duration_minutes), 0) FROM workouts WHERE user_id = ${user.id} AND status = 'completed')::int AS minutes_total,
      (SELECT count(*) FROM class_bookings WHERE user_id = ${user.id})::int AS classes_booked
  `

  const goalsHit = (workoutsThisWeek >= user.weekly_goal_workouts ? 1 : 0) + (minutesThisWeek >= user.weekly_goal_minutes ? 1 : 0)

  res.status(200).json({
    weeklyActivity: weeklyActivity(week, weekStart),
    streak: current,
    longestStreak: longest,
    goals: {
      workouts: { current: workoutsThisWeek, target: user.weekly_goal_workouts },
      activeMinutes: { current: minutesThisWeek, target: user.weekly_goal_minutes },
      goalsHit: { current: goalsHit, target: 2 },
    },
    totals: {
      workoutsCompleted: Number(totals.workouts_completed),
      minutesTotal: Number(totals.minutes_total),
      classesBooked: Number(totals.classes_booked),
    },
  })
})
