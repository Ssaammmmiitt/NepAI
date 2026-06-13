import { describe, it, expect } from 'vitest'
import {
  formatPercent,
  formatNumber,
  daysSince,
  predictionLabel,
} from '@/utils/formatters'

describe('formatPercent', () => {
  it('prefixes positive values with +', () => {
    expect(formatPercent(3.14)).toBe('+3.14%')
  })

  it('does not prefix negative values', () => {
    expect(formatPercent(-2.5)).toBe('-2.50%')
  })

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0.00%')
  })

  it('respects custom decimals', () => {
    expect(formatPercent(1.2345, 3)).toBe('+1.234%')
  })
})

describe('formatNumber', () => {
  it('formats with 2 decimal places by default', () => {
    const result = formatNumber(1234.5)
    expect(result).toContain('1')
    expect(result).toContain('234.50')
  })

  it('respects custom decimals', () => {
    const result = formatNumber(10, 0)
    expect(result).toBe('10')
  })

  it('returns em dash for null or undefined', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
  })
})

describe('daysSince', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString()
    expect(daysSince(today)).toBe(0)
  })

  it('returns correct days for past date', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(daysSince(threeDaysAgo)).toBe(3)
  })
})

describe('predictionLabel', () => {
  it('returns Tomorrow for day 1', () => {
    expect(predictionLabel(1)).toBe('Tomorrow')
  })

  it('returns 1-Week for day 5', () => {
    expect(predictionLabel(5)).toBe('1-Week')
  })

  it('returns Day N for other values', () => {
    expect(predictionLabel(2)).toBe('Day 2')
    expect(predictionLabel(3)).toBe('Day 3')
  })
})
