import type { JSX } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/app/layout/PageHeader'
import { Settings } from 'lucide-react'

export function SettingsPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Units, gym profiles, schedule, theme, sounds, and data controls."
      />
      <EmptyState
        icon={Settings}
        title="Settings panel pending"
        description="Profile and gym data land in Phase 2. Export, import, backup, and About credits arrive in Phase 12."
      />
    </div>
  )
}
