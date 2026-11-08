import { describe, expect, it } from 'vitest'
import {
  applySetFatigue,
  decayFatigue,
  emptyFatigue,
  halfLifeHours,
  recomputeFatigueFromSets,
  recoveryPct
} from './fatigue'

describe('fatigue decay', () => {
  it('decays toward zero over multiple half-lives', () => {
    const hl = halfLifeHours('chest', 'intermediate')
    const afterOne = decayFatigue(80, hl, 'chest', 'intermediate')
    expect(afterOne).toBeCloseTo(40, 5)
    const afterTwo = decayFatigue(80, hl * 2, 'chest', 'intermediate')
    expect(afterTwo).toBeCloseTo(20, 5)
  })

  it('uses shorter half-life for small muscles', () => {
    expect(halfLifeHours('biceps', 'intermediate')).toBeLessThan(
      halfLifeHours('quads', 'intermediate')
    )
  })

  it('beginners recover slower (longer half-life)', () => {
    expect(halfLifeHours('chest', 'beginner')).toBeGreaterThan(halfLifeHours('chest', 'advanced'))
  })

  it('recoveryPct is 100 - fatigue', () => {
    expect(recoveryPct(25)).toBe(75)
    expect(recoveryPct(0)).toBe(100)
    expect(recoveryPct(100)).toBe(0)
  })
})

describe('set stimulus', () => {
  it('applies more fatigue for hard RPE on primary vs secondary', () => {
    let map = emptyFatigue()
    map = applySetFatigue(map, ['chest'], ['triceps'], 9)
    expect(map.chest).toBeGreaterThan(map.triceps)
    expect(map.chest).toBeGreaterThan(0)
  })

  it('hard sets add more fatigue than easy sets', () => {
    const hard = applySetFatigue(emptyFatigue(), ['quads'], [], 10)
    const easy = applySetFatigue(emptyFatigue(), ['quads'], [], 6)
    expect(hard.quads).toBeGreaterThan(easy.quads)
  })
})

describe('recomputeFatigueFromSets', () => {
  it('decays between sets then accumulates', () => {
    const map = recomputeFatigueFromSets(
      [
        { hoursSincePrevious: 0, primary: ['chest'], secondary: [], rpe: 8 },
        { hoursSincePrevious: 48, primary: ['chest'], secondary: [], rpe: 8 }
      ],
      'intermediate',
      0
    )
    // After 48h decay, second set adds again — should be less than two immediate sets
    const immediate = recomputeFatigueFromSets(
      [
        { hoursSincePrevious: 0, primary: ['chest'], secondary: [], rpe: 8 },
        { hoursSincePrevious: 0, primary: ['chest'], secondary: [], rpe: 8 }
      ],
      'intermediate',
      0
    )
    expect(map.chest).toBeLessThan(immediate.chest)
  })
})
