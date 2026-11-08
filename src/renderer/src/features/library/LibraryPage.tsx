import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { Library } from 'lucide-react'

export function LibraryPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Library"
        description="800+ exercises with search, filters, videos, and personal history."
      />
      <EmptyState
        icon={Library}
        title="Exercise library is empty"
        description="Phase 2 imports free-exercise-db offline. Phase 4 adds detail pages, YouTube embeds, and custom exercises."
      />
    </div>
  )
}
