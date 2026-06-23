import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/features/admin/components/ConfirmDialog'
import { ExperienceFormModal } from '#/features/admin/components/ExperienceFormModal'
import { SortableList } from '#/features/admin/components/SortableList'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import type { Experience } from '#/features/data/types'

export const Route = createFileRoute('/admin/experiences')({
  component: AdminExperiences,
})

function AdminExperiences() {
  const { data, dispatch } = usePortfolioData()
  const experiences = [...data.experiences].sort((a, b) => a.order - b.order)

  const [editing, setEditing] = useState<Experience | undefined>(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Experience | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">
          Expériences <span className="text-slate-500">({experiences.length})</span>
        </h1>
        <Button
          className="bg-blue-600 hover:bg-blue-500"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" /> Ajouter
        </Button>
      </div>

      {experiences.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune expérience.</p>
      ) : (
        <SortableList
          items={experiences}
          onReorder={(orderedIds) =>
            dispatch({ type: 'REORDER_EXPERIENCES', payload: orderedIds })
          }
          renderItem={(experience) => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="truncate font-medium">{experience.role}</span>
                <div className="text-xs text-slate-500">
                  {experience.company} · {experience.period}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Modifier ${experience.role}`}
                  onClick={() => {
                    setEditing(experience)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Supprimer ${experience.role}`}
                  className="text-red-400"
                  onClick={() => setDeleting(experience)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          )}
        />
      )}

      <ExperienceFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        experience={editing}
        nextOrder={experiences.length}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer cette expérience ?"
        description={deleting?.role}
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (deleting) {
            dispatch({ type: 'DELETE_EXPERIENCE', payload: deleting.id })
            toast.success('Expérience supprimée')
          }
        }}
      />
    </div>
  )
}
