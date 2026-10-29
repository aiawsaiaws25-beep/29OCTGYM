import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check, Pause, Play, RotateCcw, SkipForward, Trophy, Flame, Timer, ChevronRight, X } from 'lucide-react'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import ProgressRing from '../components/ProgressRing'
import Badge, { difficultyTone } from '../components/Badge'
import Loader, { ErrorState } from '../components/Loader'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { get, post } from '../lib/api'
import { toISODate } from '../lib/dates'

function fireConfetti() {
  const colors = ['#c6ff3d', '#22e6ff', '#ff4fd8', '#ffb547', '#ffffff']
  confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors })
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 250)
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 400)
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function LiveWorkout() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refreshStats } = useApp()

  const [workout, setWorkout] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState([]) // done[exIdx][setIdx]
  const [current, setCurrent] = useState(0)
  const [rest, setRest] = useState({ total: 0, left: 0, running: false })
  const [elapsed, setElapsed] = useState(0)
  const [finished, setFinished] = useState(false)
  const [summary, setSummary] = useState(null)
  const completingRef = useRef(false)

  const load = () => {
    setError(null)
    get(`/api/workouts/today?date=${toISODate()}`)
      .then(({ workout }) => {
        setWorkout(workout)
        setDone(workout.exercises.map((e) => e.sets.map((s) => s.completed)))
        const firstOpen = workout.exercises.findIndex((e) => e.sets.some((s) => !s.completed))
        setCurrent(firstOpen === -1 ? 0 : firstOpen)
        if (workout.status === 'completed') {
          setFinished(true)
          setSummary({ minutes: workout.duration_minutes, sets: workout.exercises.reduce((a, e) => a + e.sets.length, 0) })
        } else if (workout.started_at) {
          setElapsed(Math.max(0, Math.floor((Date.now() - new Date(workout.started_at).getTime()) / 1000)))
        } else {
          post('/api/workouts/start', { workoutId: workout.id }).catch(() => {})
        }
      })
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const plan = workout?.exercises ?? []
  const totalSets = plan.reduce((a, e) => a + e.sets.length, 0)
  const doneCount = done.flat().filter(Boolean).length

  useEffect(() => {
    if (finished || !workout) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [finished, workout])

  useEffect(() => {
    if (!rest.running || rest.left <= 0) return
    const id = setInterval(() => {
      setRest((r) => (r.left <= 1 ? { ...r, left: 0, running: false } : { ...r, left: r.left - 1 }))
    }, 1000)
    return () => clearInterval(id)
  }, [rest.running, rest.left])

  useEffect(() => {
    if (rest.total > 0 && rest.left === 0 && !rest.running) {
      toast('Rest is over. Next set, let’s go!', { type: 'info', title: 'Go time' })
      setRest({ total: 0, left: 0, running: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest.left, rest.running])

  useEffect(() => {
    if (!workout || totalSets === 0 || doneCount !== totalSets || finished || completingRef.current) return
    completingRef.current = true
    post('/api/workouts/complete', { workoutId: workout.id, durationSeconds: elapsed })
      .then(({ workout: w }) => {
        setSummary({ minutes: w.duration_minutes, sets: totalSets })
        setFinished(true)
        fireConfetti()
        refreshStats()
      })
      .catch((e) => {
        completingRef.current = false
        toast(e.message, { type: 'error', title: 'Couldn’t save your workout' })
      })
  }, [doneCount, totalSets, workout, finished, elapsed, refreshStats, toast])

  const toggleSet = async (exIdx, setIdx) => {
    const wasDone = done[exIdx][setIdx]
    const set = plan[exIdx].sets[setIdx]
    setDone((d) => d.map((sets, i) => (i === exIdx ? sets.map((v, j) => (j === setIdx ? !v : v)) : sets)))
    if (!wasDone) {
      const ex = plan[exIdx]
      if (doneCount + 1 !== totalSets) setRest({ total: ex.rest_seconds, left: ex.rest_seconds, running: true })
      const allSetsDone = ex.sets.length === done[exIdx].filter(Boolean).length + 1
      if (allSetsDone && exIdx === current && current < plan.length - 1) setTimeout(() => setCurrent(current + 1), 400)
    }
    try {
      await post('/api/workouts/sets', { setId: set.id, completed: !wasDone })
    } catch (e) {
      // roll back
      setDone((d) => d.map((sets, i) => (i === exIdx ? sets.map((v, j) => (j === setIdx ? wasDone : v)) : sets)))
      toast(e.message, { type: 'error', title: 'Set not saved' })
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!workout) return <Loader label="Loading today’s plan" />

  if (finished) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-lg py-10 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-grad text-[#0a0c10] shadow-glow"
          >
            <Trophy size={56} />
          </motion.div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Workout complete!</h1>
          <p className="mt-2 text-ink-muted">You crushed {workout.name}. Streak extended.</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Timer, v: `${summary?.minutes ?? 0} min`, l: 'Time' },
              { icon: Check, v: summary?.sets ?? totalSets, l: 'Sets' },
              { icon: Flame, v: plan.length, l: 'Exercises' },
            ].map(({ icon: I, v, l }) => (
              <GlassCard key={l} hover={false} className="py-4 text-center">
                <I size={18} className="mx-auto mb-1 text-lime" />
                <p className="font-display text-xl font-bold">{v}</p>
                <p className="text-xs text-ink-muted">{l}</p>
              </GlassCard>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/progress')} iconRight={ChevronRight}>
              See progress
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Back home
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">Live workout</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{workout.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="glass rounded-xl px-3 py-1.5 font-display text-sm font-semibold tabular-nums">{fmt(elapsed)}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="glass flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted hover:text-ink"
            aria-label="Exit workout"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-surface-strong">
        <motion.div
          className="h-full rounded-full bg-grad"
          initial={{ width: 0 }}
          animate={{ width: `${totalSets ? (doneCount / totalSets) * 100 : 0}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <GlassCard hover={false} glow={rest.running} className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            {rest.running ? 'Rest' : rest.total ? 'Rest paused' : 'Ready'}
          </p>
          <div className="my-4">
            <ProgressRing
              value={rest.total ? rest.total - rest.left : 0}
              max={rest.total || 1}
              size={220}
              stroke={14}
              color={rest.running ? 'var(--color-cyan)' : 'var(--color-lime)'}
              duration={0.9}
            >
              <motion.span
                key={rest.total ? 'timer' : 'ready'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="font-display text-6xl font-bold tabular-nums"
                data-testid="rest-timer"
              >
                {rest.total ? fmt(rest.left) : 'GO'}
              </motion.span>
              <span className="text-xs text-ink-muted">{rest.total ? 'until next set' : 'tick a set to start rest'}</span>
            </ProgressRing>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={rest.running ? Pause : Play}
              disabled={!rest.total}
              onClick={() => setRest((r) => ({ ...r, running: !r.running }))}
            >
              {rest.running ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="ghost" size="sm" icon={RotateCcw} disabled={!rest.total} onClick={() => setRest((r) => ({ ...r, left: r.total, running: true }))}>
              Restart
            </Button>
            <Button variant="ghost" size="sm" icon={SkipForward} disabled={!rest.total} onClick={() => setRest({ total: 0, left: 0, running: false })}>
              Skip
            </Button>
          </div>
        </GlassCard>

        <div className="space-y-3">
          {plan.map((e, exIdx) => {
            const sets = done[exIdx] || []
            const complete = sets.length > 0 && sets.every(Boolean)
            const active = exIdx === current
            return (
              <motion.div key={e.id} layout>
                <GlassCard
                  hover={false}
                  className={`transition-all ${active ? 'border-lime/50 shadow-glow' : ''} ${complete ? 'opacity-60' : ''}`}
                  onClick={() => setCurrent(exIdx)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold leading-tight">{e.name}</p>
                      <p className="text-xs text-ink-muted">
                        {e.sets.length} sets × {e.reps} · {e.rest_seconds}s rest
                      </p>
                    </div>
                    {complete ? (
                      <Badge tone="lime">
                        <Check size={12} /> Done
                      </Badge>
                    ) : (
                      <Badge tone={difficultyTone[e.difficulty]}>{e.difficulty}</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sets.map((isDone, setIdx) => (
                      <motion.button
                        key={setIdx}
                        whileTap={{ scale: 0.9 }}
                        onClick={(ev) => { ev.stopPropagation(); setCurrent(exIdx); toggleSet(exIdx, setIdx) }}
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-semibold transition-all ${
                          isDone
                            ? 'border-transparent bg-grad text-[#0a0c10] shadow-glow'
                            : 'border-line bg-surface-strong text-ink-muted hover:border-lime/50 hover:text-ink'
                        }`}
                        aria-label={`${e.name} set ${setIdx + 1}`}
                        aria-pressed={isDone}
                        data-testid="set-button"
                      >
                        {isDone ? <Check size={18} /> : setIdx + 1}
                      </motion.button>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </PageTransition>
  )
}
