import type { JSX } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '@/app/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { exercisesRepo, prefsRepo } from '@/db'
import { ExerciseMedia } from './components/ExerciseMedia'
import { MuscleChips } from './components/MuscleChips'
import { Library } from 'lucide-react'

export function ExerciseDetailPage(): JSX.Element {
  const { exerciseId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const exerciseQuery = useQuery({
    queryKey: ['exercise', exerciseId],
    queryFn: () => exercisesRepo.getExercise(exerciseId),
    enabled: Boolean(exerciseId)
  })

  const prefQuery = useQuery({
    queryKey: ['exercisePref', exerciseId],
    queryFn: () => prefsRepo.getExercisePref(exerciseId),
    enabled: Boolean(exerciseId)
  })

  const updatePref = useMutation({
    mutationFn: (patch: Parameters<typeof prefsRepo.updateExercisePref>[1]) =>
      prefsRepo.updateExercisePref(exerciseId, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['exercisePref', exerciseId] })
      await queryClient.invalidateQueries({ queryKey: ['favoriteIds'] })
    }
  })

  const exercise = exerciseQuery.data
  const pref = prefQuery.data

  if (exerciseQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface/50" />
  }

  if (!exercise) {
    return (
      <EmptyState
        icon={Library}
        title="Exercise not found"
        description="It may have been deleted."
        actionLabel="Back to library"
        onAction={() => navigate('/library')}
      />
    )
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/library">
          <ArrowLeft className="h-4 w-4" />
          Library
        </Link>
      </Button>

      <PageHeader
        title={exercise.name}
        description={[
          exercise.level,
          exercise.mechanic,
          exercise.force,
          exercise.equipment.join(', ').replaceAll('_', ' ')
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={pref?.favorite ? 'default' : 'secondary'}
              onClick={() => updatePref.mutate({ favorite: !pref?.favorite })}
            >
              <Star className={pref?.favorite ? 'fill-current' : ''} />
              Favorite
            </Button>
            <Button
              type="button"
              size="sm"
              variant={pref?.banned ? 'danger' : 'secondary'}
              onClick={() => updatePref.mutate({ banned: !pref?.banned })}
            >
              <Ban />
              {pref?.banned ? 'Allowed' : 'Never suggest'}
            </Button>
            {exercise.isCustom ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await exercisesRepo.deleteCustomExercise(exercise.id)
                  await queryClient.invalidateQueries({ queryKey: ['exercises'] })
                  navigate('/library')
                }}
              >
                <Trash2 />
                Delete
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ExerciseMedia
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          images={exercise.images}
        />

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-surface/60 p-4">
            <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Muscles</h3>
            <div className="mt-3">
              <MuscleChips
                primary={exercise.primaryMuscles}
                secondary={exercise.secondaryMuscles}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Full body heatmap lands in Phase 8 — chips show primary (accent) and secondary.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-surface/60 p-4">
            <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Personal notes
            </h3>
            <textarea
              className="mt-3 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm"
              placeholder="Cues, grip width, anything you want to remember…"
              defaultValue={pref?.notes ?? ''}
              onBlur={(e) => updatePref.mutate({ notes: e.target.value })}
            />
          </section>

          <section className="rounded-2xl border border-border bg-surface/60 p-4">
            <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Your history
            </h3>
            <p className="mt-2 text-sm text-muted">
              Estimated 1RM chart and best sets unlock after you log this lift (Phase 7 / 9).
            </p>
          </section>
        </div>
      </div>

      {exercise.instructions.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-border bg-surface/60 p-5">
          <h3 className="font-display text-xl font-bold tracking-wide">Instructions</h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="pl-1">
                <span className="text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  )
}
