import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { Check, ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import { PageHeader } from '@/app/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { db, profileRepo } from '@/db'
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from '@/db/types'
import { ExerciseMedia } from '@/features/library/components/ExerciseMedia'
import { Dumbbell } from 'lucide-react'
import { RestTimer } from './components/RestTimer'
import { PlateCalculator } from './components/PlateCalculator'
import { detectPrs, savePrs, type DetectedPr } from './services/prDetection'
import { ENGINE_CONFIG } from '@/features/generator'
import { cn } from '@/lib/utils'

type SessionRow = {
  we: WorkoutExercise
  exercise: Exercise
  sets: WorkoutSet[]
}

export function WorkoutPage(): JSX.Element {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [rows, setRows] = useState<SessionRow[]>([])
  const [index, setIndex] = useState(0)
  const [restActive, setRestActive] = useState(false)
  const [restSeconds, setRestSeconds] = useState(90)
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [platesFor, setPlatesFor] = useState<number | null>(null)
  const [barWeight, setBarWeight] = useState(20)
  const [plates, setPlates] = useState<number[]>([25, 20, 15, 10, 5, 2.5])
  const [lastPrs, setLastPrs] = useState<DetectedPr[]>([])
  const [finished, setFinished] = useState(false)
  const [rating, setRating] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const gym = await profileRepo.getActiveGymProfile()
    setBarWeight(gym.barWeight)
    setPlates(gym.plates)

    let w =
      (await db.workouts.where('status').equals('active').first()) ??
      (await db.workouts.where('status').equals('planned').first())

    if (!w) {
      setWorkout(null)
      setRows([])
      setLoading(false)
      return
    }

    if (w.status === 'planned') {
      w = { ...w, status: 'active', startedAt: new Date().toISOString() }
      await db.workouts.put(w)
    }

    const wes = await db.workoutExercises.where('workoutId').equals(w.id).sortBy('order')
    const built: SessionRow[] = []
    for (const we of wes) {
      const exercise = await db.exercises.get(we.exerciseId)
      if (!exercise) continue
      const sets = await db.sets.where('workoutExerciseId').equals(we.id).sortBy('order')
      built.push({ we, exercise, sets })
    }

    setWorkout(w)
    setRows(built)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await load()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000
    )
    return () => window.clearInterval(id)
  }, [startedAt])

  const current = rows[index]
  const totalSets = rows.reduce((n, r) => n + r.sets.length, 0)
  const completedSets = rows.reduce((n, r) => n + r.sets.filter((s) => s.completedAt).length, 0)
  const volume = rows.reduce(
    (n, r) =>
      n +
      r.sets.reduce(
        (vn, s) => vn + (s.completedAt && s.weight && s.reps ? s.weight * s.reps : 0),
        0
      ),
    0
  )

  const restDefault = useMemo(() => {
    if (!current) return 90
    return current.exercise.mechanic === 'compound'
      ? ENGINE_CONFIG.timing.restSeconds.compound
      : ENGINE_CONFIG.timing.restSeconds.isolation
  }, [current])

  const updateSet = async (setId: string, patch: Partial<WorkoutSet>): Promise<void> => {
    const set = await db.sets.get(setId)
    if (!set) return
    const next = { ...set, ...patch }
    await db.sets.put(next)
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        sets: row.sets.map((s) => (s.id === setId ? next : s))
      }))
    )
  }

  const completeSet = async (set: WorkoutSet): Promise<void> => {
    const weight = set.weight ?? set.targetWeight ?? 0
    const reps = set.reps ?? set.targetReps ?? 0
    await updateSet(set.id, {
      weight,
      reps,
      completedAt: new Date().toISOString()
    })

    if (current) {
      const prs = await detectPrs({
        exerciseId: current.exercise.id,
        weight,
        reps
      })
      if (prs.length) {
        await savePrs(current.exercise.id, set.id, prs)
        setLastPrs(prs)
        void confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#C6FF3D', '#fff']
        })
      }
    }

    setRestSeconds(restDefault)
    setRestActive(true)
  }

  const finish = async (): Promise<void> => {
    if (!workout) return
    await db.workouts.put({
      ...workout,
      status: 'completed',
      endedAt: new Date().toISOString(),
      rating
    })
    setFinished(true)
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface/50" />
  }

  if (!workout || rows.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No active session"
        description="Generate a workout on Today, then tap Start Workout."
        actionLabel="Go to Today"
        onAction={() => navigate('/')}
      />
    )
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface/70 p-8 text-center">
        <h2 className="font-display text-4xl font-bold tracking-wide">Session complete</h2>
        <p className="mt-2 text-muted">Nice work. Here’s the rundown.</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Duration" value={`${Math.floor(elapsed / 60)}m`} />
          <Stat label="Volume" value={`${Math.round(volume)}`} />
          <Stat label="Sets" value={`${completedSets}`} />
        </div>
        {lastPrs.length > 0 ? (
          <p className="mt-4 text-sm text-accent">PRs hit this session — keep them coming.</p>
        ) : null}
        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            How did it feel?
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                type="button"
                size="icon"
                variant={rating === n ? 'default' : 'secondary'}
                onClick={() => setRating(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-8 flex justify-center gap-2">
          <Button asChild variant="secondary">
            <Link to="/">Back to Today</Link>
          </Button>
          <Button asChild>
            <Link to="/history">History</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-36">
      <PageHeader
        title={current.exercise.name}
        description={`Exercise ${index + 1} of ${rows.length}`}
        actions={
          <div className="flex items-center gap-2 text-sm text-muted">
            <Timer className="h-4 w-4" />
            <span className="font-display text-lg tabular text-foreground">
              {formatElapsed(elapsed)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-display tabular text-accent">{Math.round(volume)}</span>
            <span className="text-xs">vol</span>
          </div>
        }
      />

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <ExerciseMedia
          exerciseId={current.exercise.id}
          exerciseName={current.exercise.name}
          images={current.exercise.images}
        />

        <div>
          {lastPrs.length > 0 ? (
            <div className="mb-3 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
              New PR! {lastPrs.map((p) => p.label).join(' · ')}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] gap-2 border-b border-border bg-surface-raised/50 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>#</span>
              <span>Target</span>
              <span>Weight</span>
              <span>Reps</span>
              <span />
            </div>
            {current.sets.map((set, i) => {
              const done = Boolean(set.completedAt)
              return (
                <div
                  key={set.id}
                  className={cn(
                    'grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] items-center gap-2 px-3 py-2',
                    i > 0 && 'border-t border-border',
                    done && 'bg-accent-soft/40'
                  )}
                >
                  <span className="font-display text-sm tabular text-muted">{i + 1}</span>
                  <button
                    type="button"
                    className="text-left text-xs text-muted hover:text-accent"
                    onClick={() => setPlatesFor(set.targetWeight ?? set.weight ?? 0)}
                  >
                    {set.targetWeight ?? '—'}×{set.targetReps ?? '—'}
                  </button>
                  <input
                    className="h-9 rounded-lg border border-border bg-background px-2 font-display text-lg tabular"
                    type="number"
                    disabled={done}
                    value={set.weight ?? set.targetWeight ?? ''}
                    onChange={(e) =>
                      void updateSet(set.id, {
                        weight: e.target.value ? Number(e.target.value) : null
                      })
                    }
                  />
                  <input
                    className="h-9 rounded-lg border border-border bg-background px-2 font-display text-lg tabular"
                    type="number"
                    disabled={done}
                    value={set.reps ?? set.targetReps ?? ''}
                    onChange={(e) =>
                      void updateSet(set.id, {
                        reps: e.target.value ? Number(e.target.value) : null
                      })
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant={done ? 'secondary' : 'default'}
                    disabled={done}
                    aria-label="Complete set"
                    onClick={() => void completeSet(set)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            {index < rows.length - 1 ? (
              <Button type="button" variant="secondary" onClick={() => setIndex((i) => i + 1)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={() => void finish()}>
                Finish workout
              </Button>
            )}
          </div>
        </div>
      </div>

      <RestTimer
        seconds={restSeconds}
        active={restActive}
        onDone={() => {
          setRestActive(false)
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('FORGE', { body: 'Rest over — next set.' })
          }
        }}
        onSkip={() => setRestActive(false)}
        onAdjust={(d) => setRestSeconds((s) => Math.max(5, s + d))}
      />

      {platesFor != null ? (
        <PlateCalculator
          totalWeight={platesFor}
          barWeight={barWeight}
          plates={plates}
          onClose={() => setPlatesFor(null)}
        />
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-surface-raised/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular text-foreground">{value}</div>
    </div>
  )
}

function formatElapsed(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
