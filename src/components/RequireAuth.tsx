import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../lib/auth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = getCurrentUser()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user.onboardingDone && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return children
}
