import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Dumbbell, Flame, Timer, Trophy, Calendar, Sparkles } from 'lucide-react'
import Logo, { PulseMark } from '../components/Logo'
import Button from '../components/Button'
import AnimatedCounter from '../components/AnimatedCounter'
import GlassCard from '../components/GlassCard'
import { ThemeToggle } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { get } from '../lib/api'
import { fallbackStats, quoteOfTheDay } from '../data/mockData'

const features = [
  { icon: Dumbbell, title: 'Smart workout plans', desc: 'Programs that adapt to your schedule and recovery.' },
  { icon: Timer, title: 'Live workout mode', desc: 'Rest timers, set tracking and zero distractions.' },
  { icon: Trophy, title: 'Track every PR', desc: 'Strength curves and records that celebrate with you.' },
  { icon: Calendar, title: 'Book classes', desc: 'Yoga, HIIT, Spin and Boxing. One tap, you’re in.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const quote = quoteOfTheDay()
  const [stats, setStats] = useState(fallbackStats)

  useEffect(() => {
    get('/api/stats').then(setStats).catch(() => {})
  }, [])

  const statItems = [
    { label: 'Active members', value: stats.members, suffix: '+', compact: true },
    { label: 'Workouts completed', value: stats.workoutsCompleted, suffix: '', compact: true },
    { label: 'Classes this week', value: stats.classesThisWeek, suffix: '', compact: false },
  ]

  const startHref = user ? '/dashboard' : '/signup'

  return (
    <div className="bg-orbs relative min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="hidden text-sm font-medium text-ink-muted hover:text-ink sm:block">
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="hidden text-sm font-medium text-ink-muted hover:text-ink sm:block">
              Log in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main>
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-lime"
          >
            <Sparkles size={14} /> New: Live Workout Mode
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl"
          >
            Train smarter.
            <br />
            <span className="text-gradient">Get stronger.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 max-w-lg text-lg text-ink-muted"
          >
            PulseFit plans your workouts, tracks every rep, books your classes and keeps the fire lit. Built for
            people who move.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button size="lg" iconRight={ArrowRight} onClick={() => navigate(startHref)}>
              Start Your Workout
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/classes')}>
              Browse classes
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 grid grid-cols-3 gap-4"
          >
            {statItems.map((s, i) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold sm:text-4xl">
                  <AnimatedCounter value={s.value} suffix={s.suffix} compact={s.compact} duration={1.6 + i * 0.3} />
                </p>
                <p className="mt-1 text-xs text-ink-muted sm:text-sm">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-10 -z-10 rounded-full bg-grad opacity-25 blur-3xl" />
          <GlassCard hover={false} className="animate-float p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-muted">Today</p>
                <p className="font-display text-xl font-bold">Push Day · Power</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-grad text-[#0a0c10] shadow-glow">
                <Dumbbell size={22} />
              </span>
            </div>
            <div className="mt-5 flex items-end gap-1.5">
              {[40, 65, 30, 80, 55, 95, 70].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.8 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                  className={`h-24 flex-1 rounded-md ${i === 5 ? 'bg-grad shadow-glow' : 'bg-surface-strong'}`}
                  style={{ height: `${h}%`, minHeight: 6, maxHeight: 96 }}
                />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Flame, v: '410', l: 'kcal' },
                { icon: Timer, v: '52', l: 'min' },
                { icon: Trophy, v: '2', l: 'PRs' },
              ].map(({ icon: I, v, l }) => (
                <div key={l} className="rounded-2xl bg-surface-strong p-3">
                  <I size={16} className="mx-auto mb-1 text-lime" />
                  <p className="font-display text-lg font-bold">{v}</p>
                  <p className="text-[11px] text-ink-muted">{l}</p>
                </div>
              ))}
            </div>
          </GlassCard>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="glass absolute -right-4 -bottom-6 flex items-center gap-2 rounded-2xl px-4 py-3 sm:-right-10"
          >
            <Flame size={20} className="text-amber" />
            <div>
              <p className="font-display text-sm font-bold">12-day streak</p>
              <p className="text-[11px] text-ink-muted">Keep it burning</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass mb-12 rounded-3xl p-6 text-center sm:p-10"
        >
          <p className="font-display text-xl font-semibold sm:text-2xl">“{quote.text}”</p>
          <footer className="mt-2 text-sm text-ink-muted">— {quote.author}</footer>
        </motion.blockquote>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard className="h-full">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/15 text-lime">
                  <Icon size={22} />
                </div>
                <h2 className="font-display text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-ink-muted">{desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>
      </main>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <PulseMark size={22} />
            <span className="font-display font-bold text-gradient">PulseFit</span>
          </div>
          <p className="text-xs text-ink-faint">© 2026 PulseFit. Move every day.</p>
        </div>
      </footer>
    </div>
  )
}
