import { createFileRoute, Link } from '@tanstack/react-router'
import { Briefcase, GraduationCap, Sparkles, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePortfolioData } from '#/features/data/usePortfolioData'

export const Route = createFileRoute('/admin/')({ component: AdminDashboard })

function StatCard({
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
      className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-blue-500/40"
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
        <Icon className="size-5" />
      </span>
      <div>
        <div className="font-display text-2xl font-bold">{value}</div>
        <div className="text-sm text-slate-400">{label}</div>
      </div>
    </Link>
  )
}

function AdminDashboard() {
  const { data } = usePortfolioData()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-slate-400">
          Bienvenue, {data.personalInfo.name.split(' ')[0]}. Gérez le contenu de votre portfolio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Projets" value={data.projects.length} to="/admin/projects" />
        <StatCard icon={Wrench} label="Expériences" value={data.experiences.length} to="/admin/experiences" />
        <StatCard icon={Sparkles} label="Compétences" value={data.skills.length} to="/admin/skills" />
        <StatCard icon={GraduationCap} label="Formations" value={data.education.length} to="/admin/settings" />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-display text-lg font-semibold">Aperçu</h2>
        <p className="mt-2 text-sm text-slate-400">
          {data.projects.filter((p) => p.featured).length} projet(s) épinglé(s) ·{' '}
          {data.personalInfo.available ? 'Disponible pour missions' : 'Indisponible'}
        </p>
      </div>
    </div>
  )
}
