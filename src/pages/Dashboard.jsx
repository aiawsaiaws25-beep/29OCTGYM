import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Play, Flame, Timer, Target, Dumbbell, Quote, CheckCircle2 } from 'lucide-react'
import PageTransition, { PageHeader, stagger, fadeUp } from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import ProgressRing from '../components/ProgressRing'
import AnimatedCounter from '../components/AnimatedCounter'
import Loader, { ErrorState } from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { get } from '../lib/api'
import { toISODate } from '../lib/dates'
import { quoteOfTheDay } from '../data/mockData'

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold">{label}</p>
      <p className="text-ink-muted">{payload[0].value} min</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { stats, statsError, refreshStats } = useApp()
  const [workout, setWorkout] = useState(null)
  const [workoutError, setWorkoutError] = useState(null)
  const quote = quoteOfTheDay()

  useEffect(() => {
    let cancelled = false
    get(`/api/workouts/today?date=${toISODate()}`)
      .then((d) => !cancelled && setWorkout(d.workout))
      .catch((e) => !cancelled && setWorkoutError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  if (statsError) return <ErrorState message={statsError} onRetry={refreshStats} />
  if (!stats) return <Loader label="Loading your dashboard" />

  const totalMinutes = stats.weeklyActivity.reduce((a, d) => a + d.minutes, 0)
  const rings = [
    { label: 'Workouts', ...stats.goals.workouts, color: 'var(--color-lime)', icon: Dumbbell },
    { label: 'Active min', ...stats.goals.activeMinutes, color: 'var(--color-cyan)', icon: Timer },
    { label: 'Goals hit', ...stats.goals.goalsHit, color: 'var(--color-magenta)', icon: Target },
  ]
  const completed = workout?.status === 'completed'
  const plannedMinutes = workout ? workout.exercises.reduce((a, e) => a + e.sets.length * (e.rest_seconds + 45), 0) / 60 : 0

  return (
    <PageTransition>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <PageHeader eyebrow="Dashboard" title={`Hey ${user.full_name.split(' ')[0]} 👋`} subtitle="Let’s make today count." />

        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <GlassCard glow className="overflow-hidden">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-grad opacity-20 blur-3xl" />
              {workoutError ? (
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-widest text-magenta">Today’s workout</p>
                  <p className="font-display mt-1 text-xl font-bold">Couldn’t load your plan</p>
                  <p className="text-sm text-ink-muted">{workoutError}</p>
                </div>
              ) : !workout ? (
                <div className="relative h-40 animate-pulse rounded-2xl bg-surface-strong" />
              ) : (
                <>
                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-lime">Today’s workout</p>
                      <h2 className="font-display mt-1 text-2xl font-bold sm:text-3xl">{workout.name}</h2>
                      <p className="text-sm text-ink-muted">{[...new Set(workout.exercises.map((e) => e.muscle_group))].join(' · ')}</p>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="glass flex items-center gap-1 rounded-xl px-3 py-1.5">
                        <Timer size={14} className="text-cyan" /> {completed ? workout.duration_minutes : Math.round(plannedMinutes)} min
                      </span>
                      <span className="glass flex items-center gap-1 rounded-xl px-3 py-1.5">
                        <Dumbbell size={14} className="text-amber" /> {workout.exercises.length} moves
                      </span>
                    </div>
                  </div>
                  <ul className="relative mt-5 flex flex-wrap gap-2">
                    {workout.exercises.map((e) => (
                      <li key={e.id} className="rounded-full border border-line bg-surface-strong px-3 py-1 text-xs">
                        {e.name} · {e.sets.length}×{e.reps}
                      </li>
                    ))}
                  </ul>
                  <div className="relative mt-6">
                    {completed ? (
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-lime/15 px-5 py-3 font-display text-sm font-semibold text-lime">
                        <CheckCircle2 size={18} /> Done for today. Nice work.
                      </span>
                    ) : (
                      <Button icon={Play} size="lg" onClick={() => navigate('/workout')}>
                        {workout.status === 'in_progress' ? 'Continue' : 'Start'}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassCard className="flex h-full flex-col items-center justify-center text-center">
              <div className="relative mb-3">
                <span className="absolute inset-0 rounded-full bg-amber/40 animate-pulse-ring" />
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber to-magenta text-[#0a0c10] shadow-[0_0_40px_-6px_var(--color-amber)]">
                  <Flame size={38} fill="currentColor" />
                </span>
              </div>
              <p className="font-display text-5xl font-bold">
                <AnimatedCounter value={stats.streak} duration={1.2} />
              </p>
              <p className="text-sm text-ink-muted">day streak</p>
              <p className="mt-2 text-xs text-ink-faint">
                {stats.longestStreak ? `Longest: ${stats.longestStreak} days` : 'Finish a workout to start one'}
              </p>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-2">
            <GlassCard hover={false}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">Weekly activity</h3>
                  <p className="text-xs text-ink-muted">{totalMinutes} active minutes this week</p>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.weeklyActivity} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-lime)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="activityStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--color-lime)" />
                        <stop offset="100%" stopColor="var(--color-cyan)" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-faint)', fontSize: 12 }} />
                    <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--line)' }} />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="url(#activityStroke)"
                      strokeWidth={3}
                      fill="url(#activityFill)"
                      dot={{ r: 4, fill: 'var(--bg-elev)', stroke: 'var(--color-lime)', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'var(--color-lime)' }}
                      animationDuration={1600}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassCard hover={false} className="flex h-full flex-col justify-between">
              <h3 className="font-display text-lg font-semibold">This week</h3>
              <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-4">
                {rings.map((r, i) => (
                  <div key={r.label} className="flex flex-col items-center gap-2 lg:flex-row lg:gap-4">
                    <ProgressRing value={r.current} max={r.target} size={84} stroke={8} color={r.color} delay={0.2 + i * 0.15}>
                      <r.icon size={18} style={{ color: r.color }} />
                    </ProgressRing>
                    <div className="text-center lg:text-left">
                      <p className="font-display text-base font-bold">
                        {r.current}
                        <span className="text-ink-faint"> / {r.target}</span>
                      </p>
                      <p className="text-xs text-ink-muted">{r.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-3">
            <GlassCard hover={false} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan/15 text-cyan">
                <Quote size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Quote of the day</p>
                <p className="font-display mt-1 text-lg font-semibold">“{quote.text}”</p>
                <p className="text-sm text-ink-faint">— {quote.author}</p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </PageTransition>
  )
}
