import { create } from 'zustand';
import { getTickers } from '../services/mockData';

interface StockStore {
  selectedTicker: string | null;
  dateRange: { from: string; to: string };
  tickers: string[];
  setTicker: (ticker: string) => void;
  setDateRange: (from: string, to: string) => void;
  setTickers: (list: string[]) => void;
  loadTickers: () => Promise<void>;
}

export const useStockStore = create<StockStore>((set) => ({
  selectedTicker: null,
  dateRange: { from: '', to: '' },
  tickers: [],
  setTicker: (ticker) => set({ selectedTicker: ticker }),
  setDateRange: (from, to) => set({ dateRange: { from, to } }),
  setTickers: (list) => set({ tickers: list }),
  loadTickers: async () => {
    const tickers = await getTickers();
    set({ tickers: tickers.map((t) => t.ticker) });
  },
}));
