import {
  TypeIcon,
  AlignLeftIcon,
  FileTextIcon,
  HashIcon,
  ToggleLeftIcon,
  CalendarIcon,
  ImageIcon,
  LinkIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type FieldType = 'string' | 'text' | 'richtext' | 'number' | 'boolean' | 'datetime' | 'media' | 'relation'
type NumberSubtype = 'integer' | 'float'
export type FieldWidth = 'full' | 'half' | 'third'

export type FieldCardData = {
  name: string
  type: FieldType
  required?: boolean
  subtype?: NumberSubtype
  relatedTable?: string
  width?: FieldWidth
}

type FieldMeta = {
  icon: LucideIcon
  label: string
  color: string
  bg: string
}

function getFieldMeta(type: FieldType, subtype?: NumberSubtype): FieldMeta {
  switch (type) {
    case 'string':
      return { icon: TypeIcon, label: 'Short text', color: 'text-blue-600', bg: 'bg-blue-50' }
    case 'text':
      return { icon: AlignLeftIcon, label: 'Long text', color: 'text-sky-600', bg: 'bg-sky-50' }
    case 'richtext':
      return { icon: FileTextIcon, label: 'Rich text', color: 'text-violet-600', bg: 'bg-violet-50' }
    case 'number':
      return {
        icon: HashIcon,
        label: subtype === 'float' ? 'Decimal number' : 'Integer',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
      }
    case 'boolean':
      return { icon: ToggleLeftIcon, label: 'Boolean', color: 'text-emerald-600', bg: 'bg-emerald-50' }
    case 'datetime':
      return { icon: CalendarIcon, label: 'Date & time', color: 'text-amber-600', bg: 'bg-amber-50' }
    case 'media':
      return { icon: ImageIcon, label: 'Media', color: 'text-rose-600', bg: 'bg-rose-50' }
    case 'relation':
      return { icon: LinkIcon, label: 'Relation', color: 'text-indigo-600', bg: 'bg-indigo-50' }
  }
}

export const FIELD_WIDTH_SPAN: Record<FieldWidth, string> = {
  full: 'col-span-6',
  half: 'col-span-3',
  third: 'col-span-2',
}

// Small layout icons that represent each width visually
function WidthIcon({ width }: { width: FieldWidth }) {
  const bar = 'rounded-sm bg-current'
  if (width === 'full')
    return (
      <div className="flex w-4 gap-px">
        <div className={`${bar} h-2 w-full`} />
      </div>
    )
  if (width === 'half')
    return (
      <div className="flex w-4 gap-px">
        <div className={`${bar} h-2 flex-1`} />
        <div className={`${bar} h-2 flex-1`} />
      </div>
    )
  return (
    <div className="flex w-4 gap-px">
      <div className={`${bar} h-2 flex-1`} />
      <div className={`${bar} h-2 flex-1`} />
      <div className={`${bar} h-2 flex-1`} />
    </div>
  )
}

const WIDTH_OPTIONS: { value: FieldWidth; label: string }[] = [
  { value: 'full', label: 'Full width' },
  { value: 'half', label: 'Half' },
  { value: 'third', label: '1/3' },
]

type FieldCardProps = {
  field: FieldCardData
  onWidthChange?: (width: FieldWidth) => void
}

export function FieldCard({ field, onWidthChange }: FieldCardProps) {
  const { icon: Icon, label, color, bg } = getFieldMeta(field.type, field.subtype)
  const currentWidth = field.width ?? 'full'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-xs">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${bg}`}>
        <Icon className={`size-4 ${color}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {field.name}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>

      {onWidthChange && (
        <div className="flex shrink-0 items-center gap-px rounded-md border border-border p-0.5">
          {WIDTH_OPTIONS.map(({ value, label: tooltip }) => (
            <button
              key={value}
              type="button"
              title={tooltip}
              onClick={() => onWidthChange(value)}
              className={[
                'flex items-center justify-center rounded px-1.5 py-1 transition-colors',
                currentWidth === value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              <WidthIcon width={value} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
