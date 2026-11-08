import type { Muscle } from '@/db/types'

const LABELS: Record<Muscle, string> = {
  chest: 'Chest',
  front_delts: 'Front delts',
  side_delts: 'Side delts',
  rear_delts: 'Rear delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  upper_back: 'Upper back',
  lats: 'Lats',
  lower_back: 'Lower back',
  traps: 'Traps',
  abs: 'Abs',
  obliques: 'Obliques',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  adductors: 'Adductors',
  abductors: 'Abductors',
  calves: 'Calves',
  neck: 'Neck'
}

export function muscleLabel(m: Muscle): string {
  return LABELS[m] ?? m
}
