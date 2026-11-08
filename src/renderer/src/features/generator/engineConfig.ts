import type { Goal, Muscle } from '@/db/types'

/** All engine knobs in one place (SPEC §4.2) */
export const ENGINE_CONFIG = {
  recovery: {
    /** Half-life hours by muscle size class */
    largeHalfLifeHours: 27,
    smallHalfLifeHours: 18,
    largeMuscles: [
      'chest',
      'upper_back',
      'lats',
      'lower_back',
      'quads',
      'hamstrings',
      'glutes'
    ] as Muscle[],
    /** Beginners recover slightly slower from the same volume */
    experienceHalfLifeMultiplier: {
      beginner: 1.15,
      intermediate: 1.0,
      advanced: 0.92
    } as const,
    /** Never program as primary if recovery below this */
    minPrimaryRecoveryPct: 50
  },
  stimulus: {
    basePerSet: 8,
    /** Multiplier from RPE (6–10) */
    rpeFactor: (rpe: number | null): number => {
      if (rpe == null) return 1
      if (rpe >= 9.5) return 1.35
      if (rpe >= 8.5) return 1.2
      if (rpe >= 7.5) return 1.05
      if (rpe >= 6.5) return 0.9
      return 0.75
    },
    primaryInvolvement: 1.0,
    secondaryInvolvement: 0.5
  },
  volume: {
    weeklySetTargets: {
      hypertrophy: { min: 10, max: 20, target: 14 },
      strength: { min: 6, max: 12, target: 9 },
      fat_loss: { min: 8, max: 16, target: 12 },
      general: { min: 8, max: 16, target: 12 },
      powerbuilding: { min: 8, max: 16, target: 12 }
    } as Record<Goal, { min: number; max: number; target: number }>
  },
  reps: {
    strength: { min: 3, max: 6, isolationMin: 5, isolationMax: 8 },
    hypertrophy: { min: 6, max: 12, isolationMin: 10, isolationMax: 15 },
    fat_loss: { min: 10, max: 15, isolationMin: 12, isolationMax: 20 },
    general: { min: 8, max: 15, isolationMin: 10, isolationMax: 15 },
    powerbuilding: { min: 3, max: 8, isolationMin: 8, isolationMax: 12 }
  } as Record<Goal, { min: number; max: number; isolationMin: number; isolationMax: number }>,
  /** %1RM for working sets at ~RIR 2 */
  intensityPct1rm: {
    strength: 0.85,
    hypertrophy: 0.72,
    fat_loss: 0.65,
    general: 0.7,
    powerbuilding: 0.8
  } as Record<Goal, number>,
  progression: {
    deloadFraction: 0.9,
    failedSessionsForDeload: 2,
    targetRpe: 8
  },
  timing: {
    secondsPerWorkingSet: 45,
    restSeconds: {
      compound: 150,
      isolation: 75
    },
    warmupAllowanceSeconds: 300,
    defaultWorkingSets: 3
  },
  selection: {
    recentSessionPenalty: 0.35,
    favoriteBoost: 1.25,
    bannedHardExclude: true,
    varietyLookbackSessions: 2
  }
} as const

export type EngineConfig = typeof ENGINE_CONFIG
