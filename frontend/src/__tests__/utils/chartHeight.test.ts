import { describe, it, expect } from 'vitest'
import { defaultChartHeights } from '@/hooks/useChartHeight'

describe('defaultChartHeights', () => {
  it('candle height is 12% larger than 400', () => {
    expect(defaultChartHeights.candle).toBe(Math.round(400 * 1.12))
  })

  it('volume height is 12% larger than 120', () => {
    expect(defaultChartHeights.volume).toBe(Math.round(120 * 1.12))
  })

  it('candle is always larger than volume', () => {
    expect(defaultChartHeights.candle).toBeGreaterThan(defaultChartHeights.volume)
  })
})
