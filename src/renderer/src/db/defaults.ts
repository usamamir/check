import type { AppSettings, GymProfile, UserProfile } from './types'

export const DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25]
export const DEFAULT_PLATES_LB = [45, 35, 25, 10, 5, 2.5]

export const GYM_PRESETS: Omit<GymProfile, 'id' | 'createdAt' | 'isActive'>[] = [
  {
    name: 'Commercial Gym',
    equipment: [
      'barbell',
      'dumbbell',
      'kettlebell',
      'cable',
      'smith_machine',
      'leg_press',
      'pull_up_bar',
      'bench',
      'adjustable_bench',
      'ez_bar',
      'resistance_band',
      'machine',
      'bodyweight'
    ],
    dumbbellMax: 50,
    dumbbellIncrement: 2.5,
    plates: DEFAULT_PLATES_KG,
    barWeight: 20,
    cableStep: 5
  },
  {
    name: 'Home Gym',
    equipment: [
      'barbell',
      'dumbbell',
      'kettlebell',
      'pull_up_bar',
      'bench',
      'adjustable_bench',
      'resistance_band',
      'bodyweight'
    ],
    dumbbellMax: 40,
    dumbbellIncrement: 2.5,
    plates: DEFAULT_PLATES_KG,
    barWeight: 20,
    cableStep: 5
  },
  {
    name: 'Bodyweight Only',
    equipment: ['bodyweight', 'pull_up_bar', 'resistance_band'],
    dumbbellMax: null,
    dumbbellIncrement: 2.5,
    plates: [],
    barWeight: 20,
    cableStep: 5
  },
  {
    name: 'Hotel Gym',
    equipment: [
      'dumbbell',
      'cable',
      'pull_up_bar',
      'bench',
      'machine',
      'bodyweight',
      'resistance_band'
    ],
    dumbbellMax: 30,
    dumbbellIncrement: 2.5,
    plates: DEFAULT_PLATES_KG,
    barWeight: 20,
    cableStep: 5
  }
]

export function createDefaultUserProfile(now = new Date().toISOString()): UserProfile {
  return {
    id: 1,
    goal: 'hypertrophy',
    experience: 'intermediate',
    sex: 'unspecified',
    birthYear: null,
    bodyweight: null,
    height: null,
    units: 'metric',
    daysPerWeek: 4,
    sessionMinutes: 60,
    splitPref: 'auto',
    createdAt: now,
    updatedAt: now,
    onboardingComplete: false
  }
}

export function createDefaultSettings(): AppSettings {
  return {
    id: 1,
    theme: 'dark',
    accent: '#C6FF3D',
    soundsEnabled: true,
    notificationsEnabled: true,
    warmupEnabled: true,
    defaultRestSeconds: 90,
    autoBackupEnabled: false,
    autoBackupPath: null,
    trainingMode: 'adaptive',
    activeProgramId: null,
    locale: 'en'
  }
}

export function createGymFromPreset(
  presetName: string,
  isActive = false,
  now = new Date().toISOString()
): GymProfile {
  const preset = GYM_PRESETS.find((p) => p.name === presetName) ?? GYM_PRESETS[0]
  return {
    id: crypto.randomUUID(),
    ...preset,
    isActive,
    createdAt: now
  }
}
