import type { Equipment, Goal } from '@/db/types'
import { ENGINE_CONFIG } from './engineConfig'
import { epley1rm, smoothed1rm } from '@/lib/oneRm'
import { roundToIncrement, roundToPlateLoad } from '@/lib/plates'

export { epley1rm, smoothed1rm }

export type LiftHistory = {
  /** Recent completed working sets, newest last */
  recentSets: Array<{ weight: number; reps: number; rpe: number | null }>
  /** Consecutive sessions that missed the bottom of the rep range */
  failedSessions: number
}

export type Prescription = {
  weight: number
  targetReps: number
  sets: number
  reasoning: string
  deloaded: boolean
}

export function repRange(
  goal: Goal,
  mechanic: 'compound' | 'isolation' | null
): { min: number; max: number } {
  const cfg = ENGINE_CONFIG.reps[goal]
  if (mechanic === 'isolation') return { min: cfg.isolationMin, max: cfg.isolationMax }
  return { min: cfg.min, max: cfg.max }
}

export function roundWeightForEquipment(
  target: number,
  equipment: Equipment[],
  opts: {
    barWeight: number
    plates: number[]
    dumbbellIncrement: number
    cableStep: number
  }
): number {
  const eq = equipment[0] ?? 'other'
  if (eq === 'barbell' || eq === 'ez_bar' || eq === 'smith_machine') {
    return roundToPlateLoad(target, opts.barWeight, opts.plates)
  }
  if (eq === 'dumbbell' || eq === 'kettlebell') {
    return roundToIncrement(target, opts.dumbbellIncrement)
  }
  if (eq === 'cable' || eq === 'machine' || eq === 'leg_press') {
    return roundToIncrement(target, opts.cableStep)
  }
  return Math.round(target)
}

/**
 * Double progression:
 * - Hit top of rep range on all sets at target RPE → increase weight
 * - Miss bottom of range → hold or reduce; 2 failed sessions → ~10% deload
 */
export function prescribeLoad(input: {
  goal: Goal
  mechanic: 'compound' | 'isolation' | null
  equipment: Equipment[]
  history: LiftHistory
  equipmentOpts: {
    barWeight: number
    plates: number[]
    dumbbellIncrement: number
    cableStep: number
  }
  workingSets?: number
}): Prescription {
  const range = repRange(input.goal, input.mechanic)
  const sets = input.workingSets ?? ENGINE_CONFIG.timing.defaultWorkingSets
  const pct = ENGINE_CONFIG.intensityPct1rm[input.goal]
  const est = smoothed1rm(input.history.recentSets)

  let deloaded = false
  let targetWeight: number
  let reasoning: string
  let targetReps: number

  if (input.history.failedSessions >= ENGINE_CONFIG.progression.failedSessionsForDeload) {
    const last = input.history.recentSets[input.history.recentSets.length - 1]
    const base = last?.weight ?? (est ? est * pct : 40)
    targetWeight = base * ENGINE_CONFIG.progression.deloadFraction
    deloaded = true
    reasoning = `Automatic ~10% deload after ${input.history.failedSessions} failed sessions.`
    targetReps = range.min
  } else if (est) {
    // Check last session performance for double progression
    const lastSession = input.history.recentSets.slice(-sets)
    const hitTop =
      lastSession.length >= sets &&
      lastSession.every((s) => s.reps >= range.max) &&
      lastSession.every((s) =>
        s.rpe == null ? true : s.rpe <= ENGINE_CONFIG.progression.targetRpe + 0.5
      )

    const missedBottom = lastSession.length > 0 && lastSession.some((s) => s.reps < range.min)

    let raw = est * pct
    if (hitTop) {
      raw =
        Math.max(...lastSession.map((s) => s.weight)) +
        smallestIncrement(input.equipment, input.equipmentOpts)
      reasoning = `Weight increased — hit ${sets}×${range.max} at target effort last time. Est 1RM ${est.toFixed(1)}.`
      targetReps = range.min
    } else if (missedBottom) {
      raw = Math.max(...lastSession.map((s) => s.weight))
      reasoning = `Holding weight — missed the bottom of the ${range.min}–${range.max} rep range.`
      targetReps = range.min
    } else {
      reasoning = `Target ~${Math.round(pct * 100)}% of estimated 1RM (${est.toFixed(1)}).`
      targetReps = range.min
    }
    targetWeight = raw
  } else {
    // Conservative start
    targetWeight = input.goal === 'strength' ? 40 : 20
    reasoning = 'No history yet — starting conservatively; will calibrate over 2–3 sessions.'
    targetReps = range.min
  }

  const weight = roundWeightForEquipment(targetWeight, input.equipment, input.equipmentOpts)

  return { weight, targetReps, sets, reasoning, deloaded }
}

function smallestIncrement(
  equipment: Equipment[],
  opts: {
    barWeight: number
    plates: number[]
    dumbbellIncrement: number
    cableStep: number
  }
): number {
  const eq = equipment[0] ?? 'other'
  if (eq === 'barbell' || eq === 'ez_bar' || eq === 'smith_machine') {
    const minPlate = Math.min(...opts.plates.filter((p) => p > 0), 1.25)
    return minPlate * 2
  }
  if (eq === 'dumbbell' || eq === 'kettlebell') return opts.dumbbellIncrement
  if (eq === 'cable' || eq === 'machine') return opts.cableStep
  return 2.5
}

export function sessionMissedRepFloor(sets: Array<{ reps: number }>, minReps: number): boolean {
  return sets.some((s) => s.reps < minReps)
}

export function sessionHitRepCeiling(
  sets: Array<{ reps: number; rpe: number | null }>,
  maxReps: number,
  targetRpe = ENGINE_CONFIG.progression.targetRpe
): boolean {
  return (
    sets.length > 0 &&
    sets.every((s) => s.reps >= maxReps) &&
    sets.every((s) => (s.rpe == null ? true : s.rpe <= targetRpe + 0.5))
  )
}
