import { useRef, useState } from 'react'
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

  // statsEn mirrors stats by index; only the label is translated (the numeric
  // value is locale-neutral). Rebuilt from `draft.stats` so it stays aligned.
  function updateStatEn(index: number, label: string) {
    set(
      'statsEn',
      draft.stats.map((stat, i) => ({
        value: stat.value,
        label: i === index ? label : (draft.statsEn?.[i]?.label ?? ''),
      })),
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
        <h1 className="font-display text-2xl font-bold tracking-tight">Paramètres</h1>
        <Button onClick={handleSave}>
          <Save className="size-4" /> Enregistrer
        </Button>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-secondary before:h-px before:w-5 before:bg-secondary/50 before:content-['']">Photo de profil</h2>
        <div className="flex items-center gap-4">
          {draft.profilePhoto ? (
            <img
              src={draft.profilePhoto}
              alt="Aperçu"
              className="size-20 rounded-xl object-cover"
            />
          ) : (
            <div className="size-20 rounded-lg border border-dashed border-border bg-muted" />
          )}
          <Input type="file" accept="image/*" onChange={handlePhoto} className="max-w-xs" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
        <FieldText label="Nom" value={draft.name} onChange={(v) => set('name', v)} />
        <FieldText label="Titre" value={draft.title} onChange={(v) => set('title', v)} />
        <FieldText label="Titre (EN)" value={draft.titleEn ?? ''} onChange={(v) => set('titleEn', v)} />
        <FieldText label="Localisation" value={draft.location} onChange={(v) => set('location', v)} />
        <FieldText label="Localisation (EN)" value={draft.locationEn ?? ''} onChange={(v) => set('locationEn', v)} />
        <FieldText label="Email" value={draft.email} onChange={(v) => set('email', v)} />
        <FieldText label="Téléphone" value={draft.phone} onChange={(v) => set('phone', v)} />
        <FieldText label="GitHub" value={draft.github} onChange={(v) => set('github', v)} />
        <FieldText label="LinkedIn" value={draft.linkedin} onChange={(v) => set('linkedin', v)} />
        <FieldText label="CV (URL)" value={draft.cvUrl} onChange={(v) => set('cvUrl', v)} />
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Bio</Label>
          <Textarea rows={4} value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Bio (EN)</Label>
          <Textarea
            rows={4}
            value={draft.bioEn ?? ''}
            onChange={(e) => set('bioEn', e.target.value)}
            placeholder="Laisser vide pour réutiliser le FR"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-secondary before:h-px before:w-5 before:bg-secondary/50 before:content-['']">
          Accroches (effet machine à écrire)
        </h2>
        <BulletListInput
          value={draft.taglines}
          onChange={(v) => set('taglines', v)}
          placeholder="Une accroche"
        />
        <Label className="mt-2 text-muted-foreground">Accroches (EN)</Label>
        <BulletListInput
          value={draft.taglinesEn ?? []}
          onChange={(v) => set('taglinesEn', v)}
          placeholder="Laisser vide pour réutiliser le FR"
        />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-secondary before:h-px before:w-5 before:bg-secondary/50 before:content-['']">Statistiques</h2>
        {draft.stats.map((stat, index) => (
          // Stable index: stats are a small ordered list edited in place.
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Libellé"
              value={stat.label}
              onChange={(e) => updateStat(index, { label: e.target.value })}
            />
            <Input
              placeholder="Libellé (EN)"
              value={draft.statsEn?.[index]?.label ?? ''}
              onChange={(e) => updateStatEn(index, e.target.value)}
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
          className="w-fit"
          onClick={() => set('stats', [...draft.stats, { label: '', value: '' }])}
        >
          <Plus className="size-4" /> Ajouter une stat
        </Button>
      </section>

      <EducationSection />

      <section className="flex items-center justify-between rounded-xl border border-border bg-card p-6">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-secondary before:h-px before:w-5 before:bg-secondary/50 before:content-['']">Disponibilité</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Affiche le badge « Disponible pour missions » sur le site.
          </p>
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

// Education is edited through a local draft and persisted on blur. The inputs
// must NOT bind straight to the React Query cache: dispatching on every
// keystroke triggers a full-portfolio refetch per character, which races and
// clobbers in-progress typing on a remote (slow) DB. One write per field on
// blur keeps typing smooth. (personalInfo above uses the same local-draft idea.)
function EducationSection() {
  const { data, dispatch } = usePortfolioData()
  const [drafts, setDrafts] = useState<Education[]>(data.education)

  // Re-sync from the server only when the SET of rows changes (add/delete),
  // never on a field-value refetch — otherwise a refetch would clobber the
  // field being typed. setState-during-render is React's "derive state when an
  // input changes" pattern.
  const serverIds = data.education.map((e) => e.id).join('|')
  const seenIds = useRef(serverIds)
  if (seenIds.current !== serverIds) {
    seenIds.current = serverIds
    setDrafts(data.education)
  }

  function setField(id: string, patch: Partial<Education>) {
    setDrafts((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function persist(item: Education) {
    dispatch({ type: 'UPDATE_EDUCATION', payload: item })
  }

  function add() {
    dispatch({
      type: 'ADD_EDUCATION',
      payload: { id: crypto.randomUUID(), degree: '', school: '', period: '', description: '' },
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-secondary before:h-px before:w-5 before:bg-secondary/50 before:content-['']">Formation</h2>
      {drafts.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Diplôme"
              value={item.degree}
              onChange={(e) => setField(item.id, { degree: e.target.value })}
              onBlur={() => persist(item)}
            />
            <Input
              placeholder="Diplôme (EN)"
              value={item.degreeEn ?? ''}
              onChange={(e) => setField(item.id, { degreeEn: e.target.value })}
              onBlur={() => persist(item)}
            />
            <Input
              placeholder="École"
              value={item.school}
              onChange={(e) => setField(item.id, { school: e.target.value })}
              onBlur={() => persist(item)}
            />
            <Input
              placeholder="Période"
              value={item.period}
              onChange={(e) => setField(item.id, { period: e.target.value })}
              onBlur={() => persist(item)}
            />
            <Input
              placeholder="Description (optionnel)"
              value={item.description ?? ''}
              onChange={(e) => setField(item.id, { description: e.target.value })}
              onBlur={() => persist(item)}
            />
            <Input
              placeholder="Description EN (optionnel)"
              value={item.descriptionEn ?? ''}
              onChange={(e) => setField(item.id, { descriptionEn: e.target.value })}
              onBlur={() => persist(item)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit self-end text-destructive hover:text-destructive"
            onClick={() => dispatch({ type: 'DELETE_EDUCATION', payload: item.id })}
          >
            <Trash2 className="size-4" /> Supprimer
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={add}
      >
        <Plus className="size-4" /> Ajouter une formation
      </Button>
    </section>
  )
}
