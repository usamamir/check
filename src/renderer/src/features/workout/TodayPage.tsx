import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { LayoutDashboard } from 'lucide-react'

export function TodayPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Today"
        description="Your adaptive session, recovery snapshot, streak, and latest PR."
      />
      <div className="rounded-2xl border border-border bg-surface/60 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)]">
        <EmptyState
          icon={LayoutDashboard}
          title="No workout generated yet"
          description="Once the adaptive engine is online, this hero card will show today's session — muscles, duration, and a one-tap Start Workout."
          actionLabel="Coming in Phase 6"
        />
      </div>
    </div>
  )
}
