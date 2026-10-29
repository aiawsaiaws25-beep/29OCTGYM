import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { testApp, signedInAgent, teardown } from './helpers.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

let app
beforeAll(async () => {
  app = await testApp()
})
afterAll(teardown)

describe('GET /api/stats', () => {
  it('returns numeric counters', async () => {
    const res = await request(app).get('/api/stats')
    expect(res.status).toBe(200)
    expect(typeof res.body.members).toBe('number')
    expect(typeof res.body.workoutsCompleted).toBe('number')
    expect(typeof res.body.classesThisWeek).toBe('number')
    expect(res.body.classesThisWeek).toBe(10)
  })

  it('counts a new member', async () => {
    const before = (await request(app).get('/api/stats')).body.members
    await signedInAgent(app)
    const after = (await request(app).get('/api/stats')).body.members
    expect(after).toBe(before + 1)
  })
})

describe('GET /api/exercises', () => {
  it('returns all 30 exercises with the expected shape', async () => {
    const res = await request(app).get('/api/exercises')
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(30)
    for (const e of res.body.exercises) {
      expect(e).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        sets: expect.any(Number),
        reps: expect.any(String),
        rest_seconds: expect.any(Number),
      })
      expect(GROUPS).toContain(e.muscle_group)
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(e.difficulty)
    }
  })

  it.each(GROUPS)('filters by %s (5 exercises)', async (group) => {
    const res = await request(app).get(`/api/exercises?group=${group}`)
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(5)
    expect(res.body.exercises.every((e) => e.muscle_group === group)).toBe(true)
  })

  it('rejects an unknown group', async () => {
    const res = await request(app).get('/api/exercises?group=Wings')
    expect(res.status).toBe(400)
  })
})

describe('GET /api/classes and POST /api/classes/book', () => {
  it('lists this week’s classes with spots left (logged out)', async () => {
    const res = await request(app).get('/api/classes')
    expect(res.status).toBe(200)
    expect(res.body.classes).toHaveLength(10)
    for (const c of res.body.classes) {
      expect(c.spots_left).toBe(c.capacity - c.booked_count)
      expect(c.booked).toBe(false)
    }
  })

  it('books, reflects spots left, and cancels', async () => {
    const { agent } = await signedInAgent(app)
    const first = (await agent.get('/api/classes')).body.classes[0]

    const book = await agent.post('/api/classes/book').send({ classId: first.id })
    expect(book.status).toBe(201)
    expect(book.body).toEqual({ booked: true, spots_left: first.spots_left - 1 })

    const listed = (await agent.get('/api/classes')).body.classes.find((c) => c.id === first.id)
    expect(listed.booked).toBe(true)
    expect(listed.spots_left).toBe(first.spots_left - 1)

    const cancel = await agent.post('/api/classes/book').send({ classId: first.id })
    expect(cancel.status).toBe(200)
    expect(cancel.body.booked).toBe(false)
  })

  it('rejects an unknown class and a missing id', async () => {
    const { agent } = await signedInAgent(app)
    expect((await agent.post('/api/classes/book').send({ classId: 999999 })).status).toBe(404)
    expect((await agent.post('/api/classes/book').send({})).status).toBe(400)
  })

  it('refuses to overbook a full class', async () => {
    const filler = await signedInAgent(app)
    const { agent } = await signedInAgent(app)
    const target = (await agent.get('/api/classes')).body.classes[1]
    // One other member books, then capacity is shrunk to exactly the booked count.
    await filler.agent.post('/api/classes/book').send({ classId: target.id })
    const { sql } = await import('../../lib/server/db.js')
    await sql`UPDATE classes SET capacity = ${target.booked_count + 1} WHERE id = ${target.id}`
    const res = await agent.post('/api/classes/book').send({ classId: target.id })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/full/i)
    const listed = (await agent.get('/api/classes')).body.classes.find((c) => c.id === target.id)
    expect(listed.spots_left).toBe(0)
    await sql`UPDATE classes SET capacity = ${target.capacity} WHERE id = ${target.id}`
  })
})

describe('routing', () => {
  it('returns JSON 404 for unknown API paths', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/No API route/)
  })
})
