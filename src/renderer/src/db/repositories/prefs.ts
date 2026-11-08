import { db } from '@/db/schema'
import type { ExercisePref } from '@/db/types'

const emptyPref = (exerciseId: string): ExercisePref => ({
  exerciseId,
  favorite: false,
  banned: false,
  customVideoId: null,
  notes: ''
})

export async function getExercisePref(exerciseId: string): Promise<ExercisePref> {
  return (await db.exercisePrefs.get(exerciseId)) ?? emptyPref(exerciseId)
}

export async function updateExercisePref(
  exerciseId: string,
  patch: Partial<Omit<ExercisePref, 'exerciseId'>>
): Promise<ExercisePref> {
  const current = await getExercisePref(exerciseId)
  const next = { ...current, ...patch, exerciseId }
  await db.exercisePrefs.put(next)
  return next
}

export async function listFavoriteIds(): Promise<Set<string>> {
  const rows = await db.exercisePrefs.filter((p) => p.favorite).toArray()
  return new Set(rows.map((r) => r.exerciseId))
}

export async function listBannedIds(): Promise<Set<string>> {
  const rows = await db.exercisePrefs.filter((p) => p.banned).toArray()
  return new Set(rows.map((r) => r.exerciseId))
}
