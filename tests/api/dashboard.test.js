import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testApp, signedInAgent, teardown, insertCompletedWorkout } from './helpers.js'

let app
beforeAll(async () => {
  app = await testApp()
})
afterAll(teardown)

// Fixed dates so the tests never depend on the real clock. 2026-10-14 is a Wednesday.
const TODAY = '2026-10-14'
const WEEK_START = '2026-10-12'
const dash = (agent) => agent.get(`/api/dashboard?today=${TODAY}&weekStart=${WEEK_START}`).then((r) => r.body)

describe('GET /api/dashboard', () => {
  it('starts at zero with a 7-day chart and well-formed rings', async () => {
    const { agent, user } = await signedInAgent(app, { weeklyGoalWorkouts: 4, weeklyGoalMinutes: 150 })
    const d = await dash(agent)
    expect(d.streak).toBe(0)
    expect(d.longestStreak).toBe(0)
    expect(d.weeklyActivity).toHaveLength(7)
    expect(d.weeklyActivity.map((x) => x.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(d.weeklyActivity[0].date).toBe(WEEK_START)
    expect(d.weeklyActivity.every((x) => x.minutes === 0)).toBe(true)
    expect(d.goals.workouts).toEqual({ current: 0, target: user.weekly_goal_workouts })
    expect(d.goals.activeMinutes).toEqual({ current: 0, target: 150 })
    expect(d.goals.goalsHit).toEqual({ current: 0, target: 2 })
    expect(d.totals).toEqual({ workoutsCompleted: 0, minutesTotal: 0, classesBooked: 0 })
  })

  it('3 days in a row ending today gives streak 3', async () => {
    const { agent, user } = await signedInAgent(app)
    for (const date of ['2026-10-12', '2026-10-13', '2026-10-14']) await insertCompletedWorkout(user.id, date, 40)
    const d = await dash(agent)
    expect(d.streak).toBe(3)
    expect(d.longestStreak).toBe(3)
    expect(d.weeklyActivity.slice(0, 3).map((x) => x.minutes)).toEqual([40, 40, 40])
    expect(d.goals.workouts.current).toBe(3)
    expect(d.goals.activeMinutes.current).toBe(120)
  })

  it('a missed day resets the current streak but keeps the longest', async () => {
    const { agent, user } = await signedInAgent(app)
    for (const date of ['2026-10-08', '2026-10-09', '2026-10-10']) await insertCompletedWorkout(user.id, date)
    // 2026-10-11 missed, then 12, 13 and 14 missed too (today is the 14th) -> streak 0
    let d = await dash(agent)
    expect(d.streak).toBe(0)
    expect(d.longestStreak).toBe(3)
    // workout on the 13th (yesterday) but not today -> streak still alive at 1
    await insertCompletedWorkout(user.id, '2026-10-13')
    d = await dash(agent)
    expect(d.streak).toBe(1)
  })

  it('a workout today plus yesterday gives streak 2', async () => {
    const { agent, user } = await signedInAgent(app)
    await insertCompletedWorkout(user.id, '2026-10-13', 25)
    await insertCompletedWorkout(user.id, '2026-10-14', 35)
    const d = await dash(agent)
    expect(d.streak).toBe(2)
    expect(d.goals.activeMinutes.current).toBe(60)
  })

  it('only counts completed workouts and only this week in the chart', async () => {
    const { agent, user } = await signedInAgent(app)
    await insertCompletedWorkout(user.id, '2026-10-05', 50) // last week
    await insertCompletedWorkout(user.id, '2026-10-14', 20)
    const { sql } = await import('../../lib/server/db.js')
    await sql`INSERT INTO workouts (user_id, name, workout_date, status) VALUES (${user.id}, ${'Planned'}, ${'2026-10-15'}, ${'planned'})`
    const d = await dash(agent)
    expect(d.weeklyActivity.reduce((a, x) => a + x.minutes, 0)).toBe(20)
    expect(d.totals.workoutsCompleted).toBe(2)
    expect(d.totals.minutesTotal).toBe(70)
    expect(d.streak).toBe(1)
  })

  it('goals hit counts each weekly goal reached and rings can exceed targets without breaking', async () => {
    const { agent, user } = await signedInAgent(app, { weeklyGoalWorkouts: 2, weeklyGoalMinutes: 30 })
    for (const date of ['2026-10-12', '2026-10-13', '2026-10-14']) await insertCompletedWorkout(user.id, date, 45)
    const d = await dash(agent)
    expect(d.goals.goalsHit).toEqual({ current: 2, target: 2 })
    // 3 workouts against a goal of 2: the API reports raw numbers, the ring clamps to 100%.
    expect(d.goals.workouts.current).toBeGreaterThan(d.goals.workouts.target)
    expect(Number.isFinite(d.goals.workouts.current / d.goals.workouts.target)).toBe(true)
  })

  it('counts class bookings in totals', async () => {
    const { agent } = await signedInAgent(app)
    const cls = (await agent.get('/api/classes')).body.classes[0]
    await agent.post('/api/classes/book').send({ classId: cls.id })
    const d = await dash(agent)
    expect(d.totals.classesBooked).toBe(1)
  })
})
