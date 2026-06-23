import { Plus, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

interface BulletListInputProps {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

/** Editable list of one-line strings (e.g. experience bullets, project highlights). */
export function BulletListInput({
  value,
  onChange,
  placeholder,
}: BulletListInputProps) {
  function update(index: number, text: string) {
    onChange(value.map((item, i) => (i === index ? text : item)))
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((item, index) => (
        // Index key is acceptable: list order is user-controlled and stable here.
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(e) => update(index, e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Supprimer la ligne"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...value, ''])}
      >
        <Plus className="size-4" /> Ajouter une ligne
      </Button>
    </div>
  )
}
