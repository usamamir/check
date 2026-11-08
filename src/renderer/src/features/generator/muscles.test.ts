import { describe, expect, it } from 'vitest'
import { emptyFatigue } from './fatigue'
import { rankMusclesForSession, resolveSplit, selectPrimaryMuscles } from './muscles'
import { ENGINE_CONFIG } from './engineConfig'

describe('resolveSplit', () => {
  it('auto-picks full body for low frequency', () => {
    expect(resolveSplit('auto', 3, 'beginner')).toBe('full_body')
  })
  it('respects explicit preference', () => {
    expect(resolveSplit('push_pull_legs', 3, 'beginner')).toBe('push_pull_legs')
  })
})

describe('muscle selection respecting recovery', () => {
  it('marks muscles under 50% recovery as ineligible primary', () => {
    const fatigue = emptyFatigue()
    fatigue.chest = 60 // 40% recovered
    fatigue.front_delts = 10 // 90% recovered
    const ranked = rankMusclesForSession({
      candidates: ['chest', 'front_delts'],
      fatigue,
      weeklyVolume: {},
      goal: 'hypertrophy'
    })
    const chest = ranked.find((r) => r.muscle === 'chest')!
    const delts = ranked.find((r) => r.muscle === 'front_delts')!
    expect(chest.eligiblePrimary).toBe(false)
    expect(delts.eligiblePrimary).toBe(true)
    expect(chest.recovery).toBeLessThan(ENGINE_CONFIG.recovery.minPrimaryRecoveryPct)
  })

  it('prefers recovered muscles with weekly volume remaining', () => {
    const fatigue = emptyFatigue()
    const ranked = rankMusclesForSession({
      candidates: ['chest', 'lats'],
      fatigue,
      weeklyVolume: { chest: 12, lats: 2 },
      goal: 'hypertrophy'
    })
    expect(ranked[0].muscle).toBe('lats')
  })

  it('selectPrimaryMuscles skips ineligible when possible', () => {
    const fatigue = emptyFatigue()
    fatigue.chest = 70
    const ranked = rankMusclesForSession({
      candidates: ['chest', 'triceps'],
      fatigue,
      weeklyVolume: {},
      goal: 'strength'
    })
    const { selected, warnings } = selectPrimaryMuscles(ranked, 2)
    expect(selected).not.toContain('chest')
    expect(selected).toContain('triceps')
    expect(warnings.length).toBe(0)
  })
})
