import { db } from '@/db/schema'
import type { Equipment, Exercise, Muscle } from '@/db/types'
import bundledExercises from '@/data/exercises.json'

export async function seedBundledExercises(): Promise<number> {
  const count = await db.exercises.filter((e) => !e.isCustom).count()
  if (count > 0) return count

  const rows = bundledExercises as Exercise[]
  await db.exercises.bulkPut(rows)
  return rows.length
}

export async function listExercises(): Promise<Exercise[]> {
  return db.exercises.orderBy('name').toArray()
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id)
}

export async function searchExercises(query: string, limit = 50): Promise<Exercise[]> {
  const q = query.trim().toLowerCase()
  if (!q) return db.exercises.orderBy('name').limit(limit).toArray()
  return db.exercises
    .filter((e) => e.name.toLowerCase().includes(q))
    .limit(limit)
    .toArray()
}

export async function filterExercises(opts: {
  muscle?: Muscle
  equipment?: Equipment
  availableEquipment?: Equipment[]
  level?: Exercise['level']
  mechanic?: Exercise['mechanic']
  favoritesOnly?: boolean
  favoriteIds?: Set<string>
}): Promise<Exercise[]> {
  let rows = await db.exercises.toArray()

  if (opts.muscle) {
    rows = rows.filter(
      (e) => e.primaryMuscles.includes(opts.muscle!) || e.secondaryMuscles.includes(opts.muscle!)
    )
  }
  if (opts.equipment) {
    rows = rows.filter((e) => e.equipment.includes(opts.equipment!))
  }
  if (opts.availableEquipment && opts.availableEquipment.length > 0) {
    const avail = new Set(opts.availableEquipment)
    rows = rows.filter((e) => e.equipment.every((eq) => avail.has(eq) || eq === 'bodyweight'))
  }
  if (opts.level) {
    rows = rows.filter((e) => e.level === opts.level)
  }
  if (opts.mechanic) {
    rows = rows.filter((e) => e.mechanic === opts.mechanic)
  }
  if (opts.favoritesOnly && opts.favoriteIds) {
    rows = rows.filter((e) => opts.favoriteIds!.has(e.id))
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export async function upsertCustomExercise(
  exercise: Omit<Exercise, 'isCustom'> & { isCustom?: boolean }
): Promise<string> {
  const row: Exercise = { ...exercise, isCustom: true }
  await db.exercises.put(row)
  return row.id
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const existing = await db.exercises.get(id)
  if (existing?.isCustom) {
    await db.exercises.delete(id)
    await db.exercisePrefs.delete(id)
  }
}

export function exerciseImageUrl(relativePath: string): string {
  // Served from resources/exercise-images via Vite middleware / packaged copy
  const cleaned = relativePath.replace(/^\/+/, '')
  return `/exercise-images/${cleaned}`
}
