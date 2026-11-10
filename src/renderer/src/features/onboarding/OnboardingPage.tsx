import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { Sparkles } from 'lucide-react'

export function OnboardingPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Welcome"
        description="A 60-second setup so FORGE can build workouts around you."
      />
      <EmptyState
        icon={Sparkles}
        title="Onboarding arrives in Phase 3"
        description="Goal, experience, schedule, equipment, and optional baseline lifts will live here. For now the shell is ready."
      />
    </div>
  )
}
