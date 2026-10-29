import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { testApp, signedInAgent, uniqueEmail, teardown, TEST_PASSWORD } from './helpers.js'

let app
beforeAll(async () => {
  app = await testApp()
})
afterAll(teardown)

describe('POST /api/auth/signup', () => {
  it('creates an account and sets an httpOnly session cookie', async () => {
    const email = uniqueEmail('signup')
    const res = await request(app).post('/api/auth/signup').send({
      email,
      password: TEST_PASSWORD,
      fullName: 'Sign Up',
      weeklyGoalWorkouts: 3,
      weeklyGoalMinutes: 120,
    })
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ email, full_name: 'Sign Up', weekly_goal_workouts: 3, weekly_goal_minutes: 120 })
    expect(res.body.user.password_hash).toBeUndefined()
    const cookie = res.headers['set-cookie']?.[0] || ''
    expect(cookie).toMatch(/^pf_session=/)
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/SameSite=Lax/)
  })

  it('normalises the email to lower case', async () => {
    const email = uniqueEmail('CASE').toUpperCase()
    const res = await request(app).post('/api/auth/signup').send({ email, password: TEST_PASSWORD, fullName: 'Case Test' })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(email.toLowerCase())
  })

  it('blocks a duplicate email', async () => {
    const { email } = await signedInAgent(app)
    const res = await request(app).post('/api/auth/signup').send({ email, password: TEST_PASSWORD, fullName: 'Dup' })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already exists/i)
  })

  it('blocks a weak password', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: 'short', fullName: 'Weak' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/8 characters/)
  })

  it('blocks an empty password', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: '', fullName: 'Empty' })
    expect(res.status).toBe(400)
  })

  it('blocks an invalid email and a missing name', async () => {
    const bad = await request(app).post('/api/auth/signup').send({ email: 'nope', password: TEST_PASSWORD, fullName: 'X Y' })
    expect(bad.status).toBe(400)
    const noName = await request(app).post('/api/auth/signup').send({ email: uniqueEmail(), password: TEST_PASSWORD, fullName: '' })
    expect(noName.status).toBe(400)
  })

  it('rejects out-of-range weekly goals', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: uniqueEmail(), password: TEST_PASSWORD, fullName: 'Goals', weeklyGoalWorkouts: 99 })
    expect(res.status).toBe(400)
  })

  it('only accepts POST', async () => {
    const res = await request(app).get('/api/auth/signup')
    expect(res.status).toBe(405)
  })
})

describe('POST /api/auth/login and logout', () => {
  it('logs in with the right password', async () => {
    const { email } = await signedInAgent(app)
    const res = await request(app).post('/api/auth/login').send({ email, password: TEST_PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(email)
    expect(res.headers['set-cookie'][0]).toMatch(/^pf_session=.+HttpOnly/)
  })

  it('fails with the wrong password', async () => {
    const { email } = await signedInAgent(app)
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password-1' })
    expect(res.status).toBe(401)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it('fails for an unknown email and for missing fields', async () => {
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@pulsefit.test', password: TEST_PASSWORD })
    expect(unknown.status).toBe(401)
    const missing = await request(app).post('/api/auth/login').send({})
    expect(missing.status).toBe(400)
  })

  it('logout clears the cookie and /me returns null afterwards', async () => {
    const { agent } = await signedInAgent(app)
    const before = await agent.get('/api/auth/me')
    expect(before.body.user).not.toBeNull()

    const out = await agent.post('/api/auth/logout')
    expect(out.status).toBe(200)
    expect(out.headers['set-cookie'][0]).toMatch(/pf_session=;.*Max-Age=0/)

    const after = await agent.get('/api/auth/me')
    expect(after.status).toBe(200)
    expect(after.body.user).toBeNull()
  })
})

describe('GET /api/auth/me', () => {
  it('returns the user when logged in', async () => {
    const { agent, user } = await signedInAgent(app)
    const res = await agent.get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe(user.id)
    expect(res.body.user.password_hash).toBeUndefined()
  })

  it('returns null when logged out', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.user).toBeNull()
  })

  it('ignores a tampered cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'pf_session=not.a.jwt')
    expect(res.body.user).toBeNull()
  })
})

describe('protected routes without login', () => {
  const cases = [
    ['get', '/api/dashboard'],
    ['get', '/api/workouts/today'],
    ['post', '/api/workouts/sets'],
    ['post', '/api/workouts/complete'],
    ['post', '/api/workouts/start'],
    ['post', '/api/workouts/exercises'],
    ['post', '/api/classes/book'],
  ]
  it.each(cases)('%s %s returns 401', async (method, path) => {
    const res = await request(app)[method](path).send({})
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/log in/i)
  })
})
