import type { ExperienceLevel, Muscle } from '@/db/types'
import { ENGINE_CONFIG } from './engineConfig'
import { MUSCLES } from '@/db/types'

export type FatigueMap = Record<Muscle, number>

export function emptyFatigue(value = 0): FatigueMap {
  return Object.fromEntries(MUSCLES.map((m) => [m, value])) as FatigueMap
}

export function halfLifeHours(muscle: Muscle, experience: ExperienceLevel): number {
  const { recovery } = ENGINE_CONFIG
  const base = recovery.largeMuscles.includes(muscle)
    ? recovery.largeHalfLifeHours
    : recovery.smallHalfLifeHours
  return base * recovery.experienceHalfLifeMultiplier[experience]
}

/**
 * Exponential decay: fatigue' = fatigue * 0.5^(elapsedHours / halfLife)
 */
export function decayFatigue(
  fatigue: number,
  elapsedHours: number,
  muscle: Muscle,
  experience: ExperienceLevel
): number {
  if (fatigue <= 0) return 0
  if (elapsedHours <= 0) return Math.min(100, fatigue)
  const hl = halfLifeHours(muscle, experience)
  const next = fatigue * Math.pow(0.5, elapsedHours / hl)
  return Math.max(0, Math.min(100, next))
}

export function decayAll(
  map: FatigueMap,
  elapsedHours: number,
  experience: ExperienceLevel
): FatigueMap {
  const next = emptyFatigue()
  for (const m of MUSCLES) {
    next[m] = decayFatigue(map[m] ?? 0, elapsedHours, m, experience)
  }
  return next
}

export function recoveryPct(fatigue: number): number {
  return Math.max(0, Math.min(100, 100 - fatigue))
}

export function setStimulus(rpe: number | null): number {
  return ENGINE_CONFIG.stimulus.basePerSet * ENGINE_CONFIG.stimulus.rpeFactor(rpe)
}

export function applySetFatigue(
  map: FatigueMap,
  primary: Muscle[],
  secondary: Muscle[],
  rpe: number | null
): FatigueMap {
  const next = { ...map }
  const stim = setStimulus(rpe)
  for (const m of primary) {
    next[m] = Math.min(100, (next[m] ?? 0) + stim * ENGINE_CONFIG.stimulus.primaryInvolvement)
  }
  for (const m of secondary) {
    if (primary.includes(m)) continue
    next[m] = Math.min(100, (next[m] ?? 0) + stim * ENGINE_CONFIG.stimulus.secondaryInvolvement)
  }
  return next
}

/**
 * Recompute fatigue from chronological completed sets.
 * Each set entry includes hoursSincePrevious (0 for first).
 */
export function recomputeFatigueFromSets(
  sets: Array<{
    hoursSincePrevious: number
    primary: Muscle[]
    secondary: Muscle[]
    rpe: number | null
  }>,
  experience: ExperienceLevel,
  hoursSinceLastSet = 0
): FatigueMap {
  let map = emptyFatigue()
  for (const set of sets) {
    map = decayAll(map, set.hoursSincePrevious, experience)
    map = applySetFatigue(map, set.primary, set.secondary, set.rpe)
  }
  if (hoursSinceLastSet > 0) {
    map = decayAll(map, hoursSinceLastSet, experience)
  }
  return map
}
