import type { ExperienceLevel, Goal, Muscle, SplitPref } from '@/db/types'
import { ENGINE_CONFIG } from './engineConfig'
import { recoveryPct, type FatigueMap } from './fatigue'

export type WeeklyVolume = Partial<Record<Muscle, number>>

const SPLIT_TEMPLATES: Record<Exclude<SplitPref, 'auto'>, Muscle[][]> = {
  full_body: [
    ['chest', 'quads', 'upper_back', 'glutes', 'front_delts', 'hamstrings', 'abs'],
    ['lats', 'quads', 'chest', 'hamstrings', 'side_delts', 'glutes', 'biceps', 'triceps'],
    ['chest', 'upper_back', 'quads', 'rear_delts', 'glutes', 'abs', 'calves']
  ],
  upper_lower: [
    ['chest', 'upper_back', 'lats', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps'],
    ['quads', 'hamstrings', 'glutes', 'calves', 'abs', 'adductors'],
    ['chest', 'lats', 'upper_back', 'front_delts', 'triceps', 'biceps'],
    ['quads', 'hamstrings', 'glutes', 'calves', 'lower_back', 'abs']
  ],
  push_pull_legs: [
    ['chest', 'front_delts', 'side_delts', 'triceps'],
    ['lats', 'upper_back', 'rear_delts', 'biceps', 'traps'],
    ['quads', 'hamstrings', 'glutes', 'calves', 'abs']
  ],
  bro_split: [
    ['chest', 'front_delts', 'triceps'],
    ['lats', 'upper_back', 'biceps', 'rear_delts'],
    ['quads', 'glutes', 'adductors'],
    ['front_delts', 'side_delts', 'rear_delts', 'traps'],
    ['hamstrings', 'glutes', 'calves', 'lower_back'],
    ['abs', 'obliques', 'forearms']
  ]
}

export function resolveSplit(
  pref: SplitPref,
  daysPerWeek: number,
  experience: ExperienceLevel
): Exclude<SplitPref, 'auto'> {
  if (pref !== 'auto') return pref
  if (daysPerWeek <= 3) return 'full_body'
  if (daysPerWeek === 4) return experience === 'beginner' ? 'upper_lower' : 'upper_lower'
  if (daysPerWeek >= 6) return 'push_pull_legs'
  return 'push_pull_legs'
}

export function dayMusclesForSplit(split: Exclude<SplitPref, 'auto'>, dayIndex: number): Muscle[] {
  const days = SPLIT_TEMPLATES[split]
  return days[dayIndex % days.length]
}

export type MusclePick = {
  muscle: Muscle
  recovery: number
  weeklySets: number
  weeklyTarget: number
  score: number
  eligiblePrimary: boolean
}

/**
 * Prefer muscles that are most recovered and have the most weekly volume left.
 * Never mark as primary-eligible if recovery < 50%.
 */
export function rankMusclesForSession(input: {
  candidates: Muscle[]
  fatigue: FatigueMap
  weeklyVolume: WeeklyVolume
  goal: Goal
}): MusclePick[] {
  const target = ENGINE_CONFIG.volume.weeklySetTargets[input.goal].target
  const minRec = ENGINE_CONFIG.recovery.minPrimaryRecoveryPct

  return input.candidates
    .map((muscle) => {
      const recovery = recoveryPct(input.fatigue[muscle] ?? 0)
      const weeklySets = input.weeklyVolume[muscle] ?? 0
      const volumeLeft = Math.max(0, target - weeklySets)
      const score = recovery * 0.6 + (volumeLeft / target) * 100 * 0.4
      return {
        muscle,
        recovery,
        weeklySets,
        weeklyTarget: target,
        score,
        eligiblePrimary: recovery >= minRec
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function selectPrimaryMuscles(
  ranked: MusclePick[],
  maxPrimary = 3
): { selected: Muscle[]; warnings: string[] } {
  const eligible = ranked.filter((r) => r.eligiblePrimary)
  const warnings: string[] = []
  if (eligible.length === 0) {
    warnings.push('All split muscles are under 50% recovered. Consider rest or a lighter session.')
    return { selected: ranked.slice(0, 1).map((r) => r.muscle), warnings }
  }
  return { selected: eligible.slice(0, maxPrimary).map((r) => r.muscle), warnings }
}
