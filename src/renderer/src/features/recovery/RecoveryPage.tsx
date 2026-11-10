import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { Activity } from 'lucide-react'

export function RecoveryPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Recovery"
        description="Front and back muscle heatmap driven by your logged fatigue."
      />
      <EmptyState
        icon={Activity}
        title="Heatmap not wired yet"
        description="Each muscle will color from fatigued red to fresh green, with weekly sets, last trained, and top exercises on hover."
      />
    </div>
  )
}
