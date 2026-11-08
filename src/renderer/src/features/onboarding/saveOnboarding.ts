import { profileRepo, db } from '@/db'
import { GYM_PRESETS } from '@/db/defaults'
import { epley1rm } from '@/lib/oneRm'
import type { OnboardingValues } from './onboardingSchema'

export { epley1rm }

const BASELINE_EXERCISE_IDS: Record<keyof OnboardingValues['baseline'], string> = {
  bench: 'Barbell_Bench_Press_-_Medium_Grip',
  squat: 'Barbell_Full_Squat',
  deadlift: 'Barbell_Deadlift',
  ohp: 'Standing_Military_Press'
}

export async function saveOnboarding(values: OnboardingValues): Promise<void> {
  const now = new Date()
  const birthYear = values.age ? now.getFullYear() - values.age : null

  await profileRepo.updateUserProfile({
    goal: values.goal,
    experience: values.experience,
    sex: values.sex,
    birthYear,
    bodyweight: values.bodyweight,
    height: values.height,
    units: values.units,
    daysPerWeek: values.daysPerWeek,
    sessionMinutes: values.sessionMinutes,
    splitPref: values.splitPref,
    onboardingComplete: true
  })

  const preset = GYM_PRESETS.find((p) => p.name === values.gymPreset) ?? GYM_PRESETS[0]
  const gyms = await profileRepo.listGymProfiles()
  const match = gyms.find((g) => g.name === preset.name)

  if (match) {
    await profileRepo.upsertGymProfile({
      ...match,
      ...preset,
      name: preset.name,
      dumbbellMax: values.dumbbellMax ?? preset.dumbbellMax,
      barWeight: values.units === 'imperial' ? 45 : 20,
      plates: values.units === 'imperial' ? [45, 35, 25, 10, 5, 2.5] : preset.plates,
      isActive: true
    })
    await profileRepo.setActiveGymProfile(match.id)
  }

  // Seed estimated 1RM PRs from optional baseline lifts
  for (const key of Object.keys(BASELINE_EXERCISE_IDS) as Array<
    keyof OnboardingValues['baseline']
  >) {
    const lift = values.baseline[key]
    if (!lift) continue
    const exerciseId = BASELINE_EXERCISE_IDS[key]
    const exists = await db.exercises.get(exerciseId)
    if (!exists) continue
    const value = epley1rm(lift.weight, lift.reps)
    await db.personalRecords.put({
      id: crypto.randomUUID(),
      exerciseId,
      type: 'estimated_1rm',
      value,
      setId: null,
      achievedAt: now.toISOString()
    })
  }
}
