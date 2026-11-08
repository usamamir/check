import { db } from '@/db'
import { epley1rm } from '@/lib/oneRm'
import type { PersonalRecord, PrType } from '@/db/types'

export type DetectedPr = {
  type: PrType
  value: number
  label: string
}

export async function detectPrs(input: {
  exerciseId: string
  weight: number
  reps: number
}): Promise<DetectedPr[]> {
  const { exerciseId, weight, reps } = input
  if (weight <= 0 || reps <= 0) return []

  const existing = await db.personalRecords.where('exerciseId').equals(exerciseId).toArray()
  const best = (type: PrType): number =>
    existing.filter((p) => p.type === type).reduce((m, p) => Math.max(m, p.value), 0)

  const found: DetectedPr[] = []
  const est = epley1rm(weight, reps)
  const volume = weight * reps

  if (weight > best('weight')) {
    found.push({ type: 'weight', value: weight, label: 'Weight PR' })
  }
  // Rep PR at this weight: store as reps with value = reps, only if weight matches prior best weight context — simplified: any higher reps*weight proxy
  if (reps > best('reps') && weight >= best('weight') * 0.9) {
    found.push({ type: 'reps', value: reps, label: `Rep PR @ ${weight}` })
  }
  if (est > best('estimated_1rm')) {
    found.push({ type: 'estimated_1rm', value: est, label: 'Est. 1RM PR' })
  }
  if (volume > best('volume')) {
    found.push({ type: 'volume', value: volume, label: 'Set volume PR' })
  }

  return found
}

export async function savePrs(
  exerciseId: string,
  setId: string,
  prs: DetectedPr[]
): Promise<PersonalRecord[]> {
  const now = new Date().toISOString()
  const rows: PersonalRecord[] = prs.map((pr) => ({
    id: crypto.randomUUID(),
    exerciseId,
    type: pr.type,
    value: pr.value,
    setId,
    achievedAt: now
  }))
  if (rows.length) await db.personalRecords.bulkPut(rows)
  return rows
}
