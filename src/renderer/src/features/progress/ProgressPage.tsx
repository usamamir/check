import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { LineChart } from 'lucide-react'

export function ProgressPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Progress"
        description="Strength score, 1RM trends, volume vs targets, streaks, and PRs."
      />
      <EmptyState
        icon={LineChart}
        title="Not enough data yet"
        description="Charts unlock after a few sessions. Use the Phase 12 seed tool for eight weeks of fake history while developing."
      />
    </div>
  )
}
