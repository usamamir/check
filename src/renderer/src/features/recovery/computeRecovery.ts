import { db, profileRepo } from '@/db'
import {
  emptyFatigue,
  recomputeFatigueFromSets,
  recoveryPct,
  type FatigueMap
} from '@/features/generator'
import type { Muscle } from '@/db/types'
import { differenceInHours, parseISO } from 'date-fns'

export async function computeCurrentFatigue(): Promise<FatigueMap> {
  const profile = await profileRepo.getUserProfile()
  const completed = await db.workouts.where('status').equals('completed').sortBy('endedAt')

  type Event = {
    at: Date
    primary: Muscle[]
    secondary: Muscle[]
    rpe: number | null
  }
  const events: Event[] = []

  for (const w of completed) {
    const wes = await db.workoutExercises.where('workoutId').equals(w.id).toArray()
    for (const we of wes) {
      const ex = await db.exercises.get(we.exerciseId)
      if (!ex) continue
      const sets = await db.sets.where('workoutExerciseId').equals(we.id).toArray()
      for (const s of sets) {
        if (!s.completedAt) continue
        events.push({
          at: parseISO(s.completedAt),
          primary: ex.primaryMuscles,
          secondary: ex.secondaryMuscles,
          rpe: s.rpe
        })
      }
    }
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime())
  if (events.length === 0) return emptyFatigue()

  const engineSets = events.map((e, i) => ({
    hoursSincePrevious:
      i === 0 ? 0 : differenceInHours(e.at, events[i - 1].at, { roundingMethod: 'floor' }),
    primary: e.primary,
    secondary: e.secondary,
    rpe: e.rpe
  }))

  const hoursSinceLast = differenceInHours(new Date(), events[events.length - 1].at, {
    roundingMethod: 'floor'
  })

  return recomputeFatigueFromSets(engineSets, profile.experience, Math.max(0, hoursSinceLast))
}

export function fatigueToRecoveryMap(fatigue: FatigueMap): Record<Muscle, number> {
  const out = {} as Record<Muscle, number>
  for (const [m, f] of Object.entries(fatigue) as Array<[Muscle, number]>) {
    out[m] = recoveryPct(f)
  }
  return out
}
