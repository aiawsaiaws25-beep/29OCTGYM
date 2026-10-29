import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { ThemeToggle } from './Layout'

export function Field({ label, hint, ...rest }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</span>
      <input
        {...rest}
        className="w-full rounded-2xl border border-line bg-surface-strong px-4 py-3 text-sm outline-none transition-all placeholder:text-ink-faint focus:border-lime/60 focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-lime)_25%,transparent)]"
      />
      {hint && <span className="mt-1 block text-[11px] text-ink-faint">{hint}</span>}
    </label>
  )
}

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="bg-orbs relative flex min-h-screen flex-col">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-6 sm:p-8"
        >
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-grad opacity-20 blur-3xl" />
          <div className="relative">
            <h1 className="font-display text-3xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer && <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>}
          </div>
        </motion.div>
      </main>
      <p className="relative z-10 pb-6 text-center text-xs text-ink-faint">
        <Link to="/" className="hover:text-ink">Back to home</Link>
      </p>
    </div>
  )
}
