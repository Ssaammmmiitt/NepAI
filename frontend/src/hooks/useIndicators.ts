import { useEffect, useState } from 'react'
import { stockAPI } from '@/services/api'
import type { Indicators } from '@/types'

export function useIndicators(ticker: string) {
  const [indicators, setIndicators] = useState<Indicators | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await stockAPI.getIndicators(ticker)
        if (!cancelled) setIndicators(data)
      } catch {
        if (!cancelled) setError('Failed to load indicators')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [ticker])

  return { indicators, loading, error }
}
