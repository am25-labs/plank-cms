import {
  EllipsisIcon,
  FileAudioIcon,
  FileIcon,
  FileTextIcon,
  FileVideoIcon,
  FolderIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
import { Checkbox } from '@/shared/ui/checkbox.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu.tsx'
import { formatBytes, handleCardKeyboard, isAudio, isHLS, isImage, isPDF, isVideo } from '../lib/media.ts'
import type { MediaItem } from '../types.ts'

type MediaCardProps = {
  item: MediaItem
  onDelete: (item: MediaItem) => void
  onPreview: (item: MediaItem) => void
  onMove: (item: MediaItem) => void
  canDelete: boolean
  canWrite: boolean
  selected: boolean
  onToggle: (id: string) => void
  onDragStart: (item: MediaItem) => void
  onDragEnd: () => void
}

export function MediaCard({
  item,
  onDelete,
  onPreview,
  onMove,
  canDelete,
  canWrite,
  selected,
  onToggle,
  onDragStart,
  onDragEnd,
}: MediaCardProps) {
  const mime = item.mime_type?.toLowerCase() ?? null

  return (
    <div
      className={`group relative cursor-grab overflow-hidden rounded-lg border bg-card transition-colors active:cursor-grabbing ${selected ? 'ring-2 ring-primary' : ''}`}
      draggable={canWrite}
      onDragStart={(event) => {
        if (!canWrite) return
        event.dataTransfer.effectAllowed = 'move'
        onDragStart(item)
      }}
      onDragEnd={onDragEnd}
    >
      <div
        className="flex aspect-square cursor-pointer items-center justify-center bg-muted"
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={() => {
          if (!selected) onPreview(item)
        }}
        onKeyDown={(event) => {
          handleCardKeyboard(event, () => {
            if (!selected) onPreview(item)
          })
        }}
      >
        {isImage(mime) ? (
          <img
            src={item.url}
            alt={item.alt ?? item.filename}
            className="h-full w-full object-cover"
          />
        ) : isVideo(mime) || isHLS(item.url, mime) ? (
          <FileVideoIcon className="size-10 text-muted-foreground" />
        ) : isAudio(mime) ? (
          <FileAudioIcon className="size-10 text-muted-foreground" />
        ) : isPDF(mime) ? (
          <FileTextIcon className="size-10 text-muted-foreground" />
        ) : (
          <FileIcon className="size-10 text-muted-foreground" />
        )}
      </div>
      <div
        className={`absolute left-1.5 top-1.5 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(item.id)}
          aria-label="Select file"
          className="bg-background/80 backdrop-blur-sm"
        />
      </div>
      {!selected && (canWrite || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity hover:text-foreground group-hover:opacity-100"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="File actions"
            >
              <EllipsisIcon className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            {canWrite && (
              <>
                <DropdownMenuItem onSelect={() => onPreview(item)}>
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onMove(item)}>
                  <FolderIcon className="size-4" />
                  Move
                </DropdownMenuItem>
              </>
            )}
            {canDelete && (
              <DropdownMenuItem
                onSelect={() => onDelete(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <div className="p-2">
        <p className="truncate text-xs font-medium" title={item.filename}>
          {item.filename}
        </p>
        <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
      </div>
    </div>
  )
}
