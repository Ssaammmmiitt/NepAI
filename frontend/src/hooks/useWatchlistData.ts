import { useState, useEffect } from 'react'
import { stockAPI } from '@/services/api'
import type { OHLCRow } from '@/types'

function get30dFrom(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function useWatchlistData(ticker: string) {
  const [ohlc30d, setOhlc30d] = useState<OHLCRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ticker) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await stockAPI.getOHLC(ticker, get30dFrom())
        if (!cancelled) setOhlc30d(res.data)
      } catch {
        if (!cancelled) setOhlc30d([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [ticker])

  return { ohlc30d, loading }
}
