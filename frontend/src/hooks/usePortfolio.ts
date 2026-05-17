import { useState, useEffect } from 'react';
import type { PortfolioItem } from '../types';

const STORAGE_KEY = 'nepai_portfolio';

export function usePortfolio() {
  const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = () => {
    setLoading(true);
    setError(null);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHoldings(JSON.parse(stored));
      } else {
        setHoldings([]);
      }
    } catch (err) {
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  return { holdings, loading, error, refetch: fetchPortfolio };
}
