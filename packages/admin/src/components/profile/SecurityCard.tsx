import { useState } from 'react'
import { useApi } from '@/hooks/useApi.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card.tsx'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible.tsx'
import { XIcon } from 'lucide-react'

export function SecurityCard() {
  const { loading: changingPw, error: pwError, request } = useApi()

  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)

  function handleClose() {
    setOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirm('')
    setConfirmError(null)
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setConfirmError(null)
    if (newPassword !== confirm) {
      setConfirmError('New passwords do not match')
      return
    }
    try {
      await request('/cms/admin/users/me/password', 'PATCH', { currentPassword, newPassword })
      handleClose()
    } catch {
      /* error shown via pwError */
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader>
          <CardTitle className="uppercase">Security</CardTitle>
          <CardAction>
            {open && (
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <XIcon className="size-4" />
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Change password
            </Button>
            <Button variant="secondary" disabled>
              Enable 2FA
            </Button>
          </div>

          <CollapsibleContent>
            <form onSubmit={handleSubmit} className="space-y-4 mt-8">
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
  )
}
