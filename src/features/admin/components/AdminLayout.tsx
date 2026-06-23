import { useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Briefcase,
  Download,
  ExternalLink,
  LayoutDashboard,
  RotateCcw,
  Settings,
  Sparkles,
  Upload,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/features/admin/components/ConfirmDialog'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { cn } from '#/lib/utils'

const NAV = [
  { to: '/admin', label: 'Atelier', icon: LayoutDashboard, exact: true },
  { to: '/admin/projects', label: 'Projets', icon: Briefcase, exact: false },
  { to: '/admin/experiences', label: 'Expériences', icon: Wrench, exact: false },
  { to: '/admin/skills', label: 'Compétences', icon: Sparkles, exact: false },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings, exact: false },
] as const satisfies ReadonlyArray<{
  to: string
  label: string
  icon: LucideIcon
  exact: boolean
}>

// Warp threads running down the rail — the strung loom you work at.
const WARP_RAIL =
  'repeating-linear-gradient(90deg, color-mix(in oklab, var(--thread) 14%, transparent) 0 1px, transparent 1px 9px)'

export function AdminLayout({ children }: { children: ReactNode }) {
  const { data, exportData, importData, resetData } = usePortfolioData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const { pathname } = useLocation()

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
      toast.success('Sauvegarde importée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fichier illisible — exportez une sauvegarde valide.')
    }
  }

  return (
    <div className="admin flex min-h-svh bg-background text-foreground">
      {/* Warp rail — the loom you string content onto. */}
      <aside
        className="hidden w-60 shrink-0 flex-col border-r border-thread/40 bg-card/40 p-4 md:flex"
        style={{ backgroundImage: WARP_RAIL }}
      >
        <span className="flex items-baseline gap-2 px-3 pb-6 font-display text-lg font-extrabold tracking-tight">
          A<span className="text-primary">K</span>C
          <span className="font-mono text-[0.65rem] font-normal uppercase tracking-[0.2em] text-muted-foreground">
            atelier
          </span>
        </span>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      layoutId={prefersReducedMotion ? undefined : 'admin-weft'}
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    >
                      {/* The knot — where the weft is tied off against the warp. */}
                      <span className="absolute top-1/2 left-0 size-1.5 -translate-x-1/3 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card" />
                    </motion.span>
                  ) : null}
                  <span
                    className={cn(
                      'absolute inset-0 rounded-md bg-primary/0 transition-colors',
                      isActive && 'bg-primary/8',
                    )}
                    aria-hidden
                  />
                  <Icon className="relative size-4" />
                  <span className="relative">{label}</span>
                </>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/30 px-6 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            Enregistré&nbsp;: <span className="text-foreground/80">{lastUpdatedLabel}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportData}>
              <Download className="size-4" /> Exporter
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Importer
            </Button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImport} />
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw className="size-4" /> Réinitialiser
            </Button>
            <Button asChild size="sm">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Voir le site
              </a>
            </Button>
          </div>
        </header>

        {/* Mobile nav — the rail folds into a scrollable strip. */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card/30 px-3 py-2 md:hidden">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-6">
          {prefersReducedMotion ? (
            children
          ) : (
            // The worked section weaves in from the rail on each route change.
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Tout remettre aux valeurs par défaut ?"
        description="Vos projets, expériences et compétences seront remplacés par le contenu d'origine. Exportez une sauvegarde d'abord — cette action ne s'annule pas."
        confirmLabel="Réinitialiser"
        onConfirm={() => {
          resetData()
          toast.success('Contenu réinitialisé')
        }}
      />
    </div>
  )
}
