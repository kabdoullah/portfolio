import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight, Briefcase, GraduationCap, Sparkles, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePortfolioData } from '#/features/data/usePortfolioData'

export const Route = createFileRoute('/admin/')({ component: AdminDashboard })

function CountCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: LucideIcon
  label: string
  value: number
  to: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <span className="flex size-11 items-center justify-center rounded-md bg-primary/12 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="font-mono text-2xl font-bold tabular-nums">
          {String(value).padStart(2, '0')}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <ArrowUpRight className="ml-auto size-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
    </Link>
  )
}

function AdminDashboard() {
  const { data } = usePortfolioData()
  const firstName = data.personalInfo.name.split(' ')[0]
  const featured = data.projects.filter((p) => p.featured).length

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Bonjour, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tout ce que vous modifiez ici est enregistré dans ce navigateur. Exportez une
          sauvegarde pour ne rien perdre.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CountCard icon={Briefcase} label="Projets" value={data.projects.length} to="/admin/projects" />
        <CountCard icon={Wrench} label="Expériences" value={data.experiences.length} to="/admin/experiences" />
        <CountCard icon={Sparkles} label="Compétences" value={data.skills.length} to="/admin/skills" />
        <CountCard icon={GraduationCap} label="Formations" value={data.education.length} to="/admin/settings" />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">État du contenu</h2>
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Projets épinglés</dt>
            <dd className="font-mono tabular-nums text-foreground">
              {String(featured).padStart(2, '0')}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Disponibilité</dt>
            <dd className="flex items-center gap-1.5 text-foreground">
              <span
                className={
                  data.personalInfo.available
                    ? 'size-1.5 rounded-full bg-secondary'
                    : 'size-1.5 rounded-full bg-muted-foreground'
                }
                aria-hidden
              />
              {data.personalInfo.available ? 'Disponible pour missions' : 'Indisponible'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
