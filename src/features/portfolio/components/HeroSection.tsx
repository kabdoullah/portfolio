import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, Download, Mail, MapPin } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useLocalizedPortfolioData } from '#/features/data/useLocalizedPortfolioData'
import { useTypingEffect } from '#/features/portfolio/hooks/useTypingEffect'
import { staggerContainerVariants, staggerItemVariants } from '#/lib/animations'
import { SECTION_IDS } from '#/lib/utils/constants'
import { m } from '#/paraglide/messages'

// Warp threads that draw down on page load — the loom being strung.
const WARP_COUNT = 7

export function HeroSection() {
  const { data } = useLocalizedPortfolioData()
  const { name, taglines, available, location, email, cvUrl } = data.personalInfo
  const typed = useTypingEffect(taglines)
  const prefersReducedMotion = useReducedMotion()

  // Emphasise the surname (last word) with the single accent gradient.
  const parts = name.trim().split(/\s+/)
  const lead = parts.slice(0, -1).join(' ')
  const surname = parts.at(-1) ?? name

  return (
    <section
      id={SECTION_IDS.hero}
      className="relative flex min-h-svh items-center overflow-hidden pt-16"
    >
      {/* Warp: vertical threads strung across the hero on load. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mx-auto w-[min(1120px,calc(100%-2rem))]"
      >
        {Array.from({ length: WARP_COUNT }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute top-0 bottom-0 w-px bg-linear-to-b from-transparent via-thread/35 to-transparent"
            style={{ left: `${(i / (WARP_COUNT - 1)) * 100}%` }}
            initial={prefersReducedMotion ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              duration: 1,
              delay: 0.15 + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </div>

      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto flex w-[min(1120px,calc(100%-2rem))] flex-col items-start gap-7"
      >
        {available ? (
          <motion.div
            variants={staggerItemVariants}
            className="flex w-fit items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1.5"
          >
            <span className="size-2 animate-pulse rounded-full bg-secondary" />
            <span className="text-xs font-medium tracking-wide">
              {m.hero_available()}
            </span>
          </motion.div>
        ) : null}

        <motion.h1
          variants={staggerItemVariants}
          className="font-display text-5xl font-extrabold leading-[0.92] tracking-tight text-balance sm:text-7xl lg:text-[5.75rem]"
        >
          {lead ? <span className="block">{lead}</span> : null}
          <span className="block text-gradient">{surname}</span>
        </motion.h1>

        {/* Weft: the role woven across, marked by a thread dash. */}
        <motion.p
          variants={staggerItemVariants}
          className="flex items-center gap-3 font-mono text-lg text-primary sm:text-2xl"
          aria-live="polite"
        >
          <span className="hidden h-px w-8 bg-primary/60 sm:inline-block" aria-hidden />
          {typed}
          <span className="inline-block w-0.5 animate-pulse self-stretch bg-primary align-middle">
            &nbsp;
          </span>
        </motion.p>

        <motion.p
          variants={staggerItemVariants}
          className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          {m.hero_intro()}
        </motion.p>

        <motion.div variants={staggerItemVariants} className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={`#${SECTION_IDS.projects}`}>{m.hero_cta_projects()}</a>
          </Button>
          {cvUrl ? (
            <Button asChild size="lg" variant="outline">
              <a href={cvUrl} target="_blank" rel="noreferrer" download>
                <Download className="size-4" /> {m.hero_cta_cv()}
              </a>
            </Button>
          ) : null}
          <Button asChild size="lg" variant="outline">
            <a href={`#${SECTION_IDS.contact}`}>
              <Mail className="size-4" /> {m.hero_cta_contact()}
            </a>
          </Button>
        </motion.div>

        <motion.div
          variants={staggerItemVariants}
          className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground"
        >
          {location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-secondary" /> {location}
            </span>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="transition-colors hover:text-foreground"
            >
              {email}
            </a>
          ) : null}
        </motion.div>
      </motion.div>

      <motion.a
        href={`#${SECTION_IDS.about}`}
        aria-label={m.hero_scroll_down()}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground transition-colors hover:text-foreground"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      >
        <ArrowDown className="size-5" />
      </motion.a>
    </section>
  )
}
