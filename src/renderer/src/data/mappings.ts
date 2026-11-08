import type { Equipment, Muscle } from '@/db/types'

/** Map free-exercise-db muscle names → FORGE Muscle enum */
export const MUSCLE_MAP: Record<string, Muscle> = {
  abdominals: 'abs',
  abs: 'abs',
  abductors: 'abductors',
  adductors: 'adductors',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'lower back': 'lower_back',
  lower_back: 'lower_back',
  'middle back': 'upper_back',
  middle_back: 'upper_back',
  neck: 'neck',
  obliques: 'obliques',
  quadriceps: 'quads',
  quads: 'quads',
  shoulders: 'front_delts',
  traps: 'traps',
  triceps: 'triceps',
  // free-exercise-db uses "shoulders" broadly; finer delts filled when name hints later
  'front delts': 'front_delts',
  'side delts': 'side_delts',
  'rear delts': 'rear_delts',
  'upper back': 'upper_back'
}

/** Map free-exercise-db equipment strings → FORGE Equipment enum */
export const EQUIPMENT_MAP: Record<string, Equipment> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  kettlebells: 'kettlebell',
  kettlebell: 'kettlebell',
  cable: 'cable',
  machine: 'machine',
  'body only': 'bodyweight',
  bodyweight: 'bodyweight',
  bands: 'resistance_band',
  'resistance band': 'resistance_band',
  'e-z curl bar': 'ez_bar',
  'ez barbell': 'ez_bar',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'other',
  foam_roll: 'other',
  'foam roll': 'other',
  other: 'other',
  none: 'bodyweight',
  smith: 'smith_machine',
  'smith machine': 'smith_machine'
}

export function mapMuscle(raw: string): Muscle | null {
  const key = raw.trim().toLowerCase()
  return MUSCLE_MAP[key] ?? null
}

export function mapEquipment(raw: string | null | undefined): Equipment {
  if (!raw) return 'bodyweight'
  const key = raw.trim().toLowerCase()
  return EQUIPMENT_MAP[key] ?? 'other'
}

/** Heuristic refinements for shoulder → specific delt heads from exercise name */
export function refineShoulderMuscles(
  muscles: Muscle[],
  name: string,
  role: 'primary' | 'secondary'
): Muscle[] {
  const lower = name.toLowerCase()
  const hasShoulders = muscles.includes('front_delts')
  if (!hasShoulders) return muscles

  let replacement: Muscle = 'front_delts'
  if (/lateral|side raise|side delt|lu raise/.test(lower)) replacement = 'side_delts'
  else if (/rear|reverse fly|face pull|bent.?over.?raise|rear delt/.test(lower))
    replacement = 'rear_delts'
  else if (/overhead|ohp|military|push press|front raise|arnold/.test(lower))
    replacement = 'front_delts'

  // Only refine when source mapped generic "shoulders" → front_delts
  if (role === 'primary' || replacement !== 'front_delts') {
    return muscles.map((m) => (m === 'front_delts' ? replacement : m))
  }
  return muscles
}
