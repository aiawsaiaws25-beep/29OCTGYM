import { useId } from 'react'
import { Link } from 'react-router-dom'

export function PulseMark({ size = 28 }) {
  const gradId = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c6ff3d" />
          <stop offset="1" stopColor="#22e6ff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0a0c10" />
      <polyline
        points="8,34 18,34 24,20 32,46 40,26 46,34 56,34"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Logo({ size = 'md', to = '/' }) {
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl'
  const mark = size === 'lg' ? 36 : size === 'sm' ? 24 : 28
  return (
    <Link to={to} className="group inline-flex items-center gap-2 select-none">
      <span className="relative inline-flex">
        <span className="absolute inset-0 rounded-xl bg-grad opacity-0 blur-md transition-opacity group-hover:opacity-70" />
        <PulseMark size={mark} />
      </span>
      <span className={`font-display ${text} font-bold tracking-tight text-gradient`}>PulseFit</span>
    </Link>
  )
}
