import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { TYPING } from '#/lib/utils/constants'

/**
 * Cycles through `phrases`, typing and deleting each one. With reduced motion
 * preferred, it just shows the first phrase statically.
 */
export function useTypingEffect(phrases: string[]): string {
  const prefersReducedMotion = useReducedMotion()
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion || phrases.length === 0) return

    const current = phrases[phraseIndex % phrases.length]
    const isPhraseComplete = !isDeleting && text === current
    const isPhraseEmpty = isDeleting && text === ''

    let delay: number = isDeleting ? TYPING.delete : TYPING.type
    if (isPhraseComplete) delay = TYPING.holdFull
    if (isPhraseEmpty) delay = TYPING.holdEmpty

    const timeout = setTimeout(() => {
      if (isPhraseComplete) {
        setIsDeleting(true)
        return
      }
      if (isPhraseEmpty) {
        setIsDeleting(false)
        setPhraseIndex((i) => (i + 1) % phrases.length)
        return
      }
      const nextLength = text.length + (isDeleting ? -1 : 1)
      setText(current.slice(0, nextLength))
    }, delay)

    return () => clearTimeout(timeout)
  }, [text, isDeleting, phraseIndex, phrases, prefersReducedMotion])

  if (prefersReducedMotion) return phrases[0] ?? ''
  return text
}
