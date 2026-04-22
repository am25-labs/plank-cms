import { StarIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useFetch } from '@/hooks/useFetch.ts'
import { useApi } from '@/hooks/useApi.ts'
import { Spinner } from '@/components/ui/spinner.tsx'

type ContentType = {
  slug: string
  name: string
  isDefault: boolean
}

export function ContentSidebar() {
  const { pathname } = useLocation()
  const { data, loading, error, refetch } = useFetch<ContentType[]>('/cms/admin/content-types')
  const { request } = useApi<ContentType>()

  async function handleSetDefault(e: React.MouseEvent, slug: string) {
    e.preventDefault()
    e.stopPropagation()
    await request(`/cms/admin/content-types/${slug}/default`, 'PUT')
    refetch()
  }

  function isActive(slug: string) {
    return pathname === `/content/${slug}` || pathname.startsWith(`/content/${slug}/`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Content
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Spinner className="size-4" />
          </div>
        )}
        {error && (
          <p className="px-4 py-3 text-xs text-destructive">{error}</p>
        )}
        {!loading && !error && (data ?? []).length === 0 && (
          <p className="px-4 py-3 text-xs text-muted-foreground">No content types yet.</p>
        )}
        {!loading && !error && (data ?? []).length > 0 && (
          <nav className="flex flex-col gap-0.5 p-2">
            {(data ?? []).map((ct) => (
              <NavLink
                key={ct.slug}
                to={`/content/${ct.slug}`}
                className={[
                  'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  isActive(ct.slug)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                ].join(' ')}
              >
                <span className="min-w-0 flex-1 truncate">{ct.name}</span>
                <button
                  type="button"
                  title={ct.isDefault ? 'Default content type' : 'Set as default'}
                  onClick={(e) => handleSetDefault(e, ct.slug)}
                  className={[
                    'shrink-0 rounded transition-colors',
                    ct.isDefault
                      ? 'text-amber-400'
                      : 'text-transparent group-hover:text-muted-foreground/40 hover:!text-amber-400',
                  ].join(' ')}
                >
                  <StarIcon className={`size-3.5 ${ct.isDefault ? 'fill-amber-400' : ''}`} />
                </button>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
