import { create } from 'zustand';
import type { PortfolioItem, PortfolioSummary, NewHolding } from '../types';

const STORAGE_KEY = 'nepai_portfolio';

function loadFromStorage(): PortfolioItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(holdings: PortfolioItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

interface PortfolioStore {
  holdings: PortfolioItem[];
  summary: PortfolioSummary | null;
  addHolding: (item: NewHolding) => Promise<void>;
  removeHolding: (ticker: string) => Promise<void>;
  fetchPortfolio: () => Promise<void>;
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  holdings: loadFromStorage(),
  summary: null,
  addHolding: async (item) => {
    const newHolding: PortfolioItem = {
      ...item,
      current_price: item.entry_price,
      predicted_price: item.entry_price,
      pnl: 0,
      pnl_percent: 0,
    };
    const updated = [...get().holdings, newHolding];
    saveToStorage(updated);
    set({ holdings: updated });
  },
  removeHolding: async (ticker) => {
    const updated = get().holdings.filter((h) => h.ticker !== ticker);
    saveToStorage(updated);
    set({ holdings: updated });
  },
  fetchPortfolio: async () => {
    const holdings = loadFromStorage();
    set({ holdings });
  },
}));
