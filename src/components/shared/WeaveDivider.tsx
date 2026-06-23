import { motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { cn } from '#/lib/utils'

const THREAD_DASH =
  'repeating-linear-gradient(90deg, color-mix(in oklab, var(--thread) 55%, transparent) 0 8px, transparent 8px 16px)'

// A shuttle passing left→right: threads draw outward, knots tie in between.
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const thread: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

const knot: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: 'backOut' } },
}

/**
 * A weft-stitch rule: a dashed thread crossed by three warp knots, woven across
 * on scroll. Marks the seam between sections. Presentational only.
 */
export function WeaveDivider({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      aria-hidden
      variants={prefersReducedMotion ? undefined : container}
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.8 }}
      className={cn(
        'mx-auto flex w-[min(1120px,calc(100%-2rem))] items-center gap-3',
        className,
      )}
    >
      <motion.span
        variants={thread}
        className="h-px flex-1 origin-left"
        style={{ backgroundImage: THREAD_DASH }}
      />
      <span className="flex items-center gap-1.5">
        <motion.span variants={knot} className="size-1 rounded-full bg-thread/70" />
        <motion.span variants={knot} className="size-1 rounded-full bg-primary/80" />
        <motion.span variants={knot} className="size-1 rounded-full bg-thread/70" />
      </span>
      <motion.span
        variants={thread}
        className="h-px flex-1 origin-left"
        style={{ backgroundImage: THREAD_DASH }}
      />
    </motion.div>
  )
}
