import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi.ts'
import { useAuth } from '@/context/auth.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card.tsx'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp.tsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.tsx'
import { XIcon } from 'lucide-react'

interface TwoFactorSetupResponse {
  qrCodeDataUrl: string
  secret: string
}

export function SecurityCard() {
  const { user, updateUser } = useAuth()
  const { loading: changingPw, error: pwError, request } = useApi()
  const { loading: loading2FA, error: twoFaError, request: request2FA } = useApi<TwoFactorSetupResponse>()

  const [activeTab, setActiveTab] = useState<'' | 'password' | 'two-factor'>('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null)
  const [otpCode, setOtpCode] = useState('')

  useEffect(() => {
    if (typeof user?.twoFactorEnabled === 'boolean') {
      setTwoFactorEnabled(user.twoFactorEnabled)
    }
  }, [user?.twoFactorEnabled])

  function handleClose() {
    setActiveTab('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirm('')
    setConfirmError(null)
    setSetupData(null)
    setOtpCode('')
  }

  function closeTwoFactorSetup() {
    setSetupData(null)
    setOtpCode('')
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

  async function handleStart2FA() {
    const data = await request2FA('/cms/admin/users/me/2fa/setup', 'POST')
    setSetupData(data)
  }

  async function handleEnable2FA() {
    await request2FA('/cms/admin/users/me/2fa/verify', 'POST', { code: otpCode })
    setTwoFactorEnabled(true)
    updateUser({ twoFactorEnabled: true })
    setSetupData(null)
    setOtpCode('')
  }

  async function handleDisable2FA() {
    await request2FA('/cms/admin/users/me/2fa/disable', 'POST', { code: otpCode })
    setTwoFactorEnabled(false)
    updateUser({ twoFactorEnabled: false })
    setOtpCode('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="uppercase">Security</CardTitle>
        <CardAction />
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab}>
          <TabsList>
            <TabsTrigger
              value="password"
              onClick={() => setActiveTab((prev) => (prev === 'password' ? '' : 'password'))}
            >
              Password
            </TabsTrigger>
            <TabsTrigger
              value="two-factor"
              onClick={() => setActiveTab((prev) => (prev === 'two-factor' ? '' : 'two-factor'))}
            >
              2FA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4">
            <div className="space-y-4 rounded-md border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Update your account password.</p>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <XIcon className="size-4" />
                </Button>
              </div>
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

                {(confirmError ?? pwError) && (
                  <p className="text-destructive text-sm">{confirmError ?? pwError}</p>
                )}

                <Button type="submit" disabled={changingPw}>
                  {changingPw ? 'Saving…' : 'Update password'}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="two-factor" className="mt-4">
            <div className="space-y-4">
              {!twoFactorEnabled && !setupData && (
                <Button variant="secondary" onClick={handleStart2FA} disabled={loading2FA}>
                  Enable 2FA
                </Button>
              )}

              {setupData && !twoFactorEnabled && (
                <div className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Scan this QR code with your authenticator app and enter the 6-digit code.
                    </p>
                    <Button variant="ghost" size="icon" onClick={closeTwoFactorSetup}>
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                  <img src={setupData.qrCodeDataUrl} alt="2FA QR" className="h-44 w-44 rounded-md bg-white p-2" />
                  <p className="text-xs text-muted-foreground">Manual code: {setupData.secret}</p>
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <Button onClick={handleEnable2FA} disabled={loading2FA || otpCode.length !== 6}>
                    Confirm and enable 2FA
                  </Button>
                  {twoFaError && <p className="text-sm text-destructive">{twoFaError}</p>}
                </div>
              )}

              {twoFactorEnabled && (
                <div className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Enter a verification code from your authenticator app to disable 2FA.
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => setOtpCode('')}>
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <Button variant="destructive" onClick={handleDisable2FA} disabled={loading2FA || otpCode.length !== 6}>
                    Disable 2FA
                  </Button>
                  {twoFaError && <p className="text-sm text-destructive">{twoFaError}</p>}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
