import { describe, expect, it } from 'vitest'
import { platesPerSide, roundToIncrement, roundToPlateLoad } from './plates'

describe('plates', () => {
  it('computes plates per side', () => {
    expect(platesPerSide(100, 20, [20, 10, 5, 2.5])).toEqual([20, 20])
    expect(platesPerSide(70, 20, [20, 10, 5, 2.5])).toEqual([20, 5])
  })
  it('rounds down/up/nearest', () => {
    expect(roundToIncrement(23, 2.5, 'down')).toBe(22.5)
    expect(roundToIncrement(23, 2.5, 'up')).toBe(25)
    expect(roundToPlateLoad(60, 20, [20, 10, 5], 'down')).toBe(60)
  })
})
