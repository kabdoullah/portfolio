import { useState } from 'react'
import { motion } from 'framer-motion'
import { ProjectCard } from '#/features/portfolio/components/ProjectCard'
import { Reveal } from '#/components/shared/Reveal'
import { SectionHeader } from '#/components/shared/SectionHeader'
import { Button } from '#/components/ui/button'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { staggerContainerVariants } from '#/lib/animations'
import { PROJECT_FILTERS, SECTION_IDS } from '#/lib/utils/constants'
import type { ProjectFilter } from '#/lib/utils/constants'
import { m } from '#/paraglide/messages'

// Project-type filters mirror the mono-language `project.type` data, so their
// labels stay untranslated to match the card badges; only the "all" sentinel,
// which is UI-only, is localized.
function filterLabel(filter: ProjectFilter): string {
  return filter === 'Tous' ? m.projects_filter_all() : filter
}

export function ProjectsSection() {
  const { data } = usePortfolioData()
  const [filter, setFilter] = useState<ProjectFilter>('Tous')

  // Featured first, then by explicit order.
  const sorted = [...data.projects].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    return a.order - b.order
  })

  const visible =
    filter === 'Tous' ? sorted : sorted.filter((p) => p.type === filter)

  return (
    <section id={SECTION_IDS.projects} className="scroll-mt-20 py-24">
      <div className="mx-auto w-[min(1120px,calc(100%-2rem))]">
        <SectionHeader
          kicker={m.projects_kicker()}
          title={m.projects_title()}
          subtitle={m.projects_subtitle()}
        />

        <Reveal className="mt-8 flex flex-wrap justify-center gap-2">
          {PROJECT_FILTERS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={filter === option ? 'default' : 'outline'}
              onClick={() => setFilter(option)}
            >
              {filterLabel(option)}
            </Button>
          ))}
        </Reveal>

        <motion.div
          key={filter}
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="mt-10 grid gap-6 md:grid-cols-2"
        >
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>

        {visible.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">
            {m.projects_empty()}
          </p>
        ) : null}
      </div>
    </section>
  )
}
