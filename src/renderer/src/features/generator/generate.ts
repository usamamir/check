import type { Equipment, Exercise, ExperienceLevel, Goal, Muscle, SplitPref } from '@/db/types'
import {
  dayMusclesForSplit,
  rankMusclesForSession,
  resolveSplit,
  selectPrimaryMuscles,
  type WeeklyVolume
} from './muscles'
import { filterByEquipment, orderSessionExercises, rankExercises } from './exercises'
import { fitToSessionLength } from './sessionFit'
import { prescribeLoad, type LiftHistory } from './progression'
import type { FatigueMap } from './fatigue'
import { recoveryPct } from './fatigue'

export type GenerateInput = {
  exercises: Exercise[]
  goal: Goal
  experience: ExperienceLevel
  splitPref: SplitPref
  daysPerWeek: number
  sessionMinutes: number
  dayIndex: number
  fatigue: FatigueMap
  weeklyVolume: WeeklyVolume
  availableEquipment: Equipment[]
  favorites: Set<string>
  banned: Set<string>
  recentlyUsed: Set<string>
  anchors: Set<string>
  liftHistory: Record<string, LiftHistory>
  equipmentOpts: {
    barWeight: number
    plates: number[]
    dumbbellIncrement: number
    cableStep: number
  }
}

export type GeneratedExercise = {
  exercise: Exercise
  sets: number
  targetReps: number
  targetWeight: number
  reasoning: string
  locked?: boolean
}

export type GeneratedWorkout = {
  split: Exclude<SplitPref, 'auto'>
  primaryMuscles: Muscle[]
  exercises: GeneratedExercise[]
  estimatedMinutes: number
  warnings: string[]
  whyMuscles: string[]
}

export function generateWorkout(input: GenerateInput): GeneratedWorkout {
  const split = resolveSplit(input.splitPref, input.daysPerWeek, input.experience)
  const dayMuscles = dayMusclesForSplit(split, input.dayIndex)
  const rankedMuscles = rankMusclesForSession({
    candidates: dayMuscles,
    fatigue: input.fatigue,
    weeklyVolume: input.weeklyVolume,
    goal: input.goal
  })
  const { selected: primaryMuscles, warnings } = selectPrimaryMuscles(rankedMuscles, 3)

  const whyMuscles = primaryMuscles.map((m) => {
    const row = rankedMuscles.find((r) => r.muscle === m)!
    return `${m} is ${row.recovery.toFixed(0)}% recovered and you've done ${row.weeklySets}/${row.weeklyTarget} weekly sets.`
  })

  const pool = filterByEquipment(input.exercises, input.availableEquipment)
  const scored = rankExercises(pool, {
    neededMuscles: primaryMuscles,
    availableEquipment: input.availableEquipment,
    experience: input.experience,
    favorites: input.favorites,
    banned: input.banned,
    recentlyUsed: input.recentlyUsed,
    anchors: input.anchors
  })

  const ordered = orderSessionExercises(scored.map((s) => s.exercise))
  // Take a generous candidate list then fit to time
  const { selected, estimatedSeconds } = fitToSessionLength(
    ordered.slice(0, 12),
    input.sessionMinutes
  )

  const exercises: GeneratedExercise[] = selected.map((exercise) => {
    const scoredRow = scored.find((s) => s.exercise.id === exercise.id)
    const history = input.liftHistory[exercise.id] ?? { recentSets: [], failedSessions: 0 }
    const rx = prescribeLoad({
      goal: input.goal,
      mechanic: exercise.mechanic,
      equipment: exercise.equipment,
      history,
      equipmentOpts: input.equipmentOpts
    })

    const muscleWhy = exercise.primaryMuscles
      .filter((m) => primaryMuscles.includes(m))
      .map((m) => {
        const rec = recoveryPct(input.fatigue[m] ?? 0)
        return `${m} ${rec.toFixed(0)}% recovered`
      })
      .join('; ')

    const reasoning = [muscleWhy, ...(scoredRow?.reasons.slice(0, 2) ?? []), rx.reasoning]
      .filter(Boolean)
      .join(' ')

    return {
      exercise,
      sets: rx.sets,
      targetReps: rx.targetReps,
      targetWeight: rx.weight,
      reasoning
    }
  })

  return {
    split,
    primaryMuscles,
    exercises,
    estimatedMinutes: Math.round(estimatedSeconds / 60),
    warnings,
    whyMuscles
  }
}
