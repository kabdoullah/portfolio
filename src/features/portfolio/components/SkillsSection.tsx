import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from '#/components/shared/Reveal'
import { SectionHeader } from '#/components/shared/SectionHeader'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { cn } from '#/lib/utils'
import { SECTION_IDS, SKILL_CATEGORIES } from '#/lib/utils/constants'
import { m } from '#/paraglide/messages'
import type { Skill } from '#/features/data/types'

// Marker opacity encodes proficiency, so each thread carries level at a glance.
const LEVEL_DOT: Record<NonNullable<Skill['level']>, string> = {
  expert: 'bg-secondary',
  advanced: 'bg-secondary/75',
  intermediate: 'bg-secondary/50',
  beginner: 'bg-secondary/30',
}

// Proficiency labels are UI text (the level value itself is mono-language data),
// so each maps to a locale-aware message getter, called at render.
const LEVEL_LABEL: Record<NonNullable<Skill['level']>, () => string> = {
  expert: m.skills_level_expert,
  advanced: m.skills_level_advanced,
  intermediate: m.skills_level_intermediate,
  beginner: m.skills_level_beginner,
}

// Warp threads running along the band's bound edge.
const SELVEDGE_WARP =
  'repeating-linear-gradient(90deg, color-mix(in oklab, var(--thread) 32%, transparent) 0 1px, transparent 1px 7px)'

const weftVariants = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
} as const

/** One category = one woven band: a selvedge label and skills threaded across the weft. */
function CategoryRow({ category, skills }: { category: string; skills: Skill[] }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <Reveal className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
      {/* Selvedge: the band's bound edge, carrying its name. */}
      <div
        className="flex items-center justify-between gap-3 border-b border-thread/40 bg-thread/8 px-5 py-3 md:flex-col md:items-start md:justify-center md:border-r md:border-b-0 md:py-6"
        style={{ backgroundImage: SELVEDGE_WARP }}
      >
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">
          {category}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {String(skills.length).padStart(2, '0')}
        </span>
      </div>

      {/* Weft: skills threaded across, divided by warp lines. */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: 0.06 }}
        className="flex flex-wrap"
      >
        {skills.map((skill) => {
          const level = skill.level ?? 'intermediate'
          return (
            <motion.span
              key={skill.id}
              variants={prefersReducedMotion ? undefined : weftVariants}
              title={`${skill.name} — ${LEVEL_LABEL[level]()}`}
              className="group flex items-center gap-2 border-r border-b border-dashed border-thread/25 px-4 py-3 text-sm font-medium transition-colors hover:bg-primary/8 hover:text-primary"
            >
              <span
                className={cn('size-1.5 rounded-full transition-transform group-hover:scale-125', LEVEL_DOT[level])}
                aria-hidden
              />
              {skill.name}
            </motion.span>
          )
        })}
      </motion.div>
    </Reveal>
  )
}

export function SkillsSection() {
  const { data } = usePortfolioData()
  const { skills } = data

  const rows = SKILL_CATEGORIES.map((category) => ({
    category,
    items: skills.filter((skill) => skill.category === category),
  })).filter((row) => row.items.length > 0)

  if (rows.length === 0) return null

  return (
    <section id={SECTION_IDS.skills} className="scroll-mt-20 py-24">
      <div className="mx-auto w-[min(1120px,calc(100%-2rem))]">
        <SectionHeader
          kicker={m.skills_kicker()}
          title={m.skills_title()}
          subtitle={m.skills_subtitle()}
        />

        <Reveal className="mt-10 overflow-hidden rounded-xl border border-thread/40 bg-card/40 backdrop-blur-sm">
          <div className="divide-y divide-thread/40">
            {rows.map((row) => (
              <CategoryRow key={row.category} category={row.category} skills={row.items} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
