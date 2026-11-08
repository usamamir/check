import type { Muscle } from '@/db/types'

/** FORGE muscle → react-body-highlighter slug(s) */
export const FORGE_TO_HIGHLIGHTER: Partial<Record<Muscle, string[]>> = {
  chest: ['chest'],
  front_delts: ['front-deltoids'],
  side_delts: ['front-deltoids'],
  rear_delts: ['back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  upper_back: ['upper-back'],
  lats: ['upper-back'],
  lower_back: ['lower-back'],
  traps: ['trapezius'],
  abs: ['abs'],
  obliques: ['obliques'],
  glutes: ['gluteal'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  adductors: ['adductors'],
  abductors: ['abductors'],
  calves: ['calves'],
  neck: ['neck']
}

export function recoveryToFrequency(recoveryPct: number): number {
  // Library colors by frequency; invert recovery so fatigued = higher intensity
  const fatigue = 100 - recoveryPct
  if (fatigue >= 70) return 4
  if (fatigue >= 45) return 3
  if (fatigue >= 25) return 2
  if (fatigue >= 10) return 1
  return 0
}

export const RECOVERY_COLORS = ['#3DD68C', '#F5A524', '#FF8A3D', '#FF5A5A', '#C62828']
