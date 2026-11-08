import type { JSX } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '@/app/layout/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { db } from '@/db'
import { CalendarDays, Trash2 } from 'lucide-react'

export function HistoryPage(): JSX.Element {
  const queryClient = useQueryClient()
  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const rows = await db.workouts.where('status').equals('completed').reverse().sortBy('endedAt')
      return rows.reverse().sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))
    }
  })

  return (
    <div>
      <PageHeader
        title="History"
        description="Completed sessions. Delete to remove; fatigue recomputes on next recovery view."
      />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl border border-border bg-surface/50" />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No workouts logged"
          description="Finish a session to see it here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {workouts.map((w, i) => (
            <div
              key={w.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <div>
                <div className="text-sm font-medium text-foreground">
                  {w.endedAt ? format(parseISO(w.endedAt), 'EEE, MMM d · HH:mm') : '—'}
                </div>
                <div className="text-xs text-muted">
                  {w.source} · rating {w.rating ?? '—'}
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Delete workout"
                onClick={async () => {
                  const wes = await db.workoutExercises.where('workoutId').equals(w.id).toArray()
                  for (const we of wes) {
                    await db.sets.where('workoutExerciseId').equals(we.id).delete()
                  }
                  await db.workoutExercises.where('workoutId').equals(w.id).delete()
                  await db.workouts.delete(w.id)
                  await queryClient.invalidateQueries({ queryKey: ['history'] })
                  await queryClient.invalidateQueries({ queryKey: ['fatigue'] })
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
