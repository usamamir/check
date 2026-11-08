import type { JSX } from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Lock, LockOpen, RefreshCw, Replace, Trash2, Play, Flame } from 'lucide-react'
import { PageHeader } from '@/app/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { muscleLabel } from '@/features/library/muscleLabels'
import { useTodayStore } from './store/todayStore'
import { WhyThisPopover } from './components/WhyThisPopover'
import { cn } from '@/lib/utils'
import type { GeneratedExercise } from '@/features/generator'

export function TodayPage(): JSX.Element {
  const {
    workout,
    loading,
    error,
    generate,
    regenerate,
    removeExercise,
    lockExercise,
    reorder,
    openSwap,
    applySwap,
    closeSwap,
    swapForId,
    alternatives
  } = useTodayStore()

  useEffect(() => {
    if (!workout && !loading) void generate()
  }, [workout, loading, generate])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over || !workout || active.id === over.id) return
    const oldIndex = workout.exercises.findIndex((e) => e.exercise.id === active.id)
    const newIndex = workout.exercises.findIndex((e) => e.exercise.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(workout.exercises, oldIndex, newIndex)
    // apply via reorder pairwise
    reorder(oldIndex, newIndex)
    void next
  }

  return (
    <div>
      <PageHeader
        title="Today"
        description="Your adaptive session — regenerate, swap, lock, and reorder."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => void regenerate()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Regenerate
          </Button>
        }
      />

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/70 p-6 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)]">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />
        {loading && !workout ? (
          <div className="h-40 animate-pulse rounded-xl bg-surface-raised/60" />
        ) : workout ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Adaptive · {workout.split.replaceAll('_', ' ')}
                </div>
                <h2 className="mt-1 font-display text-4xl font-bold tracking-wide text-foreground">
                  {workout.primaryMuscles.map(muscleLabel).slice(0, 3).join(' · ') || 'Session'}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  <span className="font-display text-2xl font-semibold tabular text-accent">
                    {workout.estimatedMinutes}
                  </span>{' '}
                  min · {workout.exercises.length} exercises
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {workout.primaryMuscles.map((m) => (
                    <span
                      key={m}
                      className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent"
                    >
                      {muscleLabel(m)}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild size="lg" disabled={workout.exercises.length === 0}>
                <Link to="/workout">
                  <Play className="h-4 w-4" />
                  Start Workout
                </Link>
              </Button>
            </div>
            {workout.warnings.length > 0 ? (
              <p className="mt-4 text-sm text-warning">{workout.warnings.join(' ')}</p>
            ) : null}
            {workout.whyMuscles.length > 0 ? (
              <p className="mt-3 max-w-2xl text-xs text-muted-foreground">
                {workout.whyMuscles[0]}
              </p>
            ) : null}
          </>
        ) : (
          <div className="flex items-center gap-3 text-muted">
            <Flame className="h-5 w-5 text-accent" />
            Generate a workout to get started.
            <Button type="button" size="sm" onClick={() => void generate()}>
              Generate
            </Button>
          </div>
        )}
      </section>

      {workout && workout.exercises.length > 0 ? (
        <section className="mt-6">
          <h3 className="mb-3 font-display text-xl font-bold tracking-wide">Exercises</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={workout.exercises.map((e) => e.exercise.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {workout.exercises.map((row) => (
                  <SortableExerciseRow
                    key={row.exercise.id}
                    row={row}
                    onRemove={() => removeExercise(row.exercise.id)}
                    onLock={() => lockExercise(row.exercise.id, !row.locked)}
                    onSwap={() => void openSwap(row.exercise.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      ) : null}

      {swapForId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
            <h3 className="font-display text-2xl font-bold">Swap exercise</h3>
            <p className="mt-1 text-sm text-muted">Top 5 alternatives for the same muscles.</p>
            <div className="mt-4 space-y-2">
              {alternatives.map((alt) => (
                <button
                  key={alt.exercise.id}
                  type="button"
                  className="w-full rounded-xl border border-border bg-surface-raised/50 px-4 py-3 text-left hover:border-accent/40 hover:bg-accent-soft"
                  onClick={() => applySwap(alt.exercise.id)}
                >
                  <div className="font-medium text-foreground">{alt.exercise.name}</div>
                  <div className="mt-1 text-xs text-muted">{alt.reasoning}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="ghost" onClick={closeSwap}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SortableExerciseRow({
  row,
  onRemove,
  onLock,
  onSwap
}: {
  row: GeneratedExercise
  onRemove: () => void
  onLock: () => void
  onSwap: () => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.exercise.id
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-3 py-3',
        isDragging && 'z-10 border-accent/40 bg-surface-raised shadow-lg'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{row.exercise.name}</div>
        <div className="mt-0.5 text-xs text-muted">
          <span className="font-display text-base font-semibold tabular text-foreground">
            {row.sets}
          </span>
          ×
          <span className="font-display text-base font-semibold tabular text-foreground">
            {row.targetReps}
          </span>
          {' @ '}
          <span className="font-display text-base font-semibold tabular text-accent">
            {row.targetWeight}
          </span>
        </div>
        <WhyThisPopover reasoning={row.reasoning} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" size="icon" variant="ghost" aria-label="Lock" onClick={onLock}>
          {row.locked ? <Lock className="h-4 w-4 text-accent" /> : <LockOpen className="h-4 w-4" />}
        </Button>
        <Button type="button" size="icon" variant="ghost" aria-label="Swap" onClick={onSwap}>
          <Replace className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" aria-label="Remove" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
