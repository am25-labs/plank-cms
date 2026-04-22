import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.tsx'
import { useApi } from '../hooks/useApi.ts'

interface AuthResponse {
  token: string
  user: { id: string; email: string; role: string }
}

export function Login() {
  const { login } = useAuth()
  const { loading, error, request } = useApi<AuthResponse>()
  const navigate = useNavigate()

  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/cms/auth/setup')
      .then((r) => r.json())
      .then((data: { needsSetup: boolean }) => setNeedsSetup(data.needsSetup))
      .catch(() => setNeedsSetup(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setValidationError(null)

    if (needsSetup && password !== confirm) {
      setValidationError('Passwords do not match')
      return
    }

    if (needsSetup) {
      await request('/cms/auth/register', 'POST', { email, password })
    }

    const res = await request('/cms/auth/login', 'POST', { email, password })
    login(res.user, res.token)
    navigate('/')
  }

  if (needsSetup === null) return null

  const displayError = validationError ?? error

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ width: 360, background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Plank CMS</h1>
        {needsSetup && (
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Create your admin account to get started.</p>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: needsSetup ? 0 : 24 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          {needsSetup && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          )}
          {displayError && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{displayError}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px', borderRadius: 6, background: '#111', color: '#fff', border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '...' : needsSetup ? 'Create account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
