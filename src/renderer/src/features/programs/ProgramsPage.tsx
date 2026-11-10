import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { Flame } from 'lucide-react'

export function ProgramsPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Programs"
        description="Adaptive mode or follow a built-in template with progressive overload."
      />
      <EmptyState
        icon={Flame}
        title="No programs loaded"
        description="Full Body, Upper/Lower, PPL, and a 5/3/1-style block ship as JSON in Phase 10 — still driven by the progression engine."
      />
    </div>
  )
}
