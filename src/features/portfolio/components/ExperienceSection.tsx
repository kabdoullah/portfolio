import { Reveal } from '#/components/shared/Reveal'
import { SectionHeader } from '#/components/shared/SectionHeader'
import { Badge } from '#/components/ui/badge'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { slideInRightVariants } from '#/lib/animations'
import { SECTION_IDS } from '#/lib/utils/constants'
import type { Experience } from '#/features/data/types'

function TimelineItem({
  experience,
  index,
}: {
  experience: Experience
  index: number
}) {
  return (
    <Reveal variants={slideInRightVariants} className="relative pl-10">
      <span className="absolute left-0 top-0 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-primary/60 bg-background font-mono text-xs font-medium text-primary">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-primary/30">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="font-display text-lg font-bold">{experience.role}</h3>
          <span className="font-mono text-xs text-muted-foreground">
            {experience.period}
          </span>
        </div>
        <span className="text-sm text-secondary">{experience.company}</span>
        <ul className="mt-1 flex flex-col gap-1.5 text-sm text-muted-foreground">
          {experience.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
              {bullet}
            </li>
          ))}
        </ul>
        {experience.stack.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {experience.stack.map((tech) => (
              <Badge key={tech} variant="secondary" className="font-mono text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Reveal>
  )
}

export function ExperienceSection() {
  const { data } = usePortfolioData()
  const experiences = [...data.experiences].sort((a, b) => a.order - b.order)

  if (experiences.length === 0) return null

  return (
    <section id={SECTION_IDS.experience} className="scroll-mt-20 py-24">
      <div className="mx-auto w-[min(1120px,calc(100%-2rem))]">
        <SectionHeader kicker="Parcours" title="Expérience" />
        <div className="relative mt-12 flex flex-col gap-8 before:absolute before:bottom-3 before:left-0 before:top-3 before:w-px before:bg-linear-to-b before:from-primary/40 before:via-border before:to-transparent">
          {experiences.map((experience, index) => (
            <TimelineItem
              key={experience.id}
              experience={experience}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
