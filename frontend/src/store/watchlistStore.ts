import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistState {
  tickers: string[]
  addTicker: (ticker: string) => void
  removeTicker: (ticker: string) => void
  hasTicker: (ticker: string) => boolean
  clearAll: () => void
}

const MAX_WATCHLIST = 20

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      tickers: [],

      addTicker: (ticker) => {
        const upper = ticker.toUpperCase()
        const { tickers } = get()
        if (tickers.includes(upper) || tickers.length >= MAX_WATCHLIST) return
        set({ tickers: [...tickers, upper] })
      },

      removeTicker: (ticker) => {
        const upper = ticker.toUpperCase()
        set({ tickers: get().tickers.filter((t) => t !== upper) })
      },

      hasTicker: (ticker) => get().tickers.includes(ticker.toUpperCase()),

      clearAll: () => set({ tickers: [] }),
    }),
    { name: 'nepai-watchlist' },
  ),
)
