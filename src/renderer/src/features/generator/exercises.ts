import type { Equipment, Exercise, ExperienceLevel, Muscle } from '@/db/types'
import { ENGINE_CONFIG } from './engineConfig'

export type ExerciseScoreContext = {
  neededMuscles: Muscle[]
  availableEquipment: Equipment[]
  experience: ExperienceLevel
  favorites: Set<string>
  banned: Set<string>
  /** exerciseIds used in the last N sessions for variety penalty */
  recentlyUsed: Set<string>
  /** Stable "anchor" lifts that should stay across weeks */
  anchors: Set<string>
}

export type ScoredExercise = {
  exercise: Exercise
  score: number
  reasons: string[]
}

function levelOk(exercise: Exercise, experience: ExperienceLevel): boolean {
  if (experience === 'beginner') return exercise.level !== 'expert'
  return true
}

export function filterByEquipment(exercises: Exercise[], available: Equipment[]): Exercise[] {
  const avail = new Set(available)
  return exercises.filter((e) => e.equipment.every((eq) => avail.has(eq) || eq === 'bodyweight'))
}

export function scoreExercise(
  exercise: Exercise,
  ctx: ExerciseScoreContext
): ScoredExercise | null {
  if (ENGINE_CONFIG.selection.bannedHardExclude && ctx.banned.has(exercise.id)) {
    return null
  }
  if (!levelOk(exercise, ctx.experience)) return null

  const avail = new Set(ctx.availableEquipment)
  if (!exercise.equipment.every((eq) => avail.has(eq) || eq === 'bodyweight')) {
    return null
  }

  let score = 0
  const reasons: string[] = []

  const primaryHits = exercise.primaryMuscles.filter((m) => ctx.neededMuscles.includes(m))
  const secondaryHits = exercise.secondaryMuscles.filter((m) => ctx.neededMuscles.includes(m))
  if (primaryHits.length === 0 && secondaryHits.length === 0) return null

  score += primaryHits.length * 40
  score += secondaryHits.length * 15
  if (primaryHits.length) {
    reasons.push(`Targets ${primaryHits.join(', ')}`)
  }

  if (exercise.mechanic === 'compound') {
    score += 20
    reasons.push('Compound movement')
  } else if (exercise.mechanic === 'isolation') {
    score += 5
  }

  if (ctx.favorites.has(exercise.id)) {
    score *= ENGINE_CONFIG.selection.favoriteBoost
    reasons.push('Favorite')
  }

  if (ctx.anchors.has(exercise.id)) {
    score += 12
    reasons.push('Anchor lift')
  } else if (ctx.recentlyUsed.has(exercise.id)) {
    score *= 1 - ENGINE_CONFIG.selection.recentSessionPenalty
    reasons.push('Used recently — variety penalty')
  }

  if (
    exercise.level === ctx.experience ||
    (ctx.experience === 'advanced' && exercise.level === 'expert')
  ) {
    score += 5
  }

  return { exercise, score, reasons }
}

export function rankExercises(exercises: Exercise[], ctx: ExerciseScoreContext): ScoredExercise[] {
  return exercises
    .map((e) => scoreExercise(e, ctx))
    .filter((s): s is ScoredExercise => s != null)
    .sort((a, b) => b.score - a.score)
}

export function orderSessionExercises(exercises: Exercise[]): Exercise[] {
  const rank = (e: Exercise): number => {
    if (
      e.mechanic === 'compound' &&
      e.primaryMuscles.some((m) =>
        ['quads', 'hamstrings', 'glutes', 'chest', 'upper_back', 'lats'].includes(m)
      )
    )
      return 0
    if (e.mechanic === 'compound') return 1
    if (e.mechanic === 'isolation') return 2
    if (e.primaryMuscles.includes('abs') || e.primaryMuscles.includes('obliques')) return 3
    return 2
  }
  return [...exercises].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

export function alternativesFor(
  ranked: ScoredExercise[],
  currentId: string,
  limit = 5
): ScoredExercise[] {
  return ranked.filter((r) => r.exercise.id !== currentId).slice(0, limit)
}
