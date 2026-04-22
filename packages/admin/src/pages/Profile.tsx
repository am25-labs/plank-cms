import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth.tsx'
import { useApi } from '@/hooks/useApi.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible.tsx'
import { PencilIcon, XIcon } from 'lucide-react'

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

  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [profileSuccess, setProfileSuccess] = useState(false)

  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  useEffect(() => {
    if (!profileSuccess) return
    const t = setTimeout(() => setProfileSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [profileSuccess])

  useEffect(() => {
    if (!pwSuccess) return
    const t = setTimeout(() => setPwSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [pwSuccess])

  function handleEditToggle() {
    if (editing) {
      setFirstName(user?.firstName ?? '')
      setLastName(user?.lastName ?? '')
      setProfileSuccess(false)
    }
    setEditing(!editing)
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileSuccess(false)
    try {
      const updated = await request('/cms/admin/users/me', 'PATCH', { firstName, lastName })
      updateUser({ firstName: updated.first_name, lastName: updated.last_name })
      setProfileSuccess(true)
      setEditing(false)
    } catch {
      /* error shown via saveError */
    }
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
      setChangingPassword(false)
    } catch {
      /* error shown via pwError */
    }
  }

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          {/* Account info */}
          <Collapsible open={editing} onOpenChange={setEditing}>
            <Card>
              <CardHeader>
                <CardTitle className="uppercase">Account</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="icon" onClick={handleEditToggle}>
                    {editing ? <XIcon className="size-4" /> : <PencilIcon className="size-4" />}
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="size-20">
                    <AvatarFallback className="text-xl">
                      {getInitials(
                        user?.firstName ?? null,
                        user?.lastName ?? null,
                        user?.email ?? '',
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-xl">
                      {user?.firstName || user?.lastName
                        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                        : user?.email}
                    </p>
                    <p className="text-muted-foreground text-sm">{user?.email}</p>
                    <Badge className="mt-2 capitalize">{user?.role}</Badge>
                  </div>
                </div>

                <CollapsibleContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    {saveError && <p className="text-destructive text-sm">{saveError}</p>}

                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                  </form>
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>

          {/* Change password */}
          <Collapsible open={changingPassword} onOpenChange={setChangingPassword}>
            <Card>
              <CardHeader>
                <CardTitle className="uppercase">Security</CardTitle>
                {changingPassword && (
                  <CardAction>
                    <Button variant="ghost" size="icon" onClick={() => setChangingPassword(false)}>
                      <XIcon className="size-4" />
                    </Button>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="secondary" onClick={() => setChangingPassword(true)}>
                    Change password
                  </Button>
                  <Button variant="secondary" disabled>
                    Enable 2FA
                  </Button>
                </div>

                <CollapsibleContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-6">
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

                    <Button type="submit" disabled={changingPw}>
                      {changingPw ? 'Saving…' : 'Update password'}
                    </Button>
                  </form>
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </section>
  )
}
