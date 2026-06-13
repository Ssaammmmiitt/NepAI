import { create } from 'zustand'
import { portfolioAPI } from '@/services/api'
import type { PortfolioHolding } from '@/types'

interface PortfolioState {
  holdings: PortfolioHolding[]
  loading: boolean
  error: string | null
  fetchPortfolio: () => Promise<void>
  addStock: (ticker: string, quantity: number, entry_price: number) => Promise<void>
  removeStock: (ticker: string) => Promise<void>
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  holdings: [],
  loading: false,
  error: null,

  fetchPortfolio: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await portfolioAPI.getPortfolio()
      set({ holdings: data.holdings })
    } catch {
      set({ error: 'Failed to load portfolio' })
    } finally {
      set({ loading: false })
    }
  },

  addStock: async (ticker, quantity, entry_price) => {
    set({ loading: true, error: null })
    try {
      await portfolioAPI.addStock({ ticker, quantity, entry_price })
      await get().fetchPortfolio()
    } catch {
      set({ error: 'Failed to add stock', loading: false })
      throw new Error('Failed to add stock')
    }
  },

  removeStock: async (ticker) => {
    set({ loading: true, error: null })
    try {
      await portfolioAPI.removeStock(ticker)
      await get().fetchPortfolio()
    } catch {
      set({ error: 'Failed to remove stock', loading: false })
      throw new Error('Failed to remove stock')
    }
  },
}))
