import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import type { MouseEvent } from 'react'
import { ArrowUpRight, Github, Star } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { staggerItemVariants } from '#/lib/animations'
import { m } from '#/paraglide/messages'
import type { Project } from '#/features/data/types'

// Pointer tilt is intentionally subtle — a hint of depth, not a toy.
const MAX_TILT = 5

/** Presentational project card with pointer-tracked 3D tilt (off when reduced-motion). */
export function ProjectCard({ project }: { project: Project }) {
  const prefersReducedMotion = useReducedMotion()
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 })
  const transform = useMotionTemplate`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * MAX_TILT * 2)
    rotateX.set(-py * MAX_TILT * 2)
  }

  function handleLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.article
      variants={staggerItemVariants}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={prefersReducedMotion ? undefined : { transform }}
      className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card/70 p-6 backdrop-blur-sm transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent),0_18px_40px_-24px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
    >
      {/* Warp stripe — a woven selvedge along the card's top edge. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 opacity-60 transition-opacity group-hover:opacity-100"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, var(--primary) 0 2px, transparent 2px 7px)',
        }}
      />

      {/* Woven cloth — warp + weft thread in on hover, densest under the selvedge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, color-mix(in oklab, var(--thread) 30%, transparent) 0 1px, transparent 1px 9px), repeating-linear-gradient(0deg, color-mix(in oklab, var(--thread) 20%, transparent) 0 1px, transparent 1px 9px)',
          maskImage: 'linear-gradient(to bottom, black, transparent 72%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 72%)',
        }}
      />
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {project.featured ? (
              <Star className="size-4 fill-secondary text-secondary" aria-label={m.projects_card_pinned()} />
            ) : null}
            <h3 className="font-display text-lg font-bold transition-colors group-hover:text-primary">
              {project.title}
            </h3>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {project.type} · {project.year}
          </span>
        </div>
        <div className="flex gap-1">
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={m.projects_card_source({ title: project.title })}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Github className="size-4" />
            </a>
          ) : null}
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={m.projects_card_view_live({ title: project.title })}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowUpRight className="size-4" />
            </a>
          ) : null}
        </div>
      </header>

      <p className="text-sm text-muted-foreground">{project.description}</p>

      {project.highlights.length > 0 ? (
        <ul className="flex flex-col gap-1.5 text-sm">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
              {highlight}
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-auto flex flex-wrap gap-2 pt-2">
        {project.stack.map((tech) => (
          <Badge key={tech} variant="secondary" className="font-mono text-xs">
            {tech}
          </Badge>
        ))}
      </footer>
    </motion.article>
  )
}
