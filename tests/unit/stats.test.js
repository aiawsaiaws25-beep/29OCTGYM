import { describe, it, expect } from 'vitest'
import { streaks, weeklyActivity, addDays, goalShare } from '../../lib/server/stats.js'
import { ringPercent } from '../../src/lib/progress.js'

describe('streaks()', () => {
  it('no workouts -> 0', () => {
    expect(streaks([], '2026-10-14')).toEqual({ current: 0, longest: 0 })
  })
  it('3 days in a row ending today -> 3', () => {
    expect(streaks(['2026-10-12', '2026-10-13', '2026-10-14'], '2026-10-14')).toEqual({ current: 3, longest: 3 })
  })
  it('a missed day resets the current streak', () => {
    const r = streaks(['2026-10-10', '2026-10-11', '2026-10-13'], '2026-10-14')
    expect(r.current).toBe(1) // yesterday only
    expect(r.longest).toBe(2)
  })
  it('today plus yesterday -> 2', () => {
    expect(streaks(['2026-10-13', '2026-10-14'], '2026-10-14').current).toBe(2)
  })
  it('a streak that ended two days ago is dead', () => {
    expect(streaks(['2026-10-11', '2026-10-12'], '2026-10-14').current).toBe(0)
  })
  it('ignores duplicates and order', () => {
    expect(streaks(['2026-10-14', '2026-10-13', '2026-10-13', '2026-10-12'], '2026-10-14').current).toBe(3)
  })
  it('crosses month boundaries', () => {
    expect(streaks(['2026-09-30', '2026-10-01'], '2026-10-01').current).toBe(2)
  })
})

describe('weeklyActivity()', () => {
  it('always returns 7 days starting on the week start', () => {
    const w = weeklyActivity([{ d: '2026-10-14', minutes: 30 }], '2026-10-12')
    expect(w).toHaveLength(7)
    expect(w[0]).toEqual({ day: 'Mon', date: '2026-10-12', minutes: 0 })
    expect(w[2]).toEqual({ day: 'Wed', date: '2026-10-14', minutes: 30 })
    expect(w[6].date).toBe('2026-10-18')
  })
  it('coerces string minutes to numbers', () => {
    const w = weeklyActivity([{ d: '2026-10-12', minutes: '45' }], '2026-10-12')
    expect(w[0].minutes).toBe(45)
  })
})

describe('addDays()', () => {
  it('handles month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('progress rings never exceed 100% or show NaN', () => {
  const cases = [
    [0, 4, 0],
    [2, 4, 0.5],
    [4, 4, 1],
    [9, 4, 1],
    [-1, 4, 0],
    [3, 0, 0],
    [undefined, 4, 0],
    [NaN, 4, 0],
    ['3', '4', 0.75],
    [Infinity, 4, 0],
  ]
  it.each(cases)('ringPercent(%s, %s) = %s', (v, m, out) => {
    const r = ringPercent(v, m)
    expect(Number.isNaN(r)).toBe(false)
    expect(r).toBe(out)
    expect(goalShare(v, m)).toBe(out)
  })
})
