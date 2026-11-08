import { describe, expect, it } from 'vitest'
import type { Exercise } from '@/db/types'
import { fitToSessionLength, maxExercisesForMinutes } from './sessionFit'

function ex(id: string, mechanic: 'compound' | 'isolation' = 'compound'): Exercise {
  return {
    id,
    name: id,
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: ['barbell'],
    mechanic,
    force: 'push',
    level: 'intermediate',
    category: 'strength',
    instructions: [],
    images: [],
    isCustom: false
  }
}

describe('session-length fitting', () => {
  it('fits fewer exercises into a short session', () => {
    const many = Array.from({ length: 10 }, (_, i) => ex(`e${i}`))
    const short = fitToSessionLength(many, 30)
    const long = fitToSessionLength(many, 90)
    expect(short.selected.length).toBeLessThan(long.selected.length)
    expect(short.selected.length).toBeGreaterThanOrEqual(1)
  })

  it('always returns at least one exercise', () => {
    const result = fitToSessionLength([ex('only')], 10)
    expect(result.selected).toHaveLength(1)
  })

  it('maxExercisesForMinutes scales with duration', () => {
    expect(maxExercisesForMinutes(90)).toBeGreaterThan(maxExercisesForMinutes(30))
  })
})
