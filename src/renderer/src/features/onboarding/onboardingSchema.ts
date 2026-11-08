import { z } from 'zod'
import { EXPERIENCE_LEVELS, GOALS, SEXES, SPLIT_PREFS } from '@/db/types'

export const onboardingSchema = z.object({
  goal: z.enum(GOALS),
  experience: z.enum(EXPERIENCE_LEVELS),
  sex: z.enum(SEXES),
  age: z.number().int().min(13).max(100).nullable(),
  bodyweight: z.number().positive().max(500).nullable(),
  height: z.number().positive().max(300).nullable(),
  units: z.enum(['metric', 'imperial']),
  daysPerWeek: z.number().int().min(2).max(6),
  sessionMinutes: z.union([
    z.literal(30),
    z.literal(45),
    z.literal(60),
    z.literal(75),
    z.literal(90)
  ]),
  splitPref: z.enum(SPLIT_PREFS),
  gymPreset: z.enum(['Commercial Gym', 'Home Gym', 'Bodyweight Only', 'Hotel Gym']),
  dumbbellMax: z.number().positive().nullable(),
  baseline: z.object({
    bench: z
      .object({ weight: z.number().positive(), reps: z.number().int().min(1).max(20) })
      .nullable(),
    squat: z
      .object({ weight: z.number().positive(), reps: z.number().int().min(1).max(20) })
      .nullable(),
    deadlift: z
      .object({ weight: z.number().positive(), reps: z.number().int().min(1).max(20) })
      .nullable(),
    ohp: z
      .object({ weight: z.number().positive(), reps: z.number().int().min(1).max(20) })
      .nullable()
  })
})

export type OnboardingValues = z.infer<typeof onboardingSchema>

export const ONBOARDING_STEPS = [
  { id: 'goal', title: 'Goal', description: 'What are you training for?' },
  { id: 'experience', title: 'Experience', description: 'How long have you been lifting?' },
  { id: 'body', title: 'Body stats', description: 'Optional — improves strength scoring.' },
  { id: 'schedule', title: 'Schedule', description: 'How often and how long?' },
  { id: 'split', title: 'Split', description: 'How should FORGE organize your week?' },
  { id: 'equipment', title: 'Equipment', description: 'What can you train with?' },
  { id: 'baseline', title: 'Baseline lifts', description: 'Optional — seeds your estimated 1RMs.' }
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id']

export const defaultOnboardingValues: OnboardingValues = {
  goal: 'hypertrophy',
  experience: 'intermediate',
  sex: 'unspecified',
  age: null,
  bodyweight: null,
  height: null,
  units: 'metric',
  daysPerWeek: 4,
  sessionMinutes: 60,
  splitPref: 'auto',
  gymPreset: 'Commercial Gym',
  dumbbellMax: 50,
  baseline: {
    bench: null,
    squat: null,
    deadlift: null,
    ohp: null
  }
}

export const GOAL_OPTIONS: Array<{
  value: OnboardingValues['goal']
  label: string
  blurb: string
}> = [
  {
    value: 'hypertrophy',
    label: 'Build Muscle',
    blurb: 'Hypertrophy-focused volume and pump work.'
  },
  { value: 'strength', label: 'Get Stronger', blurb: 'Heavy compounds, lower reps, longer rests.' },
  {
    value: 'fat_loss',
    label: 'Lose Fat & Tone',
    blurb: 'Density, higher reps, full-body emphasis.'
  },
  { value: 'general', label: 'General Fitness', blurb: 'Balanced strength and conditioning.' },
  {
    value: 'powerbuilding',
    label: 'Powerbuilding',
    blurb: 'Heavy top sets plus hypertrophy back-offs.'
  }
]

export const EXPERIENCE_OPTIONS: Array<{
  value: OnboardingValues['experience']
  label: string
  blurb: string
}> = [
  { value: 'beginner', label: 'Beginner', blurb: 'Less than 6 months of consistent training.' },
  { value: 'intermediate', label: 'Intermediate', blurb: '6 months to 3 years.' },
  { value: 'advanced', label: 'Advanced', blurb: '3+ years of progressive training.' }
]

export const SPLIT_OPTIONS: Array<{
  value: OnboardingValues['splitPref']
  label: string
  blurb: string
  recommended?: boolean
}> = [
  {
    value: 'auto',
    label: 'Let FORGE decide',
    blurb: 'Picks a split from your days/week and experience.',
    recommended: true
  },
  { value: 'full_body', label: 'Full Body', blurb: 'Hit everything each session.' },
  { value: 'upper_lower', label: 'Upper / Lower', blurb: 'Classic 4-day strength split.' },
  {
    value: 'push_pull_legs',
    label: 'Push / Pull / Legs',
    blurb: 'High-frequency bodybuilding staple.'
  },
  { value: 'bro_split', label: 'Bro Split', blurb: 'One major muscle group per day.' }
]
