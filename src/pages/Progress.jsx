import { useState } from 'react'
import { motion } from 'framer-motion'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Trophy, TrendingUp, Medal } from 'lucide-react'
import PageTransition, { PageHeader, stagger, fadeUp } from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import { strengthHistory, personalRecords } from '../data/mockData'

const lifts = [
  { key: 'squat', label: 'Squat', color: 'var(--color-lime)' },
  { key: 'bench', label: 'Bench', color: 'var(--color-cyan)' },
  { key: 'deadlift', label: 'Deadlift', color: 'var(--color-magenta)' },
]

const tierStyle = {
  gold: 'from-amber to-[#ffd98a] text-[#0a0c10] shadow-[0_0_30px_-6px_var(--color-amber)]',
  silver: 'from-[#cfd8e3] to-white text-[#0a0c10]',
  bronze: 'from-[#c98a4b] to-[#e6b283] text-[#0a0c10]',
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.stroke }}>
          {p.name}: {p.value} kg
        </p>
      ))}
    </div>
  )
}

export default function Progress() {
  const [visible, setVisible] = useState(lifts.map((l) => l.key))
  const first = strengthHistory[0]
  const last = strengthHistory[strengthHistory.length - 1]
  const totalGain = lifts.reduce((a, l) => a + (last[l.key] - first[l.key]), 0)

  return (
    <PageTransition>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <PageHeader eyebrow="Progress" title="Strength gains" subtitle="Your big three, month by month." />

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          {lifts.map((l, i) => (
            <motion.div key={l.key} variants={fadeUp}>
              <GlassCard className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `color-mix(in oklab, ${l.color} 18%, transparent)`, color: l.color }}>
                  <TrendingUp size={20} />
                </span>
                <div>
                  <p className="text-xs text-ink-muted">{l.label} 1RM</p>
                  <p className="font-display text-2xl font-bold">
                    <AnimatedCounter value={last[l.key]} decimals={last[l.key] % 1 ? 1 : 0} duration={1.2 + i * 0.2} /> kg
                  </p>
                  <p className="text-xs font-semibold text-lime">+{last[l.key] - first[l.key]} kg this year</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp}>
          <GlassCard hover={false} className="mb-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Strength over time</h2>
                <p className="text-xs text-ink-muted">+{totalGain} kg total across the big three</p>
              </div>
              <div className="flex gap-2">
                {lifts.map((l) => {
                  const on = visible.includes(l.key)
                  return (
                    <button
                      key={l.key}
                      onClick={() => setVisible((v) => (on ? v.filter((k) => k !== l.key) : [...v, l.key]))}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${on ? 'border-line bg-surface-strong text-ink' : 'border-transparent text-ink-faint'}`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: l.color, opacity: on ? 1 : 0.3 }} />
                      {l.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthHistory} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-faint)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-faint)', fontSize: 12 }} unit="" />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--line)' }} />
                  {lifts.filter((l) => visible.includes(l.key)).map((l, i) => (
                    <Line
                      key={l.key}
                      type="monotone"
                      dataKey={l.key}
                      name={l.label}
                      stroke={l.color}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: l.color, stroke: 'var(--bg-elev)', strokeWidth: 2 }}
                      animationDuration={1500}
                      animationBegin={i * 200}
                      animationEasing="ease-out"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-3 flex items-center gap-2">
          <Trophy size={20} className="text-amber" />
          <h2 className="font-display text-lg font-semibold">Personal records</h2>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {personalRecords.map((pr, i) => (
            <motion.div key={pr.id} variants={fadeUp}>
              <GlassCard className="flex items-center gap-4">
                <motion.span
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.3 + i * 0.1 }}
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tierStyle[pr.tier]}`}
                >
                  {pr.tier === 'gold' ? <Trophy size={26} /> : <Medal size={26} />}
                </motion.span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-ink-muted">{pr.lift}</p>
                  <p className="font-display text-2xl font-bold">
                    {pr.value}
                    {pr.unit && <span className="text-base text-ink-muted"> {pr.unit}</span>}
                  </p>
                  <p className="text-xs text-ink-faint">
                    <span className="font-semibold text-lime">{pr.delta}</span> · {new Date(pr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </PageTransition>
  )
}
