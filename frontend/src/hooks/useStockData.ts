import { useEffect, useState } from 'react'
import { stockAPI } from '@/services/api'
import type { OHLCRow, StockSummary } from '@/types'

export function useStockData(ticker: string, from?: string, to?: string) {
  const [ohlc, setOhlc] = useState<OHLCRow[]>([])
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [ohlcRes, summaryRes] = await Promise.all([
          stockAPI.getOHLC(ticker, from, to),
          stockAPI.getSummary(ticker),
        ])
        if (!cancelled) {
          setOhlc(ohlcRes.data)
          setSummary(summaryRes.data)
        }
      } catch {
        if (!cancelled) setError('Failed to load stock data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [ticker, from, to])

  return { ohlc, summary, loading, error }
}
