const tones = {
  lime: 'bg-lime/15 text-lime border-lime/30',
  cyan: 'bg-cyan/15 text-cyan border-cyan/30',
  magenta: 'bg-magenta/15 text-magenta border-magenta/30',
  amber: 'bg-amber/15 text-amber border-amber/30',
  neutral: 'bg-surface-strong text-ink-muted border-line',
}

export const difficultyTone = { Beginner: 'cyan', Intermediate: 'lime', Advanced: 'magenta' }

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
