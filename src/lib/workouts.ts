import { exercises, type Exercise, type Equipment, type Muscle } from '../data/exercises'
import type { UserProfile } from './auth'

export type PlannedSet = {
  exerciseId: string
  sets: number
  reps: string
}

export type WorkoutPlan = {
  id: string
  title: string
  focus: string
  estimatedMinutes: number
  items: PlannedSet[]
  createdAt: string
}

export type LoggedSet = {
  reps: number
  weight: number
  done: boolean
}

export type WorkoutLog = {
  id: string
  planId: string
  title: string
  date: string
  entries: Record<string, LoggedSet[]>
  completed: boolean
}

const LOGS_KEY = 'repwise.logs'
const ACTIVE_KEY = 'repwise.active'

const splitByDay: Muscle[][] = [
  ['chest', 'shoulders', 'triceps'],
  ['back', 'biceps'],
  ['quads', 'hamstrings', 'glutes', 'calves'],
  ['shoulders', 'back', 'core'],
  ['chest', 'triceps', 'core'],
  ['hamstrings', 'glutes', 'back'],
  ['full-body', 'core'],
]

function dayIndex() {
  return new Date().getDay() % splitByDay.length
}

export function buildTodaysWorkout(user: UserProfile): WorkoutPlan {
  const focusMuscles = splitByDay[dayIndex()]
  const owned = new Set(user.equipment as Equipment[])
  const level = user.level ?? 'beginner'

  const pool = exercises.filter((ex) => {
    const equipOk = ex.equipment.some((e) => owned.has(e) || owned.has('bodyweight'))
    const muscleOk = ex.muscles.some((m) => focusMuscles.includes(m))
    const levelOk =
      level === 'advanced' ||
      (level === 'intermediate' && ex.level !== 'advanced') ||
      (level === 'beginner' && ex.level === 'beginner')
    return equipOk && muscleOk && (levelOk || ex.level === 'beginner')
  })

  const picked: Exercise[] = []
  for (const muscle of focusMuscles) {
    const candidate = pool.find(
      (ex) => ex.muscles.includes(muscle) && !picked.some((p) => p.id === ex.id),
    )
    if (candidate) picked.push(candidate)
    if (picked.length >= 6) break
  }

  // Fill remaining slots
  for (const ex of pool) {
    if (picked.length >= 6) break
    if (!picked.some((p) => p.id === ex.id)) picked.push(ex)
  }

  if (picked.length === 0) {
    picked.push(...exercises.filter((e) => e.equipment.includes('bodyweight')).slice(0, 5))
  }

  const titleMap: Record<string, string> = {
    strength: 'Strength Builder',
    hypertrophy: 'Muscle Focus',
    general: 'Balanced Session',
  }

  return {
    id: `w-${new Date().toISOString().slice(0, 10)}-${dayIndex()}`,
    title: `${titleMap[user.goal ?? 'general'] ?? 'Training'} · ${focusMuscles
      .slice(0, 2)
      .map((m) => m[0].toUpperCase() + m.slice(1))
      .join(' + ')}`,
    focus: focusMuscles.join(', '),
    estimatedMinutes: Math.min(75, 20 + picked.length * 8),
    items: picked.map((ex) => ({
      exerciseId: ex.id,
      sets: ex.defaultSets,
      reps: ex.defaultReps,
    })),
    createdAt: new Date().toISOString(),
  }
}

export function readLogs(): WorkoutLog[] {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]') as WorkoutLog[]
  } catch {
    return []
  }
}

export function saveLog(log: WorkoutLog) {
  const logs = readLogs().filter((l) => l.id !== log.id)
  logs.unshift(log)
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 60)))
}

export function getActiveWorkout(): WorkoutLog | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    return raw ? (JSON.parse(raw) as WorkoutLog) : null
  } catch {
    return null
  }
}

export function setActiveWorkout(log: WorkoutLog | null) {
  if (!log) localStorage.removeItem(ACTIVE_KEY)
  else localStorage.setItem(ACTIVE_KEY, JSON.stringify(log))
}

export function startWorkoutFromPlan(plan: WorkoutPlan): WorkoutLog {
  const entries: Record<string, LoggedSet[]> = {}
  for (const item of plan.items) {
    entries[item.exerciseId] = Array.from({ length: item.sets }, () => ({
      reps: parseInt(item.reps, 10) || 8,
      weight: 0,
      done: false,
    }))
  }
  const log: WorkoutLog = {
    id: crypto.randomUUID(),
    planId: plan.id,
    title: plan.title,
    date: new Date().toISOString(),
    entries,
    completed: false,
  }
  setActiveWorkout(log)
  return log
}
