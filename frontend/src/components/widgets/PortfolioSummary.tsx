import { useEffect, useState } from 'react';
import type { PortfolioSummary as PortfolioSummaryType, PortfolioItem } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { Wallet, TrendingUp, TrendingDown, Layers } from 'lucide-react';

const STORAGE_KEY = 'nepai_portfolio';

function calculateSummary(holdings: PortfolioItem[]): PortfolioSummaryType {
  const total_value = holdings.reduce((sum, h) => sum + h.current_price * h.quantity, 0);
  const total_invested = holdings.reduce((sum, h) => sum + h.entry_price * h.quantity, 0);
  const total_pnl = total_value - total_invested;
  const total_pnl_percent = total_invested > 0 ? (total_pnl / total_invested) * 100 : 0;

  return {
    total_value,
    total_invested,
    total_pnl,
    total_pnl_percent,
    holdings_count: holdings.length,
  };
}

export function PortfolioSummary() {
  const [summary, setSummary] = useState<PortfolioSummaryType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const holdings: PortfolioItem[] = stored ? JSON.parse(stored) : [];
      setSummary(calculateSummary(holdings));
    } catch {
      setSummary({
        total_value: 0,
        total_invested: 0,
        total_pnl: 0,
        total_pnl_percent: 0,
        holdings_count: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading || !summary) {
    return (
      <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow">
        <div className="h-20 bg-bg-hover rounded-lg animate-[shimmer_1.5s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-bg-hover/25 via-bg-card to-bg-hover/25" />
      </div>
    );
  }

  const isPositive = summary.total_pnl >= 0;

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="flex items-center gap-4">
        <Wallet size={20} color="var(--color-accent-primary)" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-secondary">Total Value</span>
          <p className="font-mono font-bold text-2xl">{formatPrice(summary.total_value)}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isPositive ? (
          <TrendingUp size={20} color="var(--color-bullish)" />
        ) : (
          <TrendingDown size={20} color="var(--color-bearish)" />
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-secondary">Total P&L</span>
          <p className={`font-mono font-bold text-2xl ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
            {formatPercent(summary.total_pnl_percent)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Layers size={20} color="var(--color-text-secondary)" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-secondary">Holdings</span>
          <p className="font-mono font-bold text-2xl">{summary.holdings_count}</p>
        </div>
      </div>
    </div>
  );
}
