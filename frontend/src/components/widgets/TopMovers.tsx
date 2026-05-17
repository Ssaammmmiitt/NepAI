import { useState, useEffect } from 'react';
import { StockSummaryCard } from '../cards/StockSummaryCard';
import { useNavigate } from 'react-router-dom';
import { getTickers } from '../../services/mockData';
import type { StockTicker } from '../../types';
import { Spinner } from '../ui/Spinner';
import './TopMovers.css';

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
    <div className="card top-movers">
      <h3 className="text-heading">{type === 'gainers' ? 'Top Gainers' : 'Top Losers'}</h3>
      <div className="top-movers-list">
        {stocks.map((s) => (
          <StockSummaryCard key={s.ticker} stock={s} onClick={() => navigate(`/stock/${s.ticker}`)} />
        ))}
      </div>
    </div>
  );
}
