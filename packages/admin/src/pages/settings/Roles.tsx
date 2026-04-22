import { useState, useEffect } from 'react'
import { RotateCcwIcon, SaveIcon } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch.ts'
import { useApi } from '@/hooks/useApi.ts'
import { useAuth } from '@/context/auth.tsx'
import { Checkbox } from '@/components/ui/checkbox.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog.tsx'

type Role = { id: string; name: string; permissions: string[] }

const RESOURCES = [
  { key: 'content-types', label: 'Content Types' },
  { key: 'entries',       label: 'Entries' },
  { key: 'media',         label: 'Media' },
  { key: 'users',         label: 'Users' },
  { key: 'api-tokens',    label: 'API Tokens' },
] as const

const ACTIONS = [
  { key: 'read',   label: 'R' },
  { key: 'write',  label: 'W' },
  { key: 'delete', label: 'D' },
] as const

type PermissionMap = Record<string, Set<string>>

function toMap(roles: Role[]): PermissionMap {
  return Object.fromEntries(roles.map((r) => [r.id, new Set(r.permissions)]))
}

export function SettingsRoles() {
  const { user } = useAuth()
  const { data: roles, loading, refetch } = useFetch<Role[]>('/cms/admin/roles')
  const { request, loading: submitting } = useApi()

  const [perms, setPerms] = useState<PermissionMap>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    if (roles) setPerms(toMap(roles))
  }, [roles])

  function toggle(roleId: string, permission: string) {
    setPerms((prev) => {
      const next = new Set(prev[roleId])
      next.has(permission) ? next.delete(permission) : next.add(permission)
      return { ...prev, [roleId]: next }
    })
    setDirty((prev) => new Set(prev).add(roleId))
  }

  async function save(role: Role) {
    await request(`/cms/admin/roles/${role.id}`, 'PUT', {
      permissions: Array.from(perms[role.id] ?? []),
    })
    setDirty((prev) => { const next = new Set(prev); next.delete(role.id); return next })
  }

  async function handleReset() {
    await request('/cms/admin/roles/reset', 'POST')
    setResetOpen(false)
    setDirty(new Set())
    refetch()
  }

  const isSuperAdmin = user?.role === 'Super Admin'
  const editableRoles = (roles ?? []).filter((r) => r.name !== 'Super Admin')
  const superAdminRole = (roles ?? []).find((r) => r.name === 'Super Admin')

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure what each role can do across the CMS.
          </p>
        </div>
        {isSuperAdmin && (
          <Button size="sm" variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcwIcon className="size-4" />
            Reset defaults
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-40">Resource</th>

              {/* Super Admin — locked */}
              {superAdminRole && (
                <th className="px-4 py-3 text-center" colSpan={3}>
                  <div className="text-xs font-semibold">{superAdminRole.name}</div>
                  <div className="flex justify-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    {ACTIONS.map((a) => <span key={a.key} className="w-4">{a.label}</span>)}
                  </div>
                </th>
              )}

              {/* Editable roles */}
              {editableRoles.map((role) => (
                <th key={role.id} className="px-4 py-3 text-center" colSpan={3}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold">{role.name}</span>
                    <Button
                      size="sm"
                      variant={dirty.has(role.id) ? 'default' : 'ghost'}
                      className="h-6 px-2 text-xs"
                      disabled={!dirty.has(role.id) || submitting}
                      onClick={() => save(role)}
                    >
                      <SaveIcon className="size-3" />
                      Save
                    </Button>
                  </div>
                  <div className="flex justify-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    {ACTIONS.map((a) => <span key={a.key} className="w-4">{a.label}</span>)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {RESOURCES.map(({ key: resource, label }, i) => (
              <tr key={resource} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                <td className="px-4 py-3 font-medium">{label}</td>

                {/* Super Admin — all checked, disabled */}
                {superAdminRole && (
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex justify-center gap-4">
                      {ACTIONS.map((action) => (
                        <Checkbox key={action.key} checked disabled className="w-4" />
                      ))}
                    </div>
                  </td>
                )}

                {/* Editable roles */}
                {editableRoles.map((role) => (
                  <td key={role.id} className="px-4 py-3" colSpan={3}>
                    <div className="flex justify-center gap-4">
                      {ACTIONS.map((action) => {
                        const permission = `${resource}:${action.key}`
                        return (
                          <Checkbox
                            key={action.key}
                            checked={perms[role.id]?.has(permission) ?? false}
                            onCheckedChange={() => toggle(role.id, permission)}
                            className="w-4"
                          />
                        )
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset to defaults</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will restore all role permissions to their original configuration. Any custom changes will be lost.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset} disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
