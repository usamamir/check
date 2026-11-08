/** Fixed muscle enum from SPEC §5 */
export const MUSCLES = [
  'chest',
  'front_delts',
  'side_delts',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  'upper_back',
  'lats',
  'lower_back',
  'traps',
  'abs',
  'obliques',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'abductors',
  'calves',
  'neck'
] as const

export type Muscle = (typeof MUSCLES)[number]

export const EQUIPMENT = [
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
  'bodyweight',
  'medicine_ball',
  'other'
] as const

export type Equipment = (typeof EQUIPMENT)[number]

export const GOALS = ['hypertrophy', 'strength', 'fat_loss', 'general', 'powerbuilding'] as const

export type Goal = (typeof GOALS)[number]

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]

export const SPLIT_PREFS = [
  'auto',
  'full_body',
  'upper_lower',
  'push_pull_legs',
  'bro_split'
] as const
export type SplitPref = (typeof SPLIT_PREFS)[number]

export const SEXES = ['male', 'female', 'other', 'unspecified'] as const
export type Sex = (typeof SEXES)[number]

export type UnitSystem = 'metric' | 'imperial'

export type Mechanic = 'compound' | 'isolation' | null
export type Force = 'push' | 'pull' | 'static' | null
export type ExerciseLevel = 'beginner' | 'intermediate' | 'expert'

export type WorkoutStatus = 'planned' | 'active' | 'completed'
export type WorkoutSource = 'adaptive' | 'template' | 'program'
export type SetType = 'warmup' | 'working' | 'drop' | 'failure'
export type PrType = 'weight' | 'reps' | 'estimated_1rm' | 'volume'

export interface UserProfile {
  id: number
  goal: Goal
  experience: ExperienceLevel
  sex: Sex
  birthYear: number | null
  bodyweight: number | null
  height: number | null
  units: UnitSystem
  daysPerWeek: number
  sessionMinutes: number
  splitPref: SplitPref
  createdAt: string
  updatedAt: string
  onboardingComplete: boolean
}

export interface GymProfile {
  id: string
  name: string
  equipment: Equipment[]
  dumbbellMax: number | null
  dumbbellIncrement: number
  plates: number[]
  barWeight: number
  cableStep: number
  isActive: boolean
  createdAt: string
}

export interface Exercise {
  id: string
  name: string
  primaryMuscles: Muscle[]
  secondaryMuscles: Muscle[]
  equipment: Equipment[]
  mechanic: Mechanic
  force: Force
  level: ExerciseLevel
  category: string
  instructions: string[]
  images: string[]
  isCustom: boolean
}

export interface ExercisePref {
  exerciseId: string
  favorite: boolean
  banned: boolean
  customVideoId: string | null
  notes: string
}

export interface Workout {
  id: string
  startedAt: string
  endedAt: string | null
  status: WorkoutStatus
  gymProfileId: string
  rating: number | null
  notes: string
  source: WorkoutSource
  templateId: string | null
  programId: string | null
}

export interface WorkoutExercise {
  id: string
  workoutId: string
  exerciseId: string
  order: number
  supersetGroup: string | null
  notes: string
  reasoning: string
  locked: boolean
}

export interface WorkoutSet {
  id: string
  workoutExerciseId: string
  order: number
  type: SetType
  targetWeight: number | null
  targetReps: number | null
  weight: number | null
  reps: number | null
  rpe: number | null
  completedAt: string | null
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  type: PrType
  value: number
  setId: string | null
  achievedAt: string
}

export interface BodyMetrics {
  id: string
  date: string
  bodyweight: number | null
  measurements: Record<string, number>
}

export interface Template {
  id: string
  name: string
  description: string
  createdAt: string
  exercises: Array<{
    exerciseId: string
    order: number
    sets: number
    targetReps: number | null
    notes: string
  }>
}

export interface Program {
  id: string
  name: string
  description: string
  daysPerWeek: number
  level: ExperienceLevel
  split: SplitPref
  builtin: boolean
  weeks: unknown
}

export interface AppSettings {
  id: number
  theme: 'dark' | 'light'
  accent: string
  soundsEnabled: boolean
  notificationsEnabled: boolean
  warmupEnabled: boolean
  defaultRestSeconds: number
  autoBackupEnabled: boolean
  autoBackupPath: string | null
  trainingMode: 'adaptive' | 'program'
  activeProgramId: string | null
  locale: string
}

export interface FatigueSnapshot {
  id: number
  computedAt: string
  muscles: Record<Muscle, number>
}
