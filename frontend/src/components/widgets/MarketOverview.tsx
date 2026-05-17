import { useState, useEffect } from 'react';
import { getMarketOverview } from '../../services/mockData';
import type { MarketOverview } from '../../services/mockData';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { formatVolume } from '../../utils/formatters';
import { Spinner } from '../ui/Spinner';
import './MarketOverview.css';

export function MarketOverview() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketOverview()
      .then((data) => setOverview(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading market data..." />;
  if (!overview) return <div className="card market-overview"><p className="text-caption">Failed to load market data</p></div>;

  return (
    <div className="card market-overview">
      <div className="market-overview-header">
        <Activity size={20} color="var(--accent-primary)" />
        <h2 className="text-heading">NEPSE Market Summary</h2>
      </div>
      <div className="market-stats">
        <div className="market-stat">
          <BarChart3 size={18} color="var(--text-secondary)" />
          <div>
            <span className="text-caption">Total Stocks</span>
            <p className="text-kpi">{overview.totalStocks}</p>
          </div>
        </div>
        <div className="market-stat">
          <TrendingUp size={18} color="var(--color-bullish)" />
          <div>
            <span className="text-caption">Gainers</span>
            <p className="text-kpi text-bullish">{overview.gainers} 🟩</p>
          </div>
        </div>
        <div className="market-stat">
          <TrendingDown size={18} color="var(--color-bearish)" />
          <div>
            <span className="text-caption">Losers</span>
            <p className="text-kpi text-bearish">{overview.losers} 🟥</p>
          </div>
        </div>
        <div className="market-stat">
          <BarChart3 size={18} color="var(--accent-primary)" />
          <div>
            <span className="text-caption">Total Volume</span>
            <p className="text-kpi">{formatVolume(overview.totalVolume)}</p>
          </div>
        </div>
      </div>
      <div className="market-movers">
        <div className="market-movers-section">
          <h3 className="text-heading">🚀 Top 5 Gainers</h3>
          <ol className="movers-list">
            {overview.topGainers.map((s, i) => (
              <li key={s.ticker}>
                <span className="movers-rank">{i + 1}</span>
                <div className="movers-info">
                  <span className="text-price text-body">{s.ticker}</span>
                  <span className="text-caption">({s.name})</span>
                </div>
                <span className="badge badge-bullish">+{s.change.toFixed(2)}%</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="market-movers-section">
          <h3 className="text-heading">🔻 Top 5 Losers</h3>
          <ol className="movers-list">
            {overview.topLosers.map((s, i) => (
              <li key={s.ticker}>
                <span className="movers-rank">{i + 1}</span>
                <div className="movers-info">
                  <span className="text-price text-body">{s.ticker}</span>
                  <span className="text-caption">({s.name})</span>
                </div>
                <span className="badge badge-bearish">{s.change.toFixed(2)}%</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
