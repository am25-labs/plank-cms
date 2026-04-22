import { useState } from 'react'
import { useAuth } from '@/context/auth.tsx'
import { useApi } from '@/hooks/useApi.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'

export function Profile() {
  const { user } = useAuth()
  const { loading, error, request } = useApi()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [success, setSuccess] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setClientError(null)
    setSuccess(false)

    if (newPassword !== confirm) {
      setClientError('New passwords do not match')
      return
    }

    try {
      await request('/cms/admin/users/me/password', 'PATCH', { currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch {
      // error already set by useApi
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-1">Profile</h1>
      <p className="text-muted-foreground text-sm mb-8">Your account details.</p>

      {/* Account info */}
      <section className="rounded-lg border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Role</p>
            <p className="text-sm font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </section>

      {/* Change password */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Change password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">New password</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {(clientError ?? error) && (
            <p className="text-sm text-destructive">{clientError ?? error}</p>
          )}
          {success && (
            <p className="text-sm text-green-500">Password updated successfully.</p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Update password'}
          </Button>
        </form>
      </section>
    </div>
  )
}
