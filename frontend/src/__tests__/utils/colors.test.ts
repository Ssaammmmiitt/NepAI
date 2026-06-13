import { describe, it, expect } from 'vitest'
import { chartColors, getChartTheme } from '@/utils/colors'

describe('chartColors', () => {
  it('has correct bullish color', () => {
    expect(chartColors.bullish).toBe('#26A69A')
  })

  it('has correct bearish color', () => {
    expect(chartColors.bearish).toBe('#EF5350')
  })

  it('has correct prediction color', () => {
    expect(chartColors.prediction).toBe('#10B981')
  })

  it('volume colors are semi-transparent', () => {
    expect(chartColors.volumeUp).toContain('rgba')
    expect(chartColors.volumeDown).toContain('rgba')
  })
})

describe('getChartTheme', () => {
  it('returns dark background when isDark is true', () => {
    const theme = getChartTheme(true)
    expect(theme.layout.background.color).toBe('#0A0A0A')
    expect(theme.grid.vertLines.color).toBe('#262626')
  })

  it('returns light background when isDark is false', () => {
    const theme = getChartTheme(false)
    expect(theme.layout.background.color).toBe('#FAFAFA')
    expect(theme.grid.vertLines.color).toBe('#E0E0E0')
  })

  it('always uses bullish/bearish colors regardless of theme', () => {
    const dark = getChartTheme(true)
    const light = getChartTheme(false)
    expect(dark.upColor).toBe(chartColors.bullish)
    expect(dark.downColor).toBe(chartColors.bearish)
    expect(light.upColor).toBe(chartColors.bullish)
    expect(light.downColor).toBe(chartColors.bearish)
  })

  it('wick and border colors match candle colors', () => {
    const theme = getChartTheme(true)
    expect(theme.wickUpColor).toBe(theme.upColor)
    expect(theme.wickDownColor).toBe(theme.downColor)
    expect(theme.borderUpColor).toBe(theme.upColor)
    expect(theme.borderDownColor).toBe(theme.downColor)
  })
})
