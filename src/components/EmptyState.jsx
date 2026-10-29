import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col items-center justify-center rounded-3xl px-6 py-14 text-center"
    >
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-strong text-ink-faint">
          <Icon size={30} />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-ink-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
