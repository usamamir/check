import type { JSX } from 'react'
import type { Muscle } from '@/db/types'
import { cn } from '@/lib/utils'
import { muscleLabel } from '../muscleLabels'

export function MuscleChips({
  primary,
  secondary
}: {
  primary: Muscle[]
  secondary: Muscle[]
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      {primary.map((m) => (
        <span
          key={`p-${m}`}
          className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent"
        >
          {muscleLabel(m)}
        </span>
      ))}
      {secondary.map((m) => (
        <span
          key={`s-${m}`}
          className={cn('rounded-md border border-border px-2 py-0.5 text-[11px] text-muted')}
        >
          {muscleLabel(m)}
        </span>
      ))}
    </div>
  )
}
