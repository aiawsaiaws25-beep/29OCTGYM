import { motion } from 'framer-motion'
import { PulseMark } from './Logo'

export default function Loader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl shadow-glow"
      >
        <PulseMark size={48} />
      </motion.div>
      <p className="text-sm text-ink-muted">{label}…</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="glass mx-auto max-w-md rounded-3xl p-8 text-center">
      <p className="font-display text-lg font-semibold">Something went sideways</p>
      <p className="mt-1 text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-xl bg-grad px-4 py-2 text-sm font-semibold text-[#0a0c10] shadow-glow">
          Try again
        </button>
      )}
    </div>
  )
}
