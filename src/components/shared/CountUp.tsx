import { animate, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useScrollAnimation } from '#/hooks/useScrollAnimation'

/**
 * Animates the numeric part of a stat value (e.g. "10+") from 0 when scrolled
 * into view, preserving any non-numeric prefix/suffix. Static if reduced motion.
 */
export function CountUp({ value }: { value: string }) {
  const match = value.match(/(\d+)/)
  const target = match ? Number(match[1]) : 0
  const [prefix, suffix] = match
    ? [value.slice(0, match.index), value.slice((match.index ?? 0) + match[1].length)]
    : ['', value]

  const prefersReducedMotion = useReducedMotion()
  const { ref, isInView } = useScrollAnimation(0.5)
  const [display, setDisplay] = useState(0)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!isInView || hasRun.current || !match) return
    hasRun.current = true
    if (prefersReducedMotion) {
      setDisplay(target)
      return
    }
    const controls = animate(0, target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [isInView, target, prefersReducedMotion, match])

  return (
    <span ref={ref}>
      {match ? `${prefix}${display}${suffix}` : value}
    </span>
  )
}
