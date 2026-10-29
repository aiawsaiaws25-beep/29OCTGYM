// Pure date / streak helpers. No database access, so they are easy to unit test.

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MS_DAY = 86400000

/** Adds n days to a YYYY-MM-DD string. */
export function addDays(iso, n) {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * MS_DAY).toISOString().slice(0, 10)
}

/**
 * dates: array of YYYY-MM-DD strings (any order, duplicates ok) on which a workout was completed.
 * today: YYYY-MM-DD. A streak is alive if it includes today or yesterday.
 */
export function streaks(dates, today) {
  const unique = [...new Set(dates)].sort()
  const set = new Set(unique)

  let current = 0
  let cursor = set.has(today) ? today : addDays(today, -1)
  while (set.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  let longest = 0
  let run = 0
  let prev = null
  for (const d of unique) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }
  return { current, longest }
}

/**
 * rows: [{ d: 'YYYY-MM-DD', minutes, workouts }] for the week.
 * Returns exactly 7 entries Mon..Sun starting at weekStart.
 */
export function weeklyActivity(rows, weekStart) {
  const byDate = new Map(rows.map((r) => [r.d, r]))
  return DAY_LABELS.map((day, i) => {
    const date = addDays(weekStart, i)
    return { day, date, minutes: Number(byDate.get(date)?.minutes ?? 0) }
  })
}

/** Share of a goal in [0, 1]. Never NaN, never above 1. */
export function goalShare(current, target) {
  const c = Number(current)
  const t = Number(target)
  if (!Number.isFinite(c) || !Number.isFinite(t) || t <= 0) return 0
  return Math.min(1, Math.max(0, c / t))
}
