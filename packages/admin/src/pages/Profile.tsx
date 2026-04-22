import { useState } from 'react'
import { useAuth } from '@/context/auth.tsx'
import { useApi } from '@/hooks/useApi.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx'

function getInitials(firstName: string | null, lastName: string | null, email: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (firstName) return firstName.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

type MeResponse = { first_name: string | null; last_name: string | null }

export function Profile() {
  const { user, updateUser } = useAuth()
  const { loading: saving, error: saveError, request } = useApi<MeResponse>()
  const { loading: changingPw, error: pwError, request: requestPw } = useApi()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [profileSuccess, setProfileSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileSuccess(false)
    try {
      const updated = await request('/cms/admin/users/me', 'PATCH', { firstName, lastName })
      updateUser({ firstName: updated.first_name, lastName: updated.last_name })
      setProfileSuccess(true)
    } catch { /* error shown via saveError */ }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setConfirmError(null)
    setPwSuccess(false)
    if (newPassword !== confirm) {
      setConfirmError('New passwords do not match')
      return
    }
    try {
      await requestPw('/cms/admin/users/me/password', 'PATCH', { currentPassword, newPassword })
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch { /* error shown via pwError */ }
  }

  return (
    <div className="p-8 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information.</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg">
                {getInitials(user?.firstName ?? null, user?.lastName ?? null, user?.email ?? '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-base">
                {user?.firstName || user?.lastName
                  ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                  : user?.email}
              </p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <Badge variant="secondary" className="mt-1.5 capitalize">{user?.role}</Badge>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setProfileSuccess(false) }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setProfileSuccess(false) }}
                />
              </div>
            </div>

            {saveError && <p className="text-destructive text-sm">{saveError}</p>}
            {profileSuccess && <p className="text-green-500 text-sm">Profile updated.</p>}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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

            {(confirmError ?? pwError) && (
              <p className="text-destructive text-sm">{confirmError ?? pwError}</p>
            )}
            {pwSuccess && <p className="text-green-500 text-sm">Password updated successfully.</p>}

            <Button type="submit" disabled={changingPw}>
              {changingPw ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
