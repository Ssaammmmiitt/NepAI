import { useState, useEffect } from 'react';
import { getOHLC, generateMockPrediction } from '../services/mockData';
import type { Prediction } from '../types';

export function usePrediction(ticker: string) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    getOHLC(ticker)
      .then((ohlc) => {
        const pred = generateMockPrediction(ticker, ohlc);
        setPrediction(pred);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return { prediction, loading, error };
}
