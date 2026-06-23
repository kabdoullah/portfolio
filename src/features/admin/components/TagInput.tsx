import { useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import type { KeyboardEvent } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

/** Chip-style editor for a list of short strings (e.g. a tech stack). */
export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const tag = draft.trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Retirer ${tag}`}
              className="rounded-full hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={placeholder ?? 'Ajouter puis Entrée'}
      />
    </div>
  )
}
