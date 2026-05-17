import { useState, useEffect } from 'react';
import { getOHLC } from '../services/mockData';
import type { OHLCDataPoint } from '../types';

export function useStockData(ticker: string, from?: string, to?: string) {
  const [data, setData] = useState<OHLCDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    getOHLC(ticker, from, to)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticker, from, to]);

  return { data, loading, error };
}
