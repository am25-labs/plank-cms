import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth.tsx'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { status, user } = useAuth()

  if (status === 'idle') return null
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (roles && user && !roles.map((r) => r.toLowerCase()).includes(user.role.toLowerCase())) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
