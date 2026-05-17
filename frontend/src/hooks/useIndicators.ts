import { useState, useEffect } from 'react';
import { getOHLC, generateMockIndicators } from '../services/mockData';
import type { IndicatorData } from '../types';

export function useIndicators(ticker: string) {
  const [indicators, setIndicators] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    getOHLC(ticker)
      .then((ohlc) => {
        const ind = generateMockIndicators(ohlc);
        setIndicators(ind);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return { indicators, loading, error };
}
