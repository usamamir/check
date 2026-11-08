import { describe, expect, it } from 'vitest'
import type { Exercise } from '@/db/types'
import { filterByEquipment, rankExercises, scoreExercise } from './exercises'

const bench: Exercise = {
  id: 'bench',
  name: 'Bench Press',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps', 'front_delts'],
  equipment: ['barbell'],
  mechanic: 'compound',
  force: 'push',
  level: 'intermediate',
  category: 'strength',
  instructions: [],
  images: [],
  isCustom: false
}

const fly: Exercise = {
  id: 'fly',
  name: 'Dumbbell Fly',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: ['dumbbell'],
  mechanic: 'isolation',
  force: 'push',
  level: 'beginner',
  category: 'strength',
  instructions: [],
  images: [],
  isCustom: false
}

const squat: Exercise = {
  id: 'squat',
  name: 'Squat',
  primaryMuscles: ['quads'],
  secondaryMuscles: ['glutes'],
  equipment: ['barbell'],
  mechanic: 'compound',
  force: 'push',
  level: 'intermediate',
  category: 'strength',
  instructions: [],
  images: [],
  isCustom: false
}

describe('equipment filtering', () => {
  it('keeps only exercises usable with available equipment', () => {
    const filtered = filterByEquipment([bench, fly, squat], ['dumbbell', 'bodyweight'])
    expect(filtered.map((e) => e.id)).toEqual(['fly'])
  })

  it('allows bodyweight always when listed on exercise', () => {
    const pushup: Exercise = {
      ...fly,
      id: 'pushup',
      equipment: ['bodyweight']
    }
    expect(filterByEquipment([pushup], ['cable']).map((e) => e.id)).toEqual(['pushup'])
  })
})

describe('exercise scoring', () => {
  it('excludes banned exercises', () => {
    const result = scoreExercise(bench, {
      neededMuscles: ['chest'],
      availableEquipment: ['barbell'],
      experience: 'intermediate',
      favorites: new Set(),
      banned: new Set(['bench']),
      recentlyUsed: new Set(),
      anchors: new Set()
    })
    expect(result).toBeNull()
  })

  it('boosts favorites and penalizes recent use', () => {
    const base = scoreExercise(bench, {
      neededMuscles: ['chest'],
      availableEquipment: ['barbell'],
      experience: 'intermediate',
      favorites: new Set(),
      banned: new Set(),
      recentlyUsed: new Set(),
      anchors: new Set()
    })!
    const fav = scoreExercise(bench, {
      neededMuscles: ['chest'],
      availableEquipment: ['barbell'],
      experience: 'intermediate',
      favorites: new Set(['bench']),
      banned: new Set(),
      recentlyUsed: new Set(),
      anchors: new Set()
    })!
    const recent = scoreExercise(bench, {
      neededMuscles: ['chest'],
      availableEquipment: ['barbell'],
      experience: 'intermediate',
      favorites: new Set(),
      banned: new Set(),
      recentlyUsed: new Set(['bench']),
      anchors: new Set()
    })!
    expect(fav.score).toBeGreaterThan(base.score)
    expect(recent.score).toBeLessThan(base.score)
  })

  it('ranks compounds for needed muscles first', () => {
    const ranked = rankExercises([fly, bench], {
      neededMuscles: ['chest'],
      availableEquipment: ['barbell', 'dumbbell'],
      experience: 'intermediate',
      favorites: new Set(),
      banned: new Set(),
      recentlyUsed: new Set(),
      anchors: new Set()
    })
    expect(ranked[0].exercise.id).toBe('bench')
  })
})
