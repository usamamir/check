import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { Dumbbell } from 'lucide-react'

export function WorkoutPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Workout"
        description="Focused session mode with sets, rest timer, and live PR detection."
      />
      <EmptyState
        icon={Dumbbell}
        title="No active session"
        description="Start a generated workout from Today. Mid-session state will persist so you can resume after a crash or restart."
      />
    </div>
  )
}
