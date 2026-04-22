import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch.ts'
import { useApi } from '@/hooks/useApi.ts'
import { Button } from '@/components/ui/button.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.tsx'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty.tsx'
import { FileTextIcon } from 'lucide-react'

type FieldDefinition = {
  name: string
  type: string
  width?: string
}

type ContentType = {
  name: string
  slug: string
  fields: FieldDefinition[]
}

type Entry = Record<string, unknown>

type EntriesResponse = {
  data: Entry[]
  total: number
  page: number
  limit: number
}

const DISPLAY_TYPES = new Set(['string', 'text', 'number', 'boolean', 'datetime', 'uid'])

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined || value === '') return '—'
  if (type === 'boolean') return value ? 'Yes' : 'No'
  if (type === 'datetime') return new Date(value as string).toLocaleString()
  const str = String(value)
  return str.length > 48 ? str.slice(0, 48) + '…' : str
}

export function EntriesList() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { loading: deleting, request: requestDelete } = useApi()

  const { data: ct, loading: loadingCt } = useFetch<ContentType>(
    slug ? `/cms/admin/content-types/${slug}` : null
  )
  const { data: entries, loading: loadingEntries, refetch } = useFetch<EntriesResponse>(
    slug ? `/cms/admin/content-types/${slug}/entries?page=${page}&limit=20` : null
  )

  const displayFields = (ct?.fields ?? []).filter((f) => DISPLAY_TYPES.has(f.type)).slice(0, 4)

  async function handleDelete() {
    if (!deletingId || !slug) return
    await requestDelete(`/cms/admin/entries/${slug}/${deletingId}`, 'DELETE')
    setDeletingId(null)
    refetch()
  }

  if (loadingCt) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Spinner className="size-4" />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  if (!ct) return null

  const totalPages = Math.ceil((entries?.total ?? 0) / (entries?.limit ?? 20))

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{ct.name}</h1>
        <Button onClick={() => navigate(`/content/${slug}/new`)} className="gap-2">
          <PlusIcon className="size-4" />
          New entry
        </Button>
      </div>

      {loadingEntries && (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Spinner className="size-4" />
          <span className="text-sm">Loading entries…</span>
        </div>
      )}

      {!loadingEntries && (entries?.data ?? []).length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileTextIcon /></EmptyMedia>
            <EmptyTitle>No entries yet</EmptyTitle>
            <EmptyDescription>Create your first entry for {ct.name}.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => navigate(`/content/${slug}/new`)}>New entry</Button>
          </EmptyContent>
        </Empty>
      )}

      {!loadingEntries && (entries?.data ?? []).length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  {displayFields.map((f) => (
                    <th key={f.name} className="px-4 py-3 text-left font-medium text-muted-foreground capitalize">
                      {f.name.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(entries?.data ?? []).map((entry) => (
                  <tr key={String(entry.id)} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {String(entry.id).slice(0, 8)}…
                    </td>
                    {displayFields.map((f) => (
                      <td key={f.name} className="px-4 py-3 text-muted-foreground">
                        {formatValue(entry[f.name], f.type)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.created_at
                        ? new Date(entry.created_at as string).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => navigate(`/content/${slug}/${entry.id}`)}
                          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(String(entry.id))}
                          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{entries?.total} entries</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span>Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={Boolean(deletingId)} onOpenChange={(v) => { if (!v) setDeletingId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete entry?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner className="size-4" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
