import { useScroll, useSpring } from 'framer-motion'

/** Smoothed 0→1 page scroll progress, ready to bind to a top progress bar's scaleX. */
export function useScrollProgress() {
  const { scrollYProgress } = useScroll()
  return useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })
}
