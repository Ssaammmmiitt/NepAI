import { useState, useEffect } from 'react';
import { StockSummaryCard } from '../cards/StockSummaryCard';
import { useNavigate } from 'react-router-dom';
import { getTickers } from '../../services/mockData';
import type { StockTicker } from '../../types';
import { Spinner } from '../ui/Spinner';

interface TopMoversProps {
  type: 'gainers' | 'losers';
}

export function TopMovers({ type }: TopMoversProps) {
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTickers().then((tickers) => {
      const sorted = [...tickers].sort((a, b) =>
        type === 'gainers' ? b.change - a.change : a.change - b.change
      );
      setStocks(sorted.slice(0, 5));
      setLoading(false);
    });
  }, [type]);

  if (loading) return <Spinner label="Loading movers..." />;

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow flex flex-col gap-4">
      <h3 className="text-xl font-semibold">{type === 'gainers' ? 'Top Gainers' : 'Top Losers'}</h3>
      <div className="flex flex-col gap-2">
        {stocks.map((s) => (
          <StockSummaryCard key={s.ticker} stock={s} onClick={() => navigate(`/stock/${s.ticker}`)} />
        ))}
      </div>
    </div>
  );
}
