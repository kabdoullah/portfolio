import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { SCROLL_REVEAL_AMOUNT } from '#/lib/utils/constants'

/** Ref + in-view flag for one-shot scroll-reveal animations. */
export function useScrollAnimation(amount: number = SCROLL_REVEAL_AMOUNT) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount })
  return { ref, isInView }
}
