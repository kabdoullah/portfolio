import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { BulletListInput } from '#/features/admin/components/BulletListInput'
import { usePortfolioData } from '#/features/data/usePortfolioData'
import { personalInfoSchema } from '#/features/data/schemas'
import type { Education, PersonalInfo, Stat } from '#/features/data/types'

export const Route = createFileRoute('/admin/settings')({ component: AdminSettings })

function AdminSettings() {
  const { data, dispatch } = usePortfolioData()
  const [draft, setDraft] = useState<PersonalInfo>(data.personalInfo)

  function set<TKey extends keyof PersonalInfo>(key: TKey, value: PersonalInfo[TKey]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('profilePhoto', String(reader.result))
    reader.readAsDataURL(file)
  }

  function updateStat(index: number, patch: Partial<Stat>) {
    set(
      'stats',
      draft.stats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)),
    )
  }

  function handleSave() {
    const parsed = personalInfoSchema.safeParse(draft)
    if (!parsed.success) {
      toast.error('Vérifiez les champs (email valide, nom requis).')
      return
    }
    dispatch({ type: 'UPDATE_PERSONAL_INFO', payload: parsed.data })
    toast.success('Informations enregistrées')
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Paramètres</h1>
        <Button className="bg-blue-600 hover:bg-blue-500" onClick={handleSave}>
          <Save className="size-4" /> Enregistrer
        </Button>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-300">Photo de profil</h2>
        <div className="flex items-center gap-4">
          {draft.profilePhoto ? (
            <img
              src={draft.profilePhoto}
              alt="Aperçu"
              className="size-20 rounded-xl object-cover"
            />
          ) : (
            <div className="size-20 rounded-xl bg-slate-800" />
          )}
          <Input type="file" accept="image/*" onChange={handlePhoto} className="max-w-xs" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6 sm:grid-cols-2">
        <FieldText label="Nom" value={draft.name} onChange={(v) => set('name', v)} />
        <FieldText label="Titre" value={draft.title} onChange={(v) => set('title', v)} />
        <FieldText label="Localisation" value={draft.location} onChange={(v) => set('location', v)} />
        <FieldText label="Email" value={draft.email} onChange={(v) => set('email', v)} />
        <FieldText label="Téléphone" value={draft.phone} onChange={(v) => set('phone', v)} />
        <FieldText label="GitHub" value={draft.github} onChange={(v) => set('github', v)} />
        <FieldText label="LinkedIn" value={draft.linkedin} onChange={(v) => set('linkedin', v)} />
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Bio</Label>
          <Textarea rows={4} value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-300">
          Accroches (effet machine à écrire)
        </h2>
        <BulletListInput
          value={draft.taglines}
          onChange={(v) => set('taglines', v)}
          placeholder="Une accroche"
        />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-300">Statistiques</h2>
        {draft.stats.map((stat, index) => (
          // Stable index: stats are a small ordered list edited in place.
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Libellé"
              value={stat.label}
              onChange={(e) => updateStat(index, { label: e.target.value })}
            />
            <Input
              placeholder="Valeur"
              className="w-28"
              value={stat.value}
              onChange={(e) => updateStat(index, { value: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Supprimer la statistique"
              onClick={() =>
                set('stats', draft.stats.filter((_, i) => i !== index))
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-fit border-slate-700 bg-transparent text-slate-200"
          onClick={() => set('stats', [...draft.stats, { label: '', value: '' }])}
        >
          <Plus className="size-4" /> Ajouter une stat
        </Button>
      </section>

      <EducationSection />

      <section className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">Disponibilité</h2>
          <p className="text-xs text-slate-500">Affiche le badge « Disponible » sur le site.</p>
        </div>
        <Switch
          checked={draft.available}
          onCheckedChange={(v) => set('available', v)}
        />
      </section>
    </div>
  )
}

function FieldText({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// Education is edited in place and dispatched immediately (it lives outside
// personalInfo, so it isn't covered by the page's "Enregistrer" button).
function EducationSection() {
  const { data, dispatch } = usePortfolioData()

  function update(item: Education, patch: Partial<Education>) {
    dispatch({ type: 'UPDATE_EDUCATION', payload: { ...item, ...patch } })
  }

  function add() {
    dispatch({
      type: 'ADD_EDUCATION',
      payload: { id: crypto.randomUUID(), degree: '', school: '', period: '', description: '' },
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-sm font-semibold text-slate-300">Formation</h2>
      {data.education.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-slate-800 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Diplôme"
              value={item.degree}
              onChange={(e) => update(item, { degree: e.target.value })}
            />
            <Input
              placeholder="École"
              value={item.school}
              onChange={(e) => update(item, { school: e.target.value })}
            />
            <Input
              placeholder="Période"
              value={item.period}
              onChange={(e) => update(item, { period: e.target.value })}
            />
            <Input
              placeholder="Description (optionnel)"
              value={item.description ?? ''}
              onChange={(e) => update(item, { description: e.target.value })}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit self-end text-red-400"
            onClick={() => dispatch({ type: 'DELETE_EDUCATION', payload: item.id })}
          >
            <Trash2 className="size-4" /> Supprimer
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-fit border-slate-700 bg-transparent text-slate-200"
        onClick={add}
      >
        <Plus className="size-4" /> Ajouter une formation
      </Button>
    </section>
  )
}
