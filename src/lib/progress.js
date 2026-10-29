/** Share of a goal in [0, 1]. Never NaN, never above 1. Shared by the progress rings. */
export function ringPercent(value, max) {
  const v = Number(value)
  const m = Number(max)
  if (!Number.isFinite(v) || !Number.isFinite(m) || m <= 0) return 0
  return Math.min(1, Math.max(0, v / m))
}
