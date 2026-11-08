import type { JSX } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { profileRepo } from '@/db'
import { CommandPalette } from '@/app/CommandPalette'

export function RequireOnboarding(): JSX.Element {
  const location = useLocation()
  const { data, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => profileRepo.getUserProfile()
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-accent/30" />
      </div>
    )
  }

  const onboarding = location.pathname.includes('onboarding')
  if (data && !data.onboardingComplete && !onboarding) {
    return <Navigate to="/onboarding" replace />
  }
  if (data?.onboardingComplete && onboarding) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <Outlet />
      <CommandPalette />
    </>
  )
}
