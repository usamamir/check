import { create } from 'zustand'
import type { GeneratedExercise, GeneratedWorkout } from '@/features/generator'
import { buildTodayWorkout, persistPlannedWorkout } from '../services/buildTodayWorkout'
import { rankExercises, filterByEquipment } from '@/features/generator'
import { exercisesRepo, prefsRepo, profileRepo } from '@/db'

type TodayState = {
  workout: GeneratedWorkout | null
  workoutId: string | null
  loading: boolean
  error: string | null
  swapForId: string | null
  alternatives: GeneratedExercise[]
  generate: () => Promise<void>
  regenerate: () => Promise<void>
  removeExercise: (exerciseId: string) => void
  lockExercise: (exerciseId: string, locked: boolean) => void
  reorder: (from: number, to: number) => void
  openSwap: (exerciseId: string) => Promise<void>
  applySwap: (replacementId: string) => void
  closeSwap: () => void
}

function lockedIds(w: GeneratedWorkout | null): string[] {
  return (w?.exercises ?? []).filter((e) => e.locked).map((e) => e.exercise.id)
}

export const useTodayStore = create<TodayState>((set, get) => ({
  workout: null,
  workoutId: null,
  loading: false,
  error: null,
  swapForId: null,
  alternatives: [],

  generate: async () => {
    set({ loading: true, error: null })
    try {
      const workout = await buildTodayWorkout()
      const workoutId = await persistPlannedWorkout(workout)
      set({ workout, workoutId, loading: false })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to generate workout'
      })
    }
  },

  regenerate: async () => {
    set({ loading: true, error: null })
    try {
      const workout = await buildTodayWorkout({
        lockedExerciseIds: lockedIds(get().workout)
      })
      const workoutId = await persistPlannedWorkout(workout)
      set({ workout, workoutId, loading: false, swapForId: null, alternatives: [] })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to regenerate'
      })
    }
  },

  removeExercise: (exerciseId) => {
    const workout = get().workout
    if (!workout) return
    const exercises = workout.exercises.filter((e) => e.exercise.id !== exerciseId)
    set({ workout: { ...workout, exercises } })
    void persistPlannedWorkout({ ...workout, exercises })
  },

  lockExercise: (exerciseId, locked) => {
    const workout = get().workout
    if (!workout) return
    const exercises = workout.exercises.map((e) =>
      e.exercise.id === exerciseId ? { ...e, locked } : e
    )
    set({ workout: { ...workout, exercises } })
  },

  reorder: (from, to) => {
    const workout = get().workout
    if (!workout) return
    const exercises = [...workout.exercises]
    const [item] = exercises.splice(from, 1)
    exercises.splice(to, 0, item)
    const next = { ...workout, exercises }
    set({ workout: next })
    void persistPlannedWorkout(next)
  },

  openSwap: async (exerciseId) => {
    const workout = get().workout
    if (!workout) return
    const current = workout.exercises.find((e) => e.exercise.id === exerciseId)
    if (!current) return

    const [all, gym, favorites, banned] = await Promise.all([
      exercisesRepo.listExercises(),
      profileRepo.getActiveGymProfile(),
      prefsRepo.listFavoriteIds(),
      prefsRepo.listBannedIds()
    ])
    const pool = filterByEquipment(all, gym.equipment)
    const ranked = rankExercises(pool, {
      neededMuscles: current.exercise.primaryMuscles,
      availableEquipment: gym.equipment,
      experience: (await profileRepo.getUserProfile()).experience,
      favorites,
      banned,
      recentlyUsed: new Set(),
      anchors: new Set()
    })
      .filter((r) => r.exercise.id !== exerciseId)
      .slice(0, 5)

    set({
      swapForId: exerciseId,
      alternatives: ranked.map((r) => ({
        exercise: r.exercise,
        sets: current.sets,
        targetReps: current.targetReps,
        targetWeight: current.targetWeight,
        reasoning: r.reasons.join(' · ')
      }))
    })
  },

  applySwap: (replacementId) => {
    const { workout, swapForId, alternatives } = get()
    if (!workout || !swapForId) return
    const replacement = alternatives.find((a) => a.exercise.id === replacementId)
    if (!replacement) return
    const exercises = workout.exercises.map((e) =>
      e.exercise.id === swapForId ? { ...replacement, locked: e.locked } : e
    )
    const next = { ...workout, exercises }
    set({ workout: next, swapForId: null, alternatives: [] })
    void persistPlannedWorkout(next)
  },

  closeSwap: () => set({ swapForId: null, alternatives: [] })
}))
