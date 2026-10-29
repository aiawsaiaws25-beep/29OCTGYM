import { motion } from 'framer-motion'

const variants = {
  primary:
    'bg-grad text-[#0a0c10] font-semibold shadow-glow hover:shadow-[0_0_60px_-8px_color-mix(in_oklab,var(--color-lime)_80%,transparent)]',
  ghost: 'glass text-ink hover:bg-surface-strong',
  outline: 'border border-line text-ink hover:border-lime/60 hover:text-lime',
  danger: 'bg-magenta/15 text-magenta border border-magenta/30 hover:bg-magenta/25',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm rounded-xl',
  md: 'px-5 py-3 text-sm rounded-2xl',
  lg: 'px-7 py-4 text-base rounded-2xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconRight: IconRight,
  disabled,
  ...rest
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-display font-semibold tracking-tight transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === 'lg' ? 20 : 18} />}
      {children}
      {IconRight && <IconRight size={size === 'lg' ? 20 : 18} />}
    </motion.button>
  )
}
