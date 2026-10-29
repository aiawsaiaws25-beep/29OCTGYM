// Weekly class template. Classes are generated for the current week on demand,
// so the schedule never runs dry. Matches db/seed.sql.
import { sql } from './db.js'

export const WEEKLY_CLASSES = [
  { title: 'Sunrise Yoga', category: 'Yoga', coach: 'Maya Kim', day: 0, time: '06:30', duration: 60, capacity: 20, intensity: 1 },
  { title: 'HIIT Blast', category: 'HIIT', coach: 'Dre Watts', day: 0, time: '18:00', duration: 45, capacity: 16, intensity: 3 },
  { title: 'Spin Express', category: 'Spin', coach: 'Lena Park', day: 1, time: '07:00', duration: 30, capacity: 24, intensity: 2 },
  { title: 'Boxing Fundamentals', category: 'Boxing', coach: 'Marco Diaz', day: 1, time: '19:00', duration: 60, capacity: 14, intensity: 3 },
  { title: 'Barbell Strength', category: 'Strength', coach: 'Sam Okafor', day: 2, time: '12:15', duration: 60, capacity: 12, intensity: 2 },
  { title: 'Spin & Core', category: 'Spin', coach: 'Lena Park', day: 2, time: '18:30', duration: 45, capacity: 24, intensity: 2 },
  { title: 'HIIT 360', category: 'HIIT', coach: 'Dre Watts', day: 3, time: '06:45', duration: 40, capacity: 16, intensity: 3 },
  { title: 'Boxing Sparring', category: 'Boxing', coach: 'Marco Diaz', day: 3, time: '19:30', duration: 60, capacity: 12, intensity: 3 },
  { title: 'Flow & Restore', category: 'Yoga', coach: 'Maya Kim', day: 4, time: '17:30', duration: 60, capacity: 20, intensity: 1 },
  { title: 'Weekend Strength', category: 'Strength', coach: 'Sam Okafor', day: 5, time: '09:30', duration: 60, capacity: 12, intensity: 2 },
]

/** Inserts this week's classes if the week has none yet. Safe to call on every request. */
export async function ensureWeekClasses() {
  const [{ n }] = await sql`
    SELECT count(*)::int AS n FROM classes
    WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days'
  `
  if (Number(n) > 0) return false
  for (const c of WEEKLY_CLASSES) {
    const offset = `${c.day} day ${c.time}`
    await sql`
      INSERT INTO classes (title, category, coach_name, start_time, duration_minutes, capacity, intensity)
      VALUES (${c.title}, ${c.category}, ${c.coach}, date_trunc('week', now()) + ${offset}::interval, ${c.duration}, ${c.capacity}, ${c.intensity})
      ON CONFLICT (title, start_time) DO NOTHING
    `
  }
  return true
}
