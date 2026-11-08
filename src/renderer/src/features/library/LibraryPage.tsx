import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/app/layout/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { exercisesRepo } from '@/db'
import { Library } from 'lucide-react'

export function LibraryPage(): JSX.Element {
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => exercisesRepo.listExercises()
  })

  return (
    <div>
      <PageHeader
        title="Library"
        description="800+ exercises with search, filters, videos, and personal history."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-border bg-surface-raised/50"
            />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Exercise library is empty"
          description="Run npm run import:exercises to download and normalize free-exercise-db."
        />
      ) : (
        <div>
          <p className="mb-4 text-sm text-muted">
            <span className="font-display text-2xl font-bold tabular text-accent">
              {exercises.length}
            </span>{' '}
            exercises seeded offline. Full search / filters / detail pages ship in Phase 4.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.slice(0, 24).map((ex) => (
              <div
                key={ex.id}
                className="rounded-xl border border-border bg-surface/60 px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover"
              >
                <div className="truncate text-sm font-medium text-foreground">{ex.name}</div>
                <div className="mt-1 truncate text-xs text-muted">
                  {ex.primaryMuscles.join(', ') || '—'} · {ex.equipment.join(', ')}
                </div>
              </div>
            ))}
          </div>
          {exercises.length > 24 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Showing 24 of {exercises.length}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
