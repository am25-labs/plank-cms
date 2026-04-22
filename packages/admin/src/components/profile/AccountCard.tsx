import { useState } from 'react'
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

type MeResponse = { first_name: string | null; last_name: string | null }

function getInitials(firstName: string | null, lastName: string | null, email: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (firstName) return firstName.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export function AccountCard() {
  const { user, updateUser } = useAuth()
  const { loading: saving, error: saveError, request } = useApi<MeResponse>()

  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')

  function handleEditToggle() {
    if (editing) {
      setFirstName(user?.firstName ?? '')
      setLastName(user?.lastName ?? '')
    }
    setEditing(!editing)
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const updated = await request('/cms/admin/users/me', 'PATCH', { firstName, lastName })
      updateUser({ firstName: updated.first_name, lastName: updated.last_name })
      setEditing(false)
    } catch {
      /* error shown via saveError */
    }
  }

  return (
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
          <div className="flex items-center gap-4 -mt-4">
            <Avatar className="size-20">
              <AvatarFallback className="text-xl">
                {getInitials(user?.firstName ?? null, user?.lastName ?? null, user?.email ?? '')}
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
            <form onSubmit={handleSubmit} className="space-y-4 mt-8">
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
  )
}
