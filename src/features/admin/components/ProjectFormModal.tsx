import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { BulletListInput } from '#/features/admin/components/BulletListInput'
import { TagInput } from '#/features/admin/components/TagInput'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { projectSchema } from '#/features/data/schemas'
import type { Project, ProjectType } from '#/features/data/types'

const PROJECT_TYPES: ProjectType[] = ['Freelance', 'Entreprise', 'Personnel']

function emptyProject(order: number): Project {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    stack: [],
    type: 'Personnel',
    year: String(new Date().getFullYear()),
    liveUrl: '',
    githubUrl: '',
    highlights: [],
    featured: false,
    order,
  }
}

interface ProjectFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Project to edit; when omitted, the form creates a new one. */
  project?: Project
  nextOrder: number
}

export function ProjectFormModal({
  open,
  onOpenChange,
  project,
  nextOrder,
}: ProjectFormModalProps) {
  const { dispatch } = usePortfolioData()
  const [draft, setDraft] = useState<Project>(project ?? emptyProject(nextOrder))

  // Reset the form whenever the dialog opens for a different item.
  useEffect(() => {
    if (open) setDraft(project ?? emptyProject(nextOrder))
  }, [open, project, nextOrder])

  function set<TKey extends keyof Project>(key: TKey, value: Project[TKey]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const parsed = projectSchema.safeParse(draft)
    if (!parsed.success) {
      toast.error('Vérifiez les champs : titre requis, URLs valides.')
      return
    }
    dispatch({
      type: project ? 'UPDATE_PROJECT' : 'ADD_PROJECT',
      payload: parsed.data,
    })
    toast.success(project ? 'Projet mis à jour' : 'Projet ajouté')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? 'Modifier le projet' : 'Nouveau projet'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label="Titre">
            <Input value={draft.title} onChange={(e) => set('title', e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={draft.type} onValueChange={(v) => set('type', v as ProjectType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Année">
              <Input value={draft.year} onChange={(e) => set('year', e.target.value)} />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              rows={3}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="URL en ligne">
              <Input value={draft.liveUrl ?? ''} onChange={(e) => set('liveUrl', e.target.value)} />
            </Field>
            <Field label="URL GitHub">
              <Input value={draft.githubUrl ?? ''} onChange={(e) => set('githubUrl', e.target.value)} />
            </Field>
          </div>

          <Field label="Stack technique">
            <TagInput value={draft.stack} onChange={(v) => set('stack', v)} placeholder="Java, React…" />
          </Field>

          <Field label="Points clés">
            <BulletListInput
              value={draft.highlights}
              onChange={(v) => set('highlights', v)}
              placeholder="Un point fort du projet"
            />
          </Field>

          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium">Épingler en avant</span>
            <Switch checked={draft.featured} onCheckedChange={(v) => set('featured', v)} />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
