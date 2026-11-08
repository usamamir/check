import type { JSX } from 'react'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Model, { type IExerciseData } from 'react-body-highlighter'
import { PageHeader } from '@/app/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { muscleLabel } from '@/features/library/muscleLabels'
import { computeCurrentFatigue, fatigueToRecoveryMap } from './computeRecovery'
import { FORGE_TO_HIGHLIGHTER, recoveryToFrequency, RECOVERY_COLORS } from './muscleMap'
import type { Muscle } from '@/db/types'
import { MUSCLES } from '@/db/types'

export function RecoveryPage(): JSX.Element {
  const navigate = useNavigate()
  const { data: fatigue, isLoading } = useQuery({
    queryKey: ['fatigue'],
    queryFn: computeCurrentFatigue
  })

  const recovery = useMemo(() => (fatigue ? fatigueToRecoveryMap(fatigue) : null), [fatigue])

  const modelData = useMemo((): IExerciseData[] => {
    if (!recovery) return []
    const bySlug: Record<string, IExerciseData> = {}
    for (const muscle of MUSCLES) {
      const slugs = FORGE_TO_HIGHLIGHTER[muscle] ?? []
      const freq = recoveryToFrequency(recovery[muscle] ?? 100)
      if (freq === 0) continue
      for (const slug of slugs) {
        const existing = bySlug[slug]
        if (!existing || (existing.frequency ?? 0) < freq) {
          bySlug[slug] = {
            name: muscleLabel(muscle),
            muscles: [slug as IExerciseData['muscles'][number]],
            frequency: freq
          }
        }
      }
    }
    return Object.values(bySlug)
  }, [recovery])

  return (
    <div>
      <PageHeader
        title="Recovery"
        description="Fatigue heatmap from your logged sets — green is fresh, red is fatigued."
      />

      {isLoading || !recovery ? (
        <div className="h-80 animate-pulse rounded-2xl border border-border bg-surface/50" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-border bg-surface/60 p-4">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Anterior
            </div>
            <Model
              data={modelData}
              type="anterior"
              bodyColor="#2a2a2e"
              highlightedColors={RECOVERY_COLORS}
              style={{ width: '100%', maxWidth: 280, margin: '0 auto' }}
            />
          </div>
          <div className="rounded-2xl border border-border bg-surface/60 p-4">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Posterior
            </div>
            <Model
              data={modelData}
              type="posterior"
              bodyColor="#2a2a2e"
              highlightedColors={RECOVERY_COLORS}
              style={{ width: '100%', maxWidth: 280, margin: '0 auto' }}
            />
          </div>
        </div>
      )}

      {recovery ? (
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(recovery) as Array<[Muscle, number]>)
            .sort((a, b) => a[1] - b[1])
            .map(([muscle, pct]) => (
              <button
                key={muscle}
                type="button"
                className="flex items-center justify-between rounded-xl border border-border bg-surface/50 px-3 py-2 text-left hover:border-border-strong"
                onClick={() => navigate(`/library?muscle=${muscle}`)}
              >
                <span className="text-sm text-foreground">{muscleLabel(muscle)}</span>
                <span
                  className="font-display text-lg font-semibold tabular"
                  style={{
                    color: pct >= 70 ? '#3DD68C' : pct >= 50 ? '#F5A524' : '#FF5A5A'
                  }}
                >
                  {pct.toFixed(0)}%
                </span>
              </button>
            ))}
        </div>
      ) : null}

      <div className="mt-6">
        <Button type="button" variant="secondary" onClick={() => navigate('/')}>
          Build today’s workout
        </Button>
      </div>
    </div>
  )
}
