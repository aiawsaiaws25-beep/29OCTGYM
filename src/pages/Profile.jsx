import { motion } from 'framer-motion'
import { Dumbbell, Flame, Timer, Trophy, Calendar, Crown, Lock, Sun, Moon, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageTransition, { PageHeader, stagger, fadeUp } from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import ProgressRing from '../components/ProgressRing'
import Badge from '../components/Badge'
import Loader, { ErrorState } from '../components/Loader'
import { useAuth, avatarFor } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { achievementDefs } from '../data/mockData'

const iconMap = { dumbbell: Dumbbell, flame: Flame, timer: Timer, trophy: Trophy, calendar: Calendar }

function membershipFor(workouts) {
  if (workouts >= 50) return 'Elite'
  if (workouts >= 10) return 'Pro'
  return 'Starter'
}

export default function Profile() {
  const { user, logout } = useAuth()
  const { stats, statsError, refreshStats } = useApp()
  const { theme, toggle } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()

  if (statsError) return <ErrorState message={statsError} onRetry={refreshStats} />
  if (!stats) return <Loader label="Loading your profile" />

  const metrics = {
    workouts: stats.totals.workoutsCompleted,
    minutes: stats.totals.minutesTotal,
    classes: stats.totals.classesBooked,
    longestStreak: stats.longestStreak,
  }
  const achievements = achievementDefs.map((a) => ({ ...a, progress: metrics[a.metric], unlocked: metrics[a.metric] >= a.target }))
  const unlocked = achievements.filter((a) => a.unlocked).length
  const level = 1 + Math.floor(metrics.workouts / 5)
  const xp = metrics.workouts % 5
  const membership = membershipFor(metrics.workouts)
  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

  const quick = [
    { label: 'Workouts', value: metrics.workouts, icon: Dumbbell },
    { label: 'Active min', value: metrics.minutes, icon: Timer },
    { label: 'Classes', value: metrics.classes, icon: Calendar },
    { label: 'Best streak', value: metrics.longestStreak, icon: Flame },
  ]

  const handleLogout = async () => {
    // Leave the protected page first so the route guard cannot bounce us to /login.
    navigate('/')
    await logout()
    toast('See you at the next session.', { type: 'info', title: 'Logged out' })
  }

  return (
    <PageTransition>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <PageHeader eyebrow="Profile" title="Your profile" />

        <motion.div variants={fadeUp}>
          <GlassCard hover={false} className="overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24 bg-grad opacity-30" />
            <div className="relative flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-end">
              <div className="relative">
                <div className="absolute -inset-1 rounded-3xl bg-grad blur-md opacity-70" />
                <img src={avatarFor(user.full_name)} alt={user.full_name} className="relative h-28 w-28 rounded-3xl object-cover ring-4 ring-bg" />
                <span className="absolute -right-2 -bottom-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber text-[#0a0c10] shadow-[0_0_20px_-4px_var(--color-amber)]">
                  <Crown size={18} />
                </span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="font-display text-2xl font-bold">{user.full_name}</h2>
                  <Badge tone="amber"><Crown size={11} /> {membership} member</Badge>
                </div>
                <p className="text-sm text-ink-muted">{user.email} · Member since {memberSince}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  Goal: {user.weekly_goal_workouts} workouts · {user.weekly_goal_minutes} active min per week
                </p>
                <div className="mt-3 w-full max-w-xs">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold">Level {level}</span>
                    <span className="text-ink-muted">{xp} / 5 workouts to next</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-strong">
                    <motion.div
                      className="h-full rounded-full bg-grad"
                      initial={{ width: 0 }}
                      animate={{ width: `${(xp / 5) * 100}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { toggle(); toast(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`, { type: 'info' }) }}
                  className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-surface-strong"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button onClick={handleLogout} className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-magenta hover:bg-magenta/10">
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quick.map(({ label, value, icon: Icon }) => (
            <motion.div key={label} variants={fadeUp}>
              <GlassCard className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/15 text-lime"><Icon size={18} /></span>
                <div>
                  <p className="font-display text-xl font-bold">{value}</p>
                  <p className="text-xs text-ink-muted">{label}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} className="mt-8 mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Achievements</h3>
          <span className="text-sm text-ink-muted">{unlocked} / {achievements.length} unlocked</span>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {achievements.map((a, i) => {
            const Icon = iconMap[a.icon]
            return (
              <motion.div key={a.id} variants={fadeUp}>
                <GlassCard className={`flex h-full flex-col items-center p-4 text-center ${a.unlocked ? '' : 'opacity-75'}`}>
                  {a.unlocked ? (
                    <motion.span
                      initial={{ scale: 0.6, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.2 + i * 0.06 }}
                      className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-grad text-[#0a0c10] shadow-glow"
                    >
                      <Icon size={28} />
                    </motion.span>
                  ) : (
                    <div className="mb-3">
                      <ProgressRing value={a.progress} max={a.target} size={64} stroke={6} color="var(--color-cyan)" delay={0.3 + i * 0.05}>
                        <Lock size={18} className="text-ink-faint" />
                      </ProgressRing>
                    </div>
                  )}
                  <p className="font-display text-sm font-semibold">{a.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{a.desc}</p>
                  {!a.unlocked && (
                    <p className="mt-1 text-[11px] font-semibold text-cyan">
                      {a.progress} / {a.target}
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </PageTransition>
  )
}
