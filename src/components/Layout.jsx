import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, Dumbbell, TrendingUp, Calendar, User, Sun, Moon, Flame, Play, LogOut, LogIn } from 'lucide-react'
import Logo from './Logo'
import { useTheme } from '../context/ThemeContext'
import { useAuth, avatarFor } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

const nav = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/library', label: 'Library', icon: Dumbbell },
  { to: '/workout', label: 'Train', icon: Play, accent: true },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/classes', label: 'Classes', icon: Calendar },
  { to: '/profile', label: 'Profile', icon: User },
]

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`glass relative flex h-10 w-[72px] items-center rounded-full px-1 transition-colors ${className}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-grad text-[#0a0c10] shadow-glow ${dark ? 'ml-auto' : ''}`}
      >
        {dark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.span>
    </button>
  )
}

function useStreak() {
  const { stats } = useApp()
  return stats?.streak ?? 0
}

function UserCard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const streak = useStreak()

  if (!user) {
    return (
      <button onClick={() => navigate('/login')} className="m-3 glass flex items-center gap-3 rounded-2xl p-3 text-left hover:bg-surface-strong">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/15 text-lime"><LogIn size={18} /></span>
        <div>
          <p className="text-sm font-semibold">Log in</p>
          <p className="text-xs text-ink-muted">to track your training</p>
        </div>
      </button>
    )
  }

  const handleLogout = async () => {
    // Leave the protected page first so the route guard cannot bounce us to /login.
    navigate('/')
    await logout()
    toast('See you at the next session.', { type: 'info', title: 'Logged out' })
  }

  return (
    <div className="m-3 glass flex items-center gap-3 rounded-2xl p-3">
      <img src={avatarFor(user.full_name)} alt="" className="h-10 w-10 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.full_name}</p>
        <p className="flex items-center gap-1 text-xs text-ink-muted">
          <Flame size={12} className="text-amber" /> {streak}-day streak
        </p>
      </div>
      <button onClick={handleLogout} aria-label="Log out" className="text-ink-faint hover:text-magenta">
        <LogOut size={16} />
      </button>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-bg-elev/60 backdrop-blur-xl lg:flex">
      <div className="px-6 pt-7 pb-6">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-surface-strong border border-line"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={19} className={`relative ${isActive ? 'text-lime' : ''}`} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <UserCard />
    </aside>
  )
}

function TopBar() {
  const { user } = useAuth()
  const streak = useStreak()
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/70 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Logo size="sm" />
      <div className="flex items-center gap-2">
        {user && (
          <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
            <Flame size={13} className="text-amber" /> {streak}
          </span>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="mx-3 mb-3 glass flex items-center justify-around rounded-3xl px-1 py-2 safe-bottom">
        {nav.map(({ to, label, icon: Icon, accent }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-lime' : 'text-ink-faint'
              }`
            }
          >
            {({ isActive }) =>
              accent ? (
                <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-grad text-[#0a0c10] shadow-glow ring-4 ring-bg">
                  <Icon size={24} fill="currentColor" />
                </span>
              ) : (
                <>
                  <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                  <span>{label}</span>
                  {isActive && (
                    <motion.span layoutId="bottom-dot" className="absolute -bottom-1 h-1 w-1 rounded-full bg-lime" />
                  )}
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function Layout() {
  const location = useLocation()
  return (
    <div className="bg-orbs min-h-screen">
      <Sidebar />
      <TopBar />
      <div className="hidden lg:block fixed right-6 top-6 z-30">
        <ThemeToggle />
      </div>
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pt-10 lg:pb-16">
        <AnimatePresence mode="wait">
          <Outlet key={location.pathname} />
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
