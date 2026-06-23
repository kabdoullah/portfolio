import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/features/admin/components/ConfirmDialog'
import { ProjectFormModal } from '#/features/admin/components/ProjectFormModal'
import { SortableList } from '#/features/admin/components/SortableList'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import type { Project } from '#/features/data/types'

export const Route = createFileRoute('/admin/projects')({ component: AdminProjects })

function AdminProjects() {
  const { data, dispatch } = usePortfolioData()
  const projects = [...data.projects].sort((a, b) => a.order - b.order)

  const [editing, setEditing] = useState<Project | undefined>(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Project | null>(null)

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(project: Project) {
    setEditing(project)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Projets{' '}
          <span className="font-mono text-lg font-normal tabular-nums text-muted-foreground">
            {String(projects.length).padStart(2, '0')}
          </span>
        </h1>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Ajouter un projet
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucun projet pour l’instant. Ajoutez-en un pour le voir apparaître sur le site.
        </p>
      ) : (
        <SortableList
          items={projects}
          onReorder={(orderedIds) =>
            dispatch({ type: 'REORDER_PROJECTS', payload: orderedIds })
          }
          renderItem={(project) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{project.title}</span>
                  {project.featured ? (
                    <Badge variant="secondary" className="text-xs">
                      Épinglé
                    </Badge>
                  ) : null}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {project.type} · {project.year}
                </span>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Modifier ${project.title}`}
                  onClick={() => openEdit(project)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Supprimer ${project.title}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleting(project)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          )}
        />
      )}

      <ProjectFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editing}
        nextOrder={projects.length}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer ce projet ?"
        description={deleting?.title}
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (deleting) {
            dispatch({ type: 'DELETE_PROJECT', payload: deleting.id })
            toast.success('Projet supprimé')
          }
        }}
      />
    </div>
  )
}
