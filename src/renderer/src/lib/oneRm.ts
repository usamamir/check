/** Epley estimated 1RM: w × (1 + reps/30) */
export function epley1rm(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

/** Smooth recent best sets into a stable 1RM estimate */
export function smoothed1rm(
  sets: Array<{ weight: number; reps: number }>,
  take = 3
): number | null {
  if (sets.length === 0) return null
  const estimates = sets
    .filter((s) => s.weight > 0 && s.reps > 0)
    .map((s) => epley1rm(s.weight, s.reps))
    .sort((a, b) => b - a)
    .slice(0, take)
  if (estimates.length === 0) return null
  return estimates.reduce((a, b) => a + b, 0) / estimates.length
}
