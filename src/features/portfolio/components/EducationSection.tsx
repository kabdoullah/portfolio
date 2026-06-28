import { GraduationCap } from 'lucide-react'
import { Reveal } from '#/components/shared/Reveal'
import { SectionHeader } from '#/components/shared/SectionHeader'
import { useLocalizedPortfolioData } from '#/features/data/useLocalizedPortfolioData'
import { slideInRightVariants } from '#/lib/animations'
import { SECTION_IDS } from '#/lib/utils/constants'
import { m } from '#/paraglide/messages'
import type { Education } from '#/features/data/types'

function TimelineItem({ education, index }: { education: Education; index: number }) {
  return (
    <Reveal variants={slideInRightVariants} className="relative pl-10">
      <span className="absolute left-0 top-0 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-primary/60 bg-background text-primary">
        <GraduationCap className="size-3.5" aria-label={m.education_item({ number: index + 1 })} />
      </span>
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-primary/30">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="font-display text-lg font-bold">{education.degree}</h3>
          <span className="font-mono text-xs text-muted-foreground">
            {education.period}
          </span>
        </div>
        <span className="text-sm text-secondary">{education.school}</span>
        {education.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{education.description}</p>
        ) : null}
      </div>
    </Reveal>
  )
}

export function EducationSection() {
  const { data } = useLocalizedPortfolioData()
  // Education arrives already ordered by the data layer (DB `position`), so it
  // is rendered as-is — there is no `order` field on the Education type.
  const { education } = data

  if (education.length === 0) return null

  return (
    <section id={SECTION_IDS.education} className="scroll-mt-20 py-24">
      <div className="mx-auto w-[min(1120px,calc(100%-2rem))]">
        <SectionHeader kicker={m.education_kicker()} title={m.education_title()} />
        <div className="relative mt-12 flex flex-col gap-8 before:absolute before:bottom-3 before:left-0 before:top-3 before:w-px before:bg-linear-to-b before:from-primary/40 before:via-border before:to-transparent">
          {education.map((item, index) => (
            <TimelineItem key={item.id} education={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
