import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import { Checkbox } from '@/components/ui/checkbox.tsx'
import { Label } from '@/components/ui/label.tsx'

type FieldType = 'string' | 'text' | 'richtext' | 'number' | 'boolean' | 'datetime' | 'media' | 'relation' | 'uid'

export type FieldDef = {
  name: string
  type: FieldType
  required?: boolean
  subtype?: 'integer' | 'float'
  targetField?: string
  relatedTable?: string
  width?: string
}

type FieldInputProps = {
  field: FieldDef
  value: unknown
  onChange: (value: unknown) => void
  allValues: Record<string, unknown>
}

function toSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '')
}

export function FieldInput({ field, value, onChange, allValues }: FieldInputProps) {
  const uidManual = useRef(false)

  // Auto-derive UID from targetField while user hasn't manually edited it
  useEffect(() => {
    if (field.type !== 'uid' || !field.targetField || uidManual.current) return
    const source = String(allValues[field.targetField] ?? '')
    onChange(toSlug(source))
  }, [field.type, field.targetField, allValues[field.targetField ?? '']]) // eslint-disable-line react-hooks/exhaustive-deps

  const sharedClass = 'w-full'

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id={`field-${field.name}`}
          checked={Boolean(value)}
          onCheckedChange={(v) => onChange(Boolean(v))}
        />
        <Label htmlFor={`field-${field.name}`} className="cursor-pointer font-normal text-sm">
          {value ? 'Yes' : 'No'}
        </Label>
      </div>
    )
  }

  if (field.type === 'text' || field.type === 'richtext') {
    return (
      <Textarea
        className={sharedClass}
        value={String(value ?? '')}
        placeholder={field.name}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  if (field.type === 'number') {
    return (
      <Input
        type="number"
        className={sharedClass}
        value={value === undefined || value === null ? '' : String(value)}
        step={field.subtype === 'float' ? 'any' : '1'}
        placeholder="0"
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') { onChange(null); return }
          onChange(field.subtype === 'float' ? parseFloat(raw) : parseInt(raw, 10))
        }}
      />
    )
  }

  if (field.type === 'datetime') {
    return (
      <Input
        type="datetime-local"
        className={sharedClass}
        value={value ? String(value).slice(0, 16) : ''}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
      />
    )
  }

  if (field.type === 'uid') {
    return (
      <Input
        className={sharedClass}
        value={String(value ?? '')}
        placeholder="auto-generated-slug"
        onChange={(e) => {
          uidManual.current = true
          onChange(e.target.value)
        }}
      />
    )
  }

  if (field.type === 'media') {
    return (
      <div className="flex h-10 w-full items-center rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
        Media library — coming soon
      </div>
    )
  }

  if (field.type === 'relation') {
    return (
      <Input
        className={sharedClass}
        value={String(value ?? '')}
        placeholder="Entry ID"
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  // string fallback
  return (
    <Input
      className={sharedClass}
      value={String(value ?? '')}
      placeholder={field.name}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
