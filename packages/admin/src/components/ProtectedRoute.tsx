import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth.tsx'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'idle') return null

  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  return <>{children}</>
}
