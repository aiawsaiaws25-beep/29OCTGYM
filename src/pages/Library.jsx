import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Dumbbell, Timer, SearchX, Plus } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { toISODate } from '../lib/dates'
import PageTransition, { PageHeader, stagger, fadeUp } from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import Badge, { difficultyTone } from '../components/Badge'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import Loader, { ErrorState } from '../components/Loader'
import { get, post } from '../lib/api'

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export default function Library() {
  const [exercises, setExercises] = useState(null)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState('All')
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(null)
  const toast = useToast()

  const addToToday = async (e) => {
    setAdding(e.id)
    try {
      await post('/api/workouts/exercises', { exerciseId: e.id, date: toISODate() })
      toast(`${e.name} is now in today’s workout.`, { title: 'Added to today' })
    } catch (err) {
      toast(err.message, { type: err.status === 409 ? 'info' : 'error', title: 'Not added' })
    } finally {
      setAdding(null)
    }
  }

  const load = () => {
    setError(null)
    get('/api/exercises')
      .then((d) => setExercises(d.exercises))
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const list = useMemo(
    () =>
      (exercises || []).filter(
        (e) => (group === 'All' || e.muscle_group === group) && e.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [exercises, group, query],
  )

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!exercises) return <Loader label="Loading the library" />

  return (
    <PageTransition>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <PageHeader eyebrow="Library" title="Workout Library" subtitle={`${exercises.length} exercises, every muscle covered.`} />

        <motion.div variants={fadeUp} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="glass flex items-center gap-2 rounded-2xl px-4 py-3 sm:w-72">
            <Search size={18} className="text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
            />
          </label>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {muscleGroups.map((g) => {
              const active = g === group
              return (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? 'text-[#0a0c10]' : 'glass text-ink-muted hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="group-pill"
                      className="absolute inset-0 rounded-full bg-grad shadow-glow"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">{g}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {list.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No exercises found"
            message={`Nothing matches “${query}” in ${group}. Try another muscle group or clear your search.`}
            action={
              <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setGroup('All') }}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {list.map((e, i) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <GlassCard className="flex h-full flex-col" data-testid="exercise-card" data-group={e.muscle_group}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime/15 text-lime">
                        <Dumbbell size={20} />
                      </div>
                      <Badge tone={difficultyTone[e.difficulty]}>{e.difficulty}</Badge>
                    </div>
                    <h2 className="font-display mt-4 text-lg font-semibold leading-tight">{e.name}</h2>
                    <p className="text-xs text-ink-muted">{e.muscle_group}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-surface-strong py-2">
                        <p className="font-display text-lg font-bold">{e.sets}</p>
                        <p className="text-[10px] uppercase tracking-wider text-ink-faint">Sets</p>
                      </div>
                      <div className="rounded-xl bg-surface-strong py-2">
                        <p className="font-display text-lg font-bold">{e.reps}</p>
                        <p className="text-[10px] uppercase tracking-wider text-ink-faint">Reps</p>
                      </div>
                      <div className="rounded-xl bg-surface-strong py-2">
                        <p className="font-display flex items-center justify-center gap-1 text-lg font-bold">
                          <Timer size={14} className="text-cyan" />
                          {e.rest_seconds}s
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-ink-faint">Rest</p>
                      </div>
                    </div>
                    {e.description && <p className="mt-3 text-xs text-ink-muted">{e.description}</p>}
                    <div className="mt-auto pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Plus}
                        className="w-full"
                        disabled={adding === e.id}
                        onClick={() => addToToday(e)}
                        aria-label={`Add ${e.name} to today’s workout`}
                      >
                        Add to today
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </PageTransition>
  )
}
