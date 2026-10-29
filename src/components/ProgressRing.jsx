import { motion } from 'framer-motion'
import { ringPercent } from '../lib/progress'

export default function ProgressRing({
  value = 0,
  max = 100,
  size = 120,
  stroke = 10,
  color = 'var(--color-lime)',
  trackColor = 'var(--line)',
  children,
  delay = 0,
  duration = 1.4,
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = ringPercent(value, max)
  const id = `ring-${String(color).replace(/[^a-z0-9]/gi, '')}`

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          filter={`url(#${id})`}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
