import { create } from 'zustand'
import { stockAPI } from '@/services/api'
import type { StockTicker } from '@/types'

interface StockState {
  tickers: StockTicker[]
  loading: boolean
  error: string | null
  lastFetched: number | null
  loadTickers: (force?: boolean) => Promise<void>
}

const CACHE_MS = 5 * 60 * 1000

export const useStockStore = create<StockState>((set, get) => ({
  tickers: [],
  loading: false,
  error: null,
  lastFetched: null,

  loadTickers: async (force = false) => {
    const { lastFetched, loading } = get()
    if (loading) return
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_MS) return

    set({ loading: true, error: null })
    try {
      const { data } = await stockAPI.listTickers()
      set({ tickers: data, lastFetched: Date.now() })
    } catch {
      set({ error: 'Failed to load market data' })
    } finally {
      set({ loading: false })
    }
  },
}))
