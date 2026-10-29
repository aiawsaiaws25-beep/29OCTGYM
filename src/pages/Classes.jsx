import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Clock, Users, Check, CalendarX, Zap } from 'lucide-react'
import PageTransition, { PageHeader, stagger, fadeUp } from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import Loader, { ErrorState } from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { get, post } from '../lib/api'
import { WEEK_DAYS, dayLabel, timeLabel, todayDayIndex } from '../lib/dates'

const typeTone = { Yoga: 'cyan', HIIT: 'magenta', Spin: 'lime', Boxing: 'amber', Strength: 'neutral' }
const types = ['All', 'Yoga', 'HIIT', 'Spin', 'Boxing', 'Strength']

export default function Classes() {
  const { user } = useAuth()
  const { refreshStats } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [classes, setClasses] = useState(null)
  const [error, setError] = useState(null)
  const [day, setDay] = useState(WEEK_DAYS[todayDayIndex()])
  const [type, setType] = useState('All')
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setError(null)
    get('/api/classes')
      .then((d) => setClasses(d.classes.map((c) => ({ ...c, day: dayLabel(c.start_time), time: timeLabel(c.start_time) }))))
      .catch((e) => setError(e.message))
  }
  useEffect(load, [user?.id])

  const list = useMemo(
    () => (classes || []).filter((c) => c.day === day && (type === 'All' || c.category === type)),
    [classes, day, type],
  )
  const bookedCount = (classes || []).filter((c) => c.booked).length

  const handleBook = async (c) => {
    if (!user) {
      toast('Log in to book a spot.', { type: 'info', title: 'Almost there' })
      navigate('/login', { state: { from: '/classes' } })
      return
    }
    if (!c.booked && c.spots_left === 0) {
      toast('This class is full. Try another time.', { type: 'error', title: 'No spots left' })
      return
    }
    setBusyId(c.id)
    try {
      const r = await post('/api/classes/book', { classId: c.id })
      setClasses((cs) => cs.map((x) => (x.id === c.id ? { ...x, booked: r.booked, spots_left: r.spots_left } : x)))
      if (r.booked) toast(`${c.title} · ${c.day} ${c.time} with ${c.coach_name}. See you there!`, { title: 'You’re booked 🎉' })
      else toast(`Your spot in ${c.title} has been released.`, { type: 'info', title: 'Booking cancelled' })
      refreshStats()
    } catch (e) {
      toast(e.message, { type: 'error', title: 'Booking failed' })
    } finally {
      setBusyId(null)
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!classes) return <Loader label="Loading this week’s classes" />

  return (
    <PageTransition>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <PageHeader
          eyebrow="Classes"
          title="Book a class"
          subtitle={user ? `${bookedCount} booked this week` : 'Log in to reserve your spot'}
          right={
            <div className="scrollbar-none flex gap-2 overflow-x-auto">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    type === t ? 'bg-grad text-[#0a0c10] shadow-glow' : 'glass text-ink-muted hover:text-ink'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />

        <motion.div variants={fadeUp} className="mb-6 grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEK_DAYS.map((d, i) => {
            const active = d === day
            const count = classes.filter((c) => c.day === d).length
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`relative flex flex-col items-center rounded-2xl py-2.5 text-xs font-semibold transition-colors sm:py-3 ${
                  active ? 'text-[#0a0c10]' : 'glass text-ink-muted hover:text-ink'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="day-pill"
                    className="absolute inset-0 rounded-2xl bg-grad shadow-glow"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{d}</span>
                <span className={`relative mt-0.5 text-[10px] ${active ? 'opacity-70' : 'text-ink-faint'}`}>
                  {count} {count === 1 ? 'class' : 'classes'}
                </span>
                {i === todayDayIndex() && !active && <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-lime" />}
              </button>
            )
          })}
        </motion.div>

        {list.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={`No ${type === 'All' ? '' : type + ' '}classes on ${day}`}
            message="Rest days matter too. Pick another day or clear the filter."
            action={<Button size="sm" variant="ghost" onClick={() => setType('All')}>Show all types</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {list.map((c, i) => {
                const filled = c.capacity - c.spots_left
                const pct = (filled / c.capacity) * 100
                const full = c.spots_left === 0 && !c.booked
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard className={`h-full ${c.booked ? 'border-lime/50' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge tone={typeTone[c.category] || 'neutral'}>{c.category}</Badge>
                          <h2 className="font-display mt-2 text-xl font-semibold">{c.title}</h2>
                          <p className="text-sm text-ink-muted">with {c.coach_name}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((n) => (
                            <Zap key={n} size={14} className={n <= c.intensity ? 'text-amber' : 'text-ink-faint/40'} fill={n <= c.intensity ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-muted">
                        <span className="flex items-center gap-1"><Clock size={14} /> {c.time} · {c.duration_minutes} min</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> {c.day}</span>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-ink-muted"><Users size={13} /> {filled}/{c.capacity} filled</span>
                          <span className={`font-semibold ${c.spots_left <= 2 ? 'text-magenta' : 'text-lime'}`}>
                            {c.spots_left === 0 ? 'Full' : `${c.spots_left} spots left`}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-strong">
                          <motion.div
                            className={`h-full rounded-full ${c.spots_left <= 2 ? 'bg-magenta' : 'bg-grad'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button
                          className="w-full"
                          variant={c.booked ? 'outline' : full ? 'ghost' : 'primary'}
                          icon={c.booked ? Check : undefined}
                          disabled={busyId === c.id}
                          onClick={() => handleBook(c)}
                        >
                          {c.booked ? 'Booked · tap to cancel' : full ? 'Class full' : 'Book spot'}
                        </Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </PageTransition>
  )
}
