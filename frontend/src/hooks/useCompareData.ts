import { useState, useEffect } from 'react'
import { stockAPI } from '@/services/api'
import { COMPARE_COLORS } from '@/utils/colors'
import type { CompareEntry, OHLCRow } from '@/types'

function fromDate(period: string): string {
  if (period === 'All') return '2000-01-01'
  const dayMs = 24 * 60 * 60 * 1000
  const map: Record<string, number> = { '7D': 7, '30D': 30, '90D': 90, '1Y': 365 }
  const days = map[period] ?? 90
  return new Date(Date.now() - days * dayMs).toISOString().slice(0, 10)
}

function normalise(rows: OHLCRow[]) {
  if (rows.length === 0) return []
  const first = rows[0].close
  if (!first) return []
  return rows.map((r) => ({
    time: r.date,
    value: parseFloat(((r.close / first) * 100).toFixed(4)),
  }))
}

export function useCompareData(tickers: string[], period: string) {
  const [entries, setEntries] = useState<CompareEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tickerKey = tickers.join(',')

  useEffect(() => {
    if (tickers.length < 2) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const from = fromDate(period)
        const results = await Promise.all(
          tickers.map(async (ticker, idx) => {
            const [ohlcRes, summaryRes, indRes] = await Promise.allSettled([
              stockAPI.getOHLC(ticker, from),
              stockAPI.getSummary(ticker),
              stockAPI.getIndicators(ticker),
            ])
            const data = ohlcRes.status === 'fulfilled' ? ohlcRes.value.data : []
            return {
              ticker,
              color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
              data,
              normalised: normalise(data),
              summary: summaryRes.status === 'fulfilled' ? summaryRes.value.data : null,
              indicators: indRes.status === 'fulfilled' ? indRes.value.data : null,
            } satisfies CompareEntry
          }),
        )
        if (!cancelled) setEntries(results)
      } catch {
        if (!cancelled) setError('Failed to load comparison data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [tickerKey, period]) // eslint-disable-line react-hooks/exhaustive-deps

  return { entries, loading, error }
}
