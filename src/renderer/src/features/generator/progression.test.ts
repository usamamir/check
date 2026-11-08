import { describe, expect, it } from 'vitest'
import {
  epley1rm,
  prescribeLoad,
  roundWeightForEquipment,
  sessionHitRepCeiling,
  sessionMissedRepFloor,
  smoothed1rm
} from './progression'
import { roundToPlateLoad, roundToIncrement } from '@/lib/plates'

describe('1RM estimate', () => {
  it('uses Epley formula', () => {
    expect(epley1rm(100, 10)).toBeCloseTo(100 * (1 + 10 / 30), 6)
    expect(epley1rm(100, 1)).toBe(100)
  })

  it('smooths over recent best sets', () => {
    const est = smoothed1rm([
      { weight: 100, reps: 5 },
      { weight: 60, reps: 10 },
      { weight: 105, reps: 3 }
    ])
    expect(est).toBeTruthy()
    expect(est!).toBeGreaterThan(100)
  })
})

describe('weight rounding', () => {
  it('rounds barbell loads to available plates', () => {
    const plates = [20, 10, 5, 2.5, 1.25]
    expect(roundToPlateLoad(97, 20, plates)).toBe(97.5)
    expect(roundToPlateLoad(102.5, 20, plates)).toBe(102.5)
    expect(roundToPlateLoad(97, 20, plates, 'down')).toBe(95)
  })

  it('rounds dumbbells to increment', () => {
    expect(roundToIncrement(23, 2.5)).toBe(22.5)
    expect(roundToIncrement(23, 2.5, 'up')).toBe(25)
  })

  it('roundWeightForEquipment picks barbell vs dumbbell path', () => {
    const opts = {
      barWeight: 20,
      plates: [20, 10, 5, 2.5],
      dumbbellIncrement: 2.5,
      cableStep: 5
    }
    expect(roundWeightForEquipment(62, ['dumbbell'], opts)).toBe(62.5)
    expect(roundWeightForEquipment(97, ['barbell'], opts) % 2.5).toBe(0)
  })
})

describe('double progression', () => {
  const opts = {
    barWeight: 20,
    plates: [25, 20, 15, 10, 5, 2.5, 1.25],
    dumbbellIncrement: 2.5,
    cableStep: 5
  }

  it('increases weight after hitting top of rep range', () => {
    const rx = prescribeLoad({
      goal: 'hypertrophy',
      mechanic: 'compound',
      equipment: ['barbell'],
      equipmentOpts: opts,
      workingSets: 3,
      history: {
        failedSessions: 0,
        recentSets: [
          // older sets for 1RM, then last session hit the top of the range
          { weight: 60, reps: 10, rpe: 8 },
          { weight: 60, reps: 10, rpe: 8 },
          { weight: 60, reps: 10, rpe: 8 },
          { weight: 60, reps: 12, rpe: 7 },
          { weight: 60, reps: 12, rpe: 7 },
          { weight: 60, reps: 12, rpe: 7 }
        ]
      }
    })
    expect(rx.weight).toBeGreaterThan(60)
    expect(rx.reasoning.toLowerCase()).toContain('increased')
  })

  it('holds when missing the bottom of the range', () => {
    const rx = prescribeLoad({
      goal: 'hypertrophy',
      mechanic: 'compound',
      equipment: ['barbell'],
      equipmentOpts: opts,
      workingSets: 3,
      history: {
        failedSessions: 1,
        recentSets: [
          { weight: 80, reps: 4, rpe: 9 },
          { weight: 80, reps: 3, rpe: 9 },
          { weight: 80, reps: 3, rpe: 10 }
        ]
      }
    })
    expect(rx.weight).toBeLessThanOrEqual(80)
    expect(rx.deloaded).toBe(false)
  })

  it('deloads ~10% after two failed sessions', () => {
    const rx = prescribeLoad({
      goal: 'strength',
      mechanic: 'compound',
      equipment: ['barbell'],
      equipmentOpts: opts,
      history: {
        failedSessions: 2,
        recentSets: [{ weight: 100, reps: 2, rpe: 10 }]
      }
    })
    expect(rx.deloaded).toBe(true)
    expect(rx.weight).toBeLessThanOrEqual(90)
    expect(rx.reasoning.toLowerCase()).toContain('deload')
  })

  it('helpers detect hit/miss', () => {
    expect(
      sessionHitRepCeiling(
        [
          { reps: 12, rpe: 7 },
          { reps: 12, rpe: 7 }
        ],
        12
      )
    ).toBe(true)
    expect(sessionMissedRepFloor([{ reps: 5 }, { reps: 8 }], 6)).toBe(true)
  })
})
