import { describe, expect, it } from 'vitest'
import type { Exercise } from '@/db/types'
import { emptyFatigue } from './fatigue'
import { generateWorkout } from './generate'

function makeEx(
  id: string,
  muscles: Exercise['primaryMuscles'],
  equipment: Exercise['equipment'] = ['barbell'],
  mechanic: Exercise['mechanic'] = 'compound'
): Exercise {
  return {
    id,
    name: id,
    primaryMuscles: muscles,
    secondaryMuscles: [],
    equipment,
    mechanic,
    force: 'push',
    level: 'intermediate',
    category: 'strength',
    instructions: [],
    images: [],
    isCustom: false
  }
}

describe('generateWorkout', () => {
  it('returns a timed workout with primary muscles and reasoning', () => {
    const exercises = [
      makeEx('bench', ['chest']),
      makeEx('ohp', ['front_delts']),
      makeEx('tri', ['triceps'], ['dumbbell'], 'isolation'),
      makeEx('squat', ['quads']),
      makeEx('row', ['upper_back', 'lats'])
    ]

    const workout = generateWorkout({
      exercises,
      goal: 'hypertrophy',
      experience: 'intermediate',
      splitPref: 'push_pull_legs',
      daysPerWeek: 6,
      sessionMinutes: 60,
      dayIndex: 0,
      fatigue: emptyFatigue(),
      weeklyVolume: {},
      availableEquipment: ['barbell', 'dumbbell', 'bodyweight'],
      favorites: new Set(),
      banned: new Set(),
      recentlyUsed: new Set(),
      anchors: new Set(['bench']),
      liftHistory: {},
      equipmentOpts: {
        barWeight: 20,
        plates: [20, 10, 5, 2.5],
        dumbbellIncrement: 2.5,
        cableStep: 5
      }
    })

    expect(workout.split).toBe('push_pull_legs')
    expect(workout.primaryMuscles.length).toBeGreaterThan(0)
    expect(workout.exercises.length).toBeGreaterThan(0)
    expect(workout.estimatedMinutes).toBeGreaterThan(0)
    expect(workout.exercises[0].reasoning.length).toBeGreaterThan(0)
    expect(workout.whyMuscles.length).toBe(workout.primaryMuscles.length)
  })

  it('respects banned exercises and equipment', () => {
    const exercises = [makeEx('bench', ['chest']), makeEx('machine_chest', ['chest'], ['machine'])]
    const workout = generateWorkout({
      exercises,
      goal: 'hypertrophy',
      experience: 'intermediate',
      splitPref: 'push_pull_legs',
      daysPerWeek: 6,
      sessionMinutes: 45,
      dayIndex: 0,
      fatigue: emptyFatigue(),
      weeklyVolume: {},
      availableEquipment: ['barbell', 'bodyweight'],
      favorites: new Set(),
      banned: new Set(['bench']),
      recentlyUsed: new Set(),
      anchors: new Set(),
      liftHistory: {},
      equipmentOpts: {
        barWeight: 20,
        plates: [20, 10, 5, 2.5],
        dumbbellIncrement: 2.5,
        cableStep: 5
      }
    })
    expect(workout.exercises.every((e) => e.exercise.id !== 'bench')).toBe(true)
    expect(workout.exercises.every((e) => e.exercise.id !== 'machine_chest')).toBe(true)
  })
})
