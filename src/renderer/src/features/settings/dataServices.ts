import { db } from '@/db'
import { subDays } from 'date-fns'

export async function exportAllJson(): Promise<string> {
  const payload = {
    exportedAt: new Date().toISOString(),
    userProfile: await db.userProfile.toArray(),
    gymProfiles: await db.gymProfiles.toArray(),
    exercisePrefs: await db.exercisePrefs.toArray(),
    workouts: await db.workouts.toArray(),
    workoutExercises: await db.workoutExercises.toArray(),
    sets: await db.sets.toArray(),
    personalRecords: await db.personalRecords.toArray(),
    bodyMetrics: await db.bodyMetrics.toArray(),
    templates: await db.templates.toArray(),
    programs: await db.programs.toArray(),
    appSettings: await db.appSettings.toArray(),
    customExercises: await db.exercises.filter((e) => e.isCustom).toArray()
  }
  return JSON.stringify(payload, null, 2)
}

export async function importAllJson(raw: string): Promise<void> {
  const data = JSON.parse(raw) as Record<string, unknown[]>
  await db.transaction('rw', db.tables, async () => {
    if (data.userProfile) await db.userProfile.bulkPut(data.userProfile as never[])
    if (data.gymProfiles) await db.gymProfiles.bulkPut(data.gymProfiles as never[])
    if (data.exercisePrefs) await db.exercisePrefs.bulkPut(data.exercisePrefs as never[])
    if (data.workouts) await db.workouts.bulkPut(data.workouts as never[])
    if (data.workoutExercises) await db.workoutExercises.bulkPut(data.workoutExercises as never[])
    if (data.sets) await db.sets.bulkPut(data.sets as never[])
    if (data.personalRecords) await db.personalRecords.bulkPut(data.personalRecords as never[])
    if (data.bodyMetrics) await db.bodyMetrics.bulkPut(data.bodyMetrics as never[])
    if (data.templates) await db.templates.bulkPut(data.templates as never[])
    if (data.programs) await db.programs.bulkPut(data.programs as never[])
    if (data.appSettings) await db.appSettings.bulkPut(data.appSettings as never[])
    if (data.customExercises) await db.exercises.bulkPut(data.customExercises as never[])
  })
}

export async function exportHistoryCsv(): Promise<string> {
  const workouts = await db.workouts.where('status').equals('completed').toArray()
  const lines = ['id,startedAt,endedAt,rating,source,notes']
  for (const w of workouts) {
    lines.push(
      [w.id, w.startedAt, w.endedAt ?? '', w.rating ?? '', w.source, JSON.stringify(w.notes)].join(
        ','
      )
    )
  }
  return lines.join('\n')
}

export async function resetAllData(): Promise<void> {
  await db.delete()
  await db.open()
}

/** Dev helper: 8 weeks of fake completed sessions for charts */
export async function seedDemoHistory(): Promise<void> {
  const exercises = await db.exercises.limit(20).toArray()
  if (exercises.length === 0) return
  const gym = await db.gymProfiles.filter((g) => g.isActive).first()
  if (!gym) return

  for (let week = 0; week < 8; week++) {
    for (let day = 0; day < 3; day++) {
      const ended = subDays(new Date(), week * 7 + day * 2)
      const id = crypto.randomUUID()
      await db.workouts.put({
        id,
        startedAt: new Date(ended.getTime() - 3600_000).toISOString(),
        endedAt: ended.toISOString(),
        status: 'completed',
        gymProfileId: gym.id,
        rating: 3 + (day % 3),
        notes: 'Seeded',
        source: 'adaptive',
        templateId: null,
        programId: null
      })
      const pick = exercises[(week * 3 + day) % exercises.length]
      const weId = crypto.randomUUID()
      await db.workoutExercises.put({
        id: weId,
        workoutId: id,
        exerciseId: pick.id,
        order: 0,
        supersetGroup: null,
        notes: '',
        reasoning: 'Seeded history',
        locked: false
      })
      for (let s = 0; s < 3; s++) {
        const weight = 40 + week * 2 + s
        const setId = crypto.randomUUID()
        await db.sets.put({
          id: setId,
          workoutExerciseId: weId,
          order: s,
          type: 'working',
          targetWeight: weight,
          targetReps: 8,
          weight,
          reps: 8 - (s % 2),
          rpe: 7 + (s % 3),
          completedAt: ended.toISOString()
        })
        if (s === 0) {
          await db.personalRecords.put({
            id: crypto.randomUUID(),
            exerciseId: pick.id,
            type: 'estimated_1rm',
            value: weight * (1 + 8 / 30),
            setId,
            achievedAt: ended.toISOString()
          })
        }
      }
    }
  }
}
