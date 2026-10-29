import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = true, glow = false, ...rest }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`glass relative rounded-3xl p-5 ${glow ? 'shadow-glow' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
