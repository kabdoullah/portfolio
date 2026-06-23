import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { SKILL_CATEGORIES } from '#/lib/utils/constants'
import type { SkillCategory } from '#/features/data/types'

export const Route = createFileRoute('/admin/skills')({ component: AdminSkills })

function AdminSkills() {
  const { data, dispatch } = usePortfolioData()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SkillCategory>('Backend')

  function addSkill() {
    const trimmed = name.trim()
    if (!trimmed) return
    dispatch({
      type: 'ADD_SKILL',
      payload: { id: crypto.randomUUID(), name: trimmed, category },
    })
    setName('')
    toast.success(`« ${trimmed} » ajoutée`)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Compétences{' '}
        <span className="font-mono text-lg font-normal tabular-nums text-muted-foreground">
          {String(data.skills.length).padStart(2, '0')}
        </span>
      </h1>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-4">
        <Input
          className="w-48"
          placeholder="Nom de la compétence"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
        />
        <Select value={category} onValueChange={(v) => setCategory(v as SkillCategory)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKILL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addSkill}>
          <Plus className="size-4" /> Ajouter
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {SKILL_CATEGORIES.map((cat) => {
          const skills = data.skills.filter((s) => s.category === cat)
          if (skills.length === 0) return null
          return (
            <div key={cat} className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-secondary">
                <span className="h-px w-5 bg-secondary/50" aria-hidden />
                {cat}
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="gap-1.5 py-1.5">
                    {skill.name}
                    <button
                      type="button"
                      aria-label={`Supprimer ${skill.name}`}
                      className="rounded-full hover:text-destructive"
                      onClick={() => {
                        dispatch({ type: 'DELETE_SKILL', payload: skill.id })
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
