import { motion } from 'framer-motion'
import { useScrollProgress } from '#/features/portfolio/hooks/useScrollProgress'

/** Thin gradient progress bar fixed to the top of the viewport. */
export function ScrollProgress() {
  const scaleX = useScrollProgress()
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-primary to-secondary"
      aria-hidden
    />
  )
}
