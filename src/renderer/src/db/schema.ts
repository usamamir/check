import Dexie, { type EntityTable, type Table } from 'dexie'
import type {
  AppSettings,
  BodyMetrics,
  Exercise,
  ExercisePref,
  FatigueSnapshot,
  GymProfile,
  PersonalRecord,
  Program,
  Template,
  UserProfile,
  Workout,
  WorkoutExercise,
  WorkoutSet
} from './types'

export class ForgeDatabase extends Dexie {
  userProfile!: EntityTable<UserProfile, 'id'>
  gymProfiles!: EntityTable<GymProfile, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  exercisePrefs!: EntityTable<ExercisePref, 'exerciseId'>
  workouts!: EntityTable<Workout, 'id'>
  workoutExercises!: EntityTable<WorkoutExercise, 'id'>
  sets!: EntityTable<WorkoutSet, 'id'>
  personalRecords!: EntityTable<PersonalRecord, 'id'>
  bodyMetrics!: EntityTable<BodyMetrics, 'id'>
  templates!: EntityTable<Template, 'id'>
  programs!: EntityTable<Program, 'id'>
  appSettings!: EntityTable<AppSettings, 'id'>
  fatigueSnapshot!: Table<FatigueSnapshot, number>

  constructor() {
    super('forge')

    this.version(1).stores({
      userProfile: 'id',
      gymProfiles: 'id, isActive, name',
      exercises:
        'id, name, level, mechanic, *primaryMuscles, *secondaryMuscles, *equipment, isCustom',
      exercisePrefs: 'exerciseId, favorite, banned',
      workouts: 'id, startedAt, endedAt, status, gymProfileId, source',
      workoutExercises: 'id, workoutId, exerciseId, order, [workoutId+order]',
      sets: 'id, workoutExerciseId, order, completedAt, [workoutExerciseId+order]',
      personalRecords: 'id, exerciseId, type, achievedAt, [exerciseId+type]',
      bodyMetrics: 'id, date',
      templates: 'id, name, createdAt',
      programs: 'id, name, builtin',
      appSettings: 'id',
      fatigueSnapshot: 'id, computedAt'
    })
  }
}

export const db = new ForgeDatabase()
