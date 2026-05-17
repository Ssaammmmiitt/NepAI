import { useState, useEffect } from 'react';
import { getMarketOverview } from '../../services/mockData';
import type { MarketOverview as MarketOverviewType } from '../../services/mockData';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { formatVolume } from '../../utils/formatters';
import { Spinner } from '../ui/Spinner';

export function MarketOverview() {
  const [overview, setOverview] = useState<MarketOverviewType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketOverview()
      .then((data) => setOverview(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading market data..." />;
  if (!overview) return <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card"><p className="text-xs text-text-secondary">Failed to load market data</p></div>;

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Activity size={20} color="var(--color-accent-primary)" />
        <h2 className="text-xl font-semibold">NEPSE Market Summary</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-2 p-4 bg-bg-hover rounded-xl">
          <BarChart3 size={18} color="var(--color-text-secondary)" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-secondary">Total Stocks</span>
            <p className="font-mono font-bold text-xl">{overview.totalStocks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 bg-bg-hover rounded-xl">
          <TrendingUp size={18} color="var(--color-bullish)" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-secondary">Gainers</span>
            <p className="font-mono font-bold text-xl text-bullish">{overview.gainers} 🟩</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 bg-bg-hover rounded-xl">
          <TrendingDown size={18} color="var(--color-bearish)" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-secondary">Losers</span>
            <p className="font-mono font-bold text-xl text-bearish">{overview.losers} 🟥</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 bg-bg-hover rounded-xl">
          <BarChart3 size={18} color="var(--color-accent-primary)" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-secondary">Total Volume</span>
            <p className="font-mono font-bold text-xl">{formatVolume(overview.totalVolume)}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">🚀 Top 5 Gainers</h3>
          <ol className="list-none flex flex-col gap-1">
            {overview.topGainers.map((s, i) => (
              <li key={s.ticker} className="flex items-center gap-3 px-4 py-2 bg-bg-hover rounded-lg transition-colors duration-150 hover:bg-bg-card">
                <span className="w-6 h-6 flex items-center justify-center bg-accent-primary-glow text-accent-primary rounded-full text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 flex items-center gap-1 min-w-0">
                  <span className="font-mono text-sm truncate">{s.ticker}</span>
                  <span className="text-xs text-text-secondary truncate">({s.name})</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono bg-bullish-bg text-bullish flex-shrink-0">
                  +{s.change.toFixed(2)}%
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">🔻 Top 5 Losers</h3>
          <ol className="list-none flex flex-col gap-1">
            {overview.topLosers.map((s, i) => (
              <li key={s.ticker} className="flex items-center gap-3 px-4 py-2 bg-bg-hover rounded-lg transition-colors duration-150 hover:bg-bg-card">
                <span className="w-6 h-6 flex items-center justify-center bg-accent-primary-glow text-accent-primary rounded-full text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 flex items-center gap-1 min-w-0">
                  <span className="font-mono text-sm truncate">{s.ticker}</span>
                  <span className="text-xs text-text-secondary truncate">({s.name})</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono bg-bearish-bg text-bearish flex-shrink-0">
                  {s.change.toFixed(2)}%
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
