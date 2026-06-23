import { useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Briefcase,
  Download,
  ExternalLink,
  LayoutDashboard,
  RotateCcw,
  Settings,
  Upload,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/features/admin/components/ConfirmDialog'
import { usePortfolioData } from '#/features/data/usePortfolioData'

const NAV = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/admin/projects', label: 'Projets', icon: Briefcase, exact: false },
  { to: '/admin/experiences', label: 'Expériences', icon: Wrench, exact: false },
  { to: '/admin/skills', label: 'Compétences', icon: LayoutDashboard, exact: false },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings, exact: false },
] as const

export function AdminLayout({ children }: { children: ReactNode }) {
  const { data, exportData, importData, resetData } = usePortfolioData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const lastUpdated = new Date(data.lastUpdated)
  const lastUpdatedLabel = Number.isNaN(lastUpdated.getTime())
    ? '—'
    : lastUpdated.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await importData(file)
      toast.success('Données importées avec succès')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import impossible')
    }
  }

  return (
    <div className="flex min-h-svh bg-slate-950 text-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-slate-800 bg-slate-900 p-4 md:flex">
        <span className="px-3 pb-4 font-display text-lg font-extrabold">
          A<span className="text-blue-500">K</span>C
          <span className="ml-2 text-xs font-normal text-slate-500">admin</span>
        </span>
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 [&.active]:bg-blue-500/15 [&.active]:text-blue-400"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-6 py-3">
          <span className="text-xs text-slate-500">
            Dernière modification : {lastUpdatedLabel}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800" onClick={exportData}>
              <Download className="size-4" /> Export
            </Button>
            <Button size="sm" variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Import
            </Button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImport} />
            <Button size="sm" variant="outline" className="border-slate-700 bg-transparent text-red-400 hover:bg-slate-800" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="size-4" /> Réinitialiser
            </Button>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Voir le site
              </a>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Réinitialiser les données ?"
        description="Toutes vos modifications seront remplacées par les données par défaut. Cette action est irréversible."
        confirmLabel="Réinitialiser"
        onConfirm={() => {
          resetData()
          toast.success('Données réinitialisées')
        }}
      />
    </div>
  )
}
