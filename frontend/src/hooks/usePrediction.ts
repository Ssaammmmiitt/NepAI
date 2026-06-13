import { useCallback, useEffect, useState } from 'react'
import { predictionAPI } from '@/services/api'
import type { Prediction } from '@/types'

export function usePrediction(ticker: string, days = 5) {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!ticker) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await predictionAPI.getPrediction(ticker, days)
        if (!cancelled) setPrediction(data)
      } catch {
        if (!cancelled) {
          setError('Failed to load prediction')
          setPrediction(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [ticker, days, refreshKey])

  return { prediction, loading, error, refetch }
}
