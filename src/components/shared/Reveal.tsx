import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { useScrollAnimation } from '#/hooks/useScrollAnimation'
import { fadeUpVariants } from '#/lib/animations'
import { cn } from '#/lib/utils'

interface RevealProps {
  children: ReactNode
  variants?: Variants
  className?: string
  /** Override the default in-view threshold. */
  amount?: number
}

/** Wraps content in a one-shot scroll-reveal motion container. */
export function Reveal({
  children,
  variants = fadeUpVariants,
  className,
  amount,
}: RevealProps) {
  const { ref, isInView } = useScrollAnimation(amount)
  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
