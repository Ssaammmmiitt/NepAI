import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStockStore } from '@/store/stockStore'

vi.mock('@/services/api', () => ({
  stockAPI: {
    listTickers: vi.fn(),
  },
}))

import { stockAPI } from '@/services/api'

const mockTickers = [
  { ticker: 'NABIL', latest_close: 500, change: 2.1, volume: 10000, latest_date: '2026-01-01' },
  { ticker: 'GBIME', latest_close: 300, change: -1.5, volume: 5000, latest_date: '2026-01-01' },
]

describe('stockStore', () => {
  beforeEach(() => {
    useStockStore.setState({ tickers: [], loading: false, error: null, lastFetched: null })
    vi.clearAllMocks()
  })

  it('initializes with empty tickers', () => {
    const state = useStockStore.getState()
    expect(state.tickers).toEqual([])
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('loadTickers fetches and stores tickers', async () => {
    vi.mocked(stockAPI.listTickers).mockResolvedValue({ data: mockTickers } as never)

    await useStockStore.getState().loadTickers()

    const state = useStockStore.getState()
    expect(state.tickers).toEqual(mockTickers)
    expect(state.loading).toBe(false)
    expect(state.lastFetched).toBeGreaterThan(0)
  })

  it('loadTickers sets error on failure', async () => {
    vi.mocked(stockAPI.listTickers).mockRejectedValue(new Error('Network'))

    await useStockStore.getState().loadTickers()

    const state = useStockStore.getState()
    expect(state.error).toBe('Failed to load market data')
    expect(state.tickers).toEqual([])
  })

  it('loadTickers uses cache when called within 5 minutes', async () => {
    vi.mocked(stockAPI.listTickers).mockResolvedValue({ data: mockTickers } as never)

    await useStockStore.getState().loadTickers()
    await useStockStore.getState().loadTickers()

    expect(stockAPI.listTickers).toHaveBeenCalledTimes(1)
  })

  it('loadTickers force bypasses cache', async () => {
    vi.mocked(stockAPI.listTickers).mockResolvedValue({ data: mockTickers } as never)

    await useStockStore.getState().loadTickers()
    await useStockStore.getState().loadTickers(true)

    expect(stockAPI.listTickers).toHaveBeenCalledTimes(2)
  })
})
