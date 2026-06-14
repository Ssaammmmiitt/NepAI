import type { OHLCRow } from '@/types'

export type ChartPeriod = '1M' | '3M' | '6M' | '1Y' | 'All'

const PERIOD_MONTHS: Record<Exclude<ChartPeriod, 'All'>, number> = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1Y': 12,
}

/** Latest trading date in an OHLC array. */
export function getLatestOhlcDate(rows: OHLCRow[]): string | null {
  if (rows.length === 0) return null
  return rows.reduce((latest, row) => (row.date > latest ? row.date : latest), rows[0].date)
}

/** Cutoff date for a period, anchored on the dataset's latest date (not today). */
export function periodCutoffFromAnchor(
  period: Exclude<ChartPeriod, 'All'>,
  anchorDate: string,
): string {
  const d = new Date(`${anchorDate}T12:00:00`)
  d.setMonth(d.getMonth() - PERIOD_MONTHS[period])
  return d.toISOString().split('T')[0]
}

/** Filter OHLC rows by period relative to the latest available data point. */
export function filterOhlcByPeriod(rows: OHLCRow[], period: ChartPeriod): OHLCRow[] {
  if (rows.length === 0) return []
  if (period === 'All') return rows

  const anchor = getLatestOhlcDate(rows)
  if (!anchor) return rows

  const cutoff = periodCutoffFromAnchor(period, anchor)
  const filtered = rows.filter((row) => row.date >= cutoff)

  return filtered.length > 0 ? filtered : rows.slice(-120)
}

/** Years-back cutoff from an anchor date (for history tab presets). */
export function yearsBackFromAnchor(anchorDate: string, years: number): string {
  const d = new Date(`${anchorDate}T12:00:00`)
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().split('T')[0]
}
