import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testApp, signedInAgent, teardown, todayISO } from './helpers.js'

let app
beforeAll(async () => {
  app = await testApp()
})
afterAll(teardown)

const today = todayISO()

describe('GET /api/workouts/today', () => {
  it('generates a workout with 5 exercises and their sets, then returns the same one', async () => {
    const { agent } = await signedInAgent(app)
    const first = await agent.get(`/api/workouts/today?date=${today}`)
    expect(first.status).toBe(200)
    const w = first.body.workout
    expect(w.status).toBe('planned')
    expect(w.exercises).toHaveLength(5)
    for (const e of w.exercises) {
      expect(e.sets).toHaveLength(e.sets_planned)
      expect(e.sets.every((s) => s.completed === false)).toBe(true)
    }
    const second = await agent.get(`/api/workouts/today?date=${today}`)
    expect(second.body.workout.id).toBe(w.id)
    expect(second.body.workout.exercises.map((e) => e.id)).toEqual(w.exercises.map((e) => e.id))
  })

  it('creates a different workout for a different date', async () => {
    const { agent } = await signedInAgent(app)
    const a = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const b = (await agent.get(`/api/workouts/today?date=2026-01-05`)).body.workout
    expect(a.id).not.toBe(b.id)
    expect(b.workout_date).toMatch(/^2026-01-05/)
  })

  it('falls back to a valid date when the query is malformed', async () => {
    const { agent } = await signedInAgent(app)
    const res = await agent.get('/api/workouts/today?date=not-a-date')
    expect(res.status).toBe(200)
  })
})

describe('POST /api/workouts/exercises', () => {
  it('adds an exercise with its sets to today’s workout', async () => {
    const { agent } = await signedInAgent(app)
    const before = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const ids = new Set(before.exercises.map((e) => e.exercise_id))
    const all = (await agent.get('/api/exercises')).body.exercises
    const extra = all.find((e) => !ids.has(e.id))

    const res = await agent.post('/api/workouts/exercises').send({ exerciseId: extra.id, date: today })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ workoutId: before.id, sets: extra.sets, name: extra.name })

    const after = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    expect(after.exercises).toHaveLength(6)
    const added = after.exercises.at(-1)
    expect(added.exercise_id).toBe(extra.id)
    expect(added.sets).toHaveLength(extra.sets)
  })

  it('refuses a duplicate, an unknown exercise and a missing id', async () => {
    const { agent } = await signedInAgent(app)
    const w = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const dup = await agent.post('/api/workouts/exercises').send({ exerciseId: w.exercises[0].exercise_id, date: today })
    expect(dup.status).toBe(409)
    expect((await agent.post('/api/workouts/exercises').send({ exerciseId: 99999, date: today })).status).toBe(404)
    expect((await agent.post('/api/workouts/exercises').send({ date: today })).status).toBe(400)
  })

  it('creates a custom workout when none exists for that date', async () => {
    const { agent } = await signedInAgent(app)
    const ex = (await agent.get('/api/exercises')).body.exercises[0]
    const res = await agent.post('/api/workouts/exercises').send({ exerciseId: ex.id, date: '2026-02-02' })
    expect(res.status).toBe(201)
    const w = (await agent.get('/api/workouts/today?date=2026-02-02')).body.workout
    expect(w.name).toBe('Custom Session')
    expect(w.exercises).toHaveLength(1)
  })

  it('removes an exercise with DELETE', async () => {
    const { agent } = await signedInAgent(app)
    const w = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const res = await agent.delete('/api/workouts/exercises').send({ workoutExerciseId: w.exercises[0].id })
    expect(res.status).toBe(200)
    const after = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    expect(after.exercises).toHaveLength(4)
  })
})

describe('start, sets and complete', () => {
  it('start marks the workout in progress', async () => {
    const { agent } = await signedInAgent(app)
    const w = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const res = await agent.post('/api/workouts/start').send({ workoutId: w.id })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('in_progress')
    expect(res.body.workout.started_at).toBeTruthy()
    expect((await agent.post('/api/workouts/start').send({ workoutId: 999999 })).status).toBe(404)
    expect((await agent.post('/api/workouts/start').send({})).status).toBe(400)
  })

  it('ticks and unticks a set, and ticking starts the workout', async () => {
    const { agent } = await signedInAgent(app)
    const w = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const set = w.exercises[0].sets[0]

    const tick = await agent.post('/api/workouts/sets').send({ setId: set.id, completed: true })
    expect(tick.status).toBe(200)
    let fresh = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    expect(fresh.status).toBe('in_progress')
    expect(fresh.exercises[0].sets[0].completed).toBe(true)

    const untick = await agent.post('/api/workouts/sets').send({ setId: set.id, completed: false })
    expect(untick.status).toBe(200)
    fresh = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    expect(fresh.exercises[0].sets[0].completed).toBe(false)

    expect((await agent.post('/api/workouts/sets').send({ setId: 999999, completed: true })).status).toBe(404)
    expect((await agent.post('/api/workouts/sets').send({})).status).toBe(400)
  })

  it('completes a workout and records the duration in minutes', async () => {
    const { agent } = await signedInAgent(app)
    const w = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const res = await agent.post('/api/workouts/complete').send({ workoutId: w.id, durationSeconds: 1530 })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('completed')
    expect(res.body.workout.duration_minutes).toBe(26)

    const dash = await agent.get(`/api/dashboard?today=${today}&weekStart=${today}`)
    expect(dash.body.streak).toBe(1)
    expect(dash.body.totals.workoutsCompleted).toBe(1)

    const blocked = await agent.post('/api/workouts/exercises').send({ exerciseId: 1, date: today })
    expect(blocked.status).toBe(409)
  })

  it('duration is never below one minute', async () => {
    const { agent } = await signedInAgent(app)
    const w = (await agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const res = await agent.post('/api/workouts/complete').send({ workoutId: w.id, durationSeconds: 3 })
    expect(res.body.workout.duration_minutes).toBe(1)
  })
})

describe('SECURITY: users are isolated', () => {
  it('user B cannot see, tick, add to, start, or complete user A’s workout', async () => {
    const a = await signedInAgent(app, { fullName: 'User A' })
    const b = await signedInAgent(app, { fullName: 'User B' })
    const wa = (await a.agent.get(`/api/workouts/today?date=${today}`)).body.workout
    const wb = (await b.agent.get(`/api/workouts/today?date=${today}`)).body.workout

    expect(wb.id).not.toBe(wa.id)
    const aSetIds = wa.exercises.flatMap((e) => e.sets.map((s) => s.id))
    const bSetIds = wb.exercises.flatMap((e) => e.sets.map((s) => s.id))
    expect(aSetIds.some((id) => bSetIds.includes(id))).toBe(false)

    const tick = await b.agent.post('/api/workouts/sets').send({ setId: aSetIds[0], completed: true })
    expect(tick.status).toBe(404)
    const start = await b.agent.post('/api/workouts/start').send({ workoutId: wa.id })
    expect(start.status).toBe(404)
    const complete = await b.agent.post('/api/workouts/complete').send({ workoutId: wa.id })
    expect(complete.status).toBe(404)
    const remove = await b.agent.delete('/api/workouts/exercises').send({ workoutExerciseId: wa.exercises[0].id })
    expect(remove.status).toBe(404)

    // A's workout is untouched.
    const again = (await a.agent.get(`/api/workouts/today?date=${today}`)).body.workout
    expect(again.status).toBe('planned')
    expect(again.exercises).toHaveLength(5)
    expect(again.exercises.every((e) => e.sets.every((s) => !s.completed))).toBe(true)
  })

  it('user B’s dashboard does not include user A’s workouts', async () => {
    const a = await signedInAgent(app)
    const b = await signedInAgent(app)
    const wa = (await a.agent.get(`/api/workouts/today?date=${today}`)).body.workout
    await a.agent.post('/api/workouts/complete').send({ workoutId: wa.id, durationSeconds: 600 })
    const dashB = (await b.agent.get(`/api/dashboard?today=${today}&weekStart=${today}`)).body
    expect(dashB.streak).toBe(0)
    expect(dashB.totals.workoutsCompleted).toBe(0)
  })
})
