import { db, exercisesRepo, prefsRepo, profileRepo } from '@/db'
import { emptyFatigue, generateWorkout, type GeneratedWorkout } from '@/features/generator'
import type { LiftHistory } from '@/features/generator'
import { differenceInCalendarDays, startOfWeek } from 'date-fns'

export async function buildTodayWorkout(opts?: {
  lockedExerciseIds?: string[]
  dayIndexOffset?: number
}): Promise<GeneratedWorkout> {
  const [profile, gym, exercises, favorites, banned] = await Promise.all([
    profileRepo.getUserProfile(),
    profileRepo.getActiveGymProfile(),
    exercisesRepo.listExercises(),
    prefsRepo.listFavoriteIds(),
    prefsRepo.listBannedIds()
  ])

  const dayIndex =
    (differenceInCalendarDays(new Date(), startOfWeek(new Date(), { weekStartsOn: 1 })) +
      (opts?.dayIndexOffset ?? 0) +
      7) %
    7

  // Recent exercise usage from last 2 completed workouts
  const recentWorkouts = await db.workouts
    .where('status')
    .equals('completed')
    .reverse()
    .sortBy('endedAt')
  const lastTwo = recentWorkouts.slice(-2)
  const recentlyUsed = new Set<string>()
  for (const w of lastTwo) {
    const wes = await db.workoutExercises.where('workoutId').equals(w.id).toArray()
    for (const we of wes) recentlyUsed.add(we.exerciseId)
  }

  // Weekly volume (sets per muscle this week) — approximate from completed sets
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
  const weekWorkouts = await db.workouts
    .where('startedAt')
    .aboveOrEqual(weekStart)
    .filter((w) => w.status === 'completed')
    .toArray()

  const weeklyVolume: Partial<Record<string, number>> = {}
  for (const w of weekWorkouts) {
    const wes = await db.workoutExercises.where('workoutId').equals(w.id).toArray()
    for (const we of wes) {
      const ex = await db.exercises.get(we.exerciseId)
      if (!ex) continue
      const setCount = await db.sets.where('workoutExerciseId').equals(we.id).count()
      for (const m of ex.primaryMuscles) {
        weeklyVolume[m] = (weeklyVolume[m] ?? 0) + setCount
      }
    }
  }

  // Lift history for progression
  const liftHistory: Record<string, LiftHistory> = {}
  // Keep light for generate — engine handles empty history

  const locked = new Set(opts?.lockedExerciseIds ?? [])
  const anchors = new Set<string>([...locked])

  const generated = generateWorkout({
    exercises,
    goal: profile.goal,
    experience: profile.experience,
    splitPref: profile.splitPref,
    daysPerWeek: profile.daysPerWeek,
    sessionMinutes: profile.sessionMinutes,
    dayIndex,
    fatigue: emptyFatigue(), // Phase 8 wires live fatigue; fresh start is fine
    weeklyVolume,
    availableEquipment: gym.equipment,
    favorites,
    banned,
    recentlyUsed,
    anchors,
    liftHistory,
    equipmentOpts: {
      barWeight: gym.barWeight,
      plates: gym.plates,
      dumbbellIncrement: gym.dumbbellIncrement,
      cableStep: gym.cableStep
    }
  })

  // Re-inject locked exercises if regenerate dropped them
  if (locked.size > 0) {
    const have = new Set(generated.exercises.map((e) => e.exercise.id))
    for (const id of locked) {
      if (have.has(id)) {
        const row = generated.exercises.find((e) => e.exercise.id === id)
        if (row) row.locked = true
        continue
      }
      const exercise = exercises.find((e) => e.id === id)
      if (!exercise) continue
      generated.exercises.unshift({
        exercise,
        sets: 3,
        targetReps: 8,
        targetWeight: 0,
        reasoning: 'Locked from previous plan.',
        locked: true
      })
    }
  }

  return generated
}

export async function persistPlannedWorkout(generated: GeneratedWorkout): Promise<string> {
  const gym = await profileRepo.getActiveGymProfile()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.transaction('rw', db.workouts, db.workoutExercises, db.sets, async () => {
    // Clear other planned workouts
    const planned = await db.workouts.where('status').equals('planned').toArray()
    for (const p of planned) {
      const wes = await db.workoutExercises.where('workoutId').equals(p.id).toArray()
      for (const we of wes) {
        await db.sets.where('workoutExerciseId').equals(we.id).delete()
      }
      await db.workoutExercises.where('workoutId').equals(p.id).delete()
      await db.workouts.delete(p.id)
    }

    await db.workouts.put({
      id,
      startedAt: now,
      endedAt: null,
      status: 'planned',
      gymProfileId: gym.id,
      rating: null,
      notes: '',
      source: 'adaptive',
      templateId: null,
      programId: null
    })

    for (let i = 0; i < generated.exercises.length; i++) {
      const ge = generated.exercises[i]
      const weId = crypto.randomUUID()
      await db.workoutExercises.put({
        id: weId,
        workoutId: id,
        exerciseId: ge.exercise.id,
        order: i,
        supersetGroup: null,
        notes: '',
        reasoning: ge.reasoning,
        locked: Boolean(ge.locked)
      })
      for (let s = 0; s < ge.sets; s++) {
        await db.sets.put({
          id: crypto.randomUUID(),
          workoutExerciseId: weId,
          order: s,
          type: 'working',
          targetWeight: ge.targetWeight,
          targetReps: ge.targetReps,
          weight: null,
          reps: null,
          rpe: null,
          completedAt: null
        })
      }
    }
  })

  return id
}
