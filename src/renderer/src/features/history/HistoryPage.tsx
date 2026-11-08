import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { CalendarDays } from 'lucide-react'

export function HistoryPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="History"
        description="Calendar heat map and a list of every completed session."
      />
      <EmptyState
        icon={CalendarDays}
        title="No workouts logged"
        description="Completed sessions will appear here. Edits recompute fatigue and personal records."
      />
    </div>
  )
}
