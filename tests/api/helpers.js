import request from 'supertest'
import { createApp } from '../../server/app.js'
import { runSetup } from '../../db/run-setup.js'
import { sql, closeDb } from '../../lib/server/db.js'

export const TEST_PASSWORD = 'test-pass-123456'
let counter = 0

export function uniqueEmail(tag = 'user') {
  counter++
  return `e2e-${tag}-${Date.now()}-${counter}@pulsefit.test`
}

/** Creates the app on a fresh in-memory database with schema + seed applied. */
export async function testApp() {
  await runSetup()
  const app = await createApp()
  return app
}

/** Signs up a brand new test user and returns a cookie-keeping agent plus the user row. */
export async function signedInAgent(app, overrides = {}) {
  const agent = request.agent(app)
  const email = overrides.email || uniqueEmail()
  const res = await agent.post('/api/auth/signup').send({
    email,
    password: TEST_PASSWORD,
    fullName: overrides.fullName || 'Test Athlete',
    weeklyGoalWorkouts: overrides.weeklyGoalWorkouts ?? 4,
    weeklyGoalMinutes: overrides.weeklyGoalMinutes ?? 150,
  })
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`)
  return { agent, user: res.body.user, email }
}

/** Removes every test user (cascades to their workouts, sets and bookings). */
export async function cleanupTestUsers() {
  await sql`DELETE FROM users WHERE email LIKE 'e2e-%@pulsefit.test'`
}

export async function teardown() {
  await cleanupTestUsers()
  await closeDb()
}

export const todayISO = () => new Date().toISOString().slice(0, 10)

export function weekStartISO(iso = todayISO()) {
  const d = new Date(`${iso}T00:00:00Z`)
  const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000)
  return monday.toISOString().slice(0, 10)
}

/** Inserts a completed workout on a given date for a user (for streak tests). */
export async function insertCompletedWorkout(userId, date, minutes = 30) {
  await sql`
    INSERT INTO workouts (user_id, name, workout_date, status, duration_minutes, started_at, completed_at)
    VALUES (${userId}, ${'Seeded'}, ${date}, ${'completed'}, ${minutes}, now(), now())
    ON CONFLICT (user_id, workout_date) DO UPDATE SET status = 'completed', duration_minutes = EXCLUDED.duration_minutes
  `
}
