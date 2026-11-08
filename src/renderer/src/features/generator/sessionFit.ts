import type { Exercise } from '@/db/types'
import { ENGINE_CONFIG } from './engineConfig'

export function estimateExerciseSeconds(exercise: Exercise, workingSets: number): number {
  const compound = exercise.mechanic === 'compound'
  const rest = compound
    ? ENGINE_CONFIG.timing.restSeconds.compound
    : ENGINE_CONFIG.timing.restSeconds.isolation
  return workingSets * (ENGINE_CONFIG.timing.secondsPerWorkingSet + rest)
}

/**
 * Fit exercises into sessionMinutes with warmup allowance.
 * Returns the prefix of orderedExercises that fits.
 */
export function fitToSessionLength(
  orderedExercises: Exercise[],
  sessionMinutes: number,
  setsPerExercise = ENGINE_CONFIG.timing.defaultWorkingSets
): { selected: Exercise[]; estimatedSeconds: number } {
  const budget = sessionMinutes * 60 - ENGINE_CONFIG.timing.warmupAllowanceSeconds
  const selected: Exercise[] = []
  let used = 0

  for (const ex of orderedExercises) {
    const cost = estimateExerciseSeconds(ex, setsPerExercise)
    if (selected.length > 0 && used + cost > budget) break
    selected.push(ex)
    used += cost
    // Always allow at least 1 exercise even if over budget
    if (selected.length === 1 && used > budget) break
  }

  return { selected, estimatedSeconds: used + ENGINE_CONFIG.timing.warmupAllowanceSeconds }
}

export function maxExercisesForMinutes(sessionMinutes: number): number {
  const budget = sessionMinutes * 60 - ENGINE_CONFIG.timing.warmupAllowanceSeconds
  const per =
    ENGINE_CONFIG.timing.defaultWorkingSets *
    (ENGINE_CONFIG.timing.secondsPerWorkingSet + ENGINE_CONFIG.timing.restSeconds.compound)
  return Math.max(1, Math.floor(budget / per))
}
