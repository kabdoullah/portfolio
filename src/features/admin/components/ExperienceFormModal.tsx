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
import { BulletListInput } from '#/features/admin/components/BulletListInput'
import { TagInput } from '#/features/admin/components/TagInput'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { experienceSchema } from '#/features/data/schemas'
import type { Experience } from '#/features/data/types'

function emptyExperience(order: number): Experience {
  return {
    id: crypto.randomUUID(),
    role: '',
    company: '',
    period: '',
    stack: [],
    bullets: [],
    order,
  }
}

interface ExperienceFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experience?: Experience
  nextOrder: number
}

export function ExperienceFormModal({
  open,
  onOpenChange,
  experience,
  nextOrder,
}: ExperienceFormModalProps) {
  const { dispatch } = usePortfolioData()
  const [draft, setDraft] = useState<Experience>(
    experience ?? emptyExperience(nextOrder),
  )

  useEffect(() => {
    if (open) setDraft(experience ?? emptyExperience(nextOrder))
  }, [open, experience, nextOrder])

  function set<TKey extends keyof Experience>(key: TKey, value: Experience[TKey]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const parsed = experienceSchema.safeParse(draft)
    if (!parsed.success) {
      toast.error('Le poste est requis.')
      return
    }
    dispatch({
      type: experience ? 'UPDATE_EXPERIENCE' : 'ADD_EXPERIENCE',
      payload: parsed.data,
    })
    toast.success(experience ? 'Expérience mise à jour' : 'Expérience ajoutée')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {experience ? "Modifier l'expérience" : 'Nouvelle expérience'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Poste</Label>
              <Input value={draft.role} onChange={(e) => set('role', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Entreprise</Label>
              <Input value={draft.company} onChange={(e) => set('company', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Période</Label>
            <Input
              value={draft.period}
              placeholder="2022 — Présent"
              onChange={(e) => set('period', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Stack technique</Label>
            <TagInput value={draft.stack} onChange={(v) => set('stack', v)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Missions / réalisations</Label>
            <BulletListInput
              value={draft.bullets}
              onChange={(v) => set('bullets', v)}
              placeholder="Une réalisation"
            />
          </div>
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
