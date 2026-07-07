import { create } from 'zustand'
import { stockAPI, healthAPI } from '@/services/api'
import type { StockTicker } from '@/types'

interface StockState {
  tickers: StockTicker[]
  loading: boolean
  error: string | null
  lastFetched: number | null
  dataUpdatedTo: string | null
  loadTickers: (force?: boolean) => Promise<void>
}

const CACHE_MS = 5 * 60 * 1000

export const useStockStore = create<StockState>((set, get) => ({
  tickers: [],
  loading: false,
  error: null,
  lastFetched: null,
  dataUpdatedTo: null,

  loadTickers: async (force = false) => {
    const { lastFetched, loading } = get()
    if (loading) return
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_MS) return

    set({ loading: true, error: null })
    try {
      const [tickersRes, healthRes] = await Promise.all([
        stockAPI.listTickers(),
        get().dataUpdatedTo ? Promise.resolve(null) : healthAPI.check().catch(() => null),
      ])
      set({
        tickers: tickersRes.data,
        lastFetched: Date.now(),
        ...(healthRes ? { dataUpdatedTo: healthRes.data.data_updated_to } : {}),
      })
    } catch {
      set({ error: 'Failed to load market data' })
    } finally {
      set({ loading: false })
    }
  },
}))
