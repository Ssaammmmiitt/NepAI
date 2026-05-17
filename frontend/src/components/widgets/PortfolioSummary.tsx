import { useEffect, useState } from 'react';
import type { PortfolioSummary, PortfolioItem } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { Wallet, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import './PortfolioSummary.css';

const STORAGE_KEY = 'nepai_portfolio';

function calculateSummary(holdings: PortfolioItem[]): PortfolioSummary {
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
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
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
      <div className="card portfolio-summary">
        <div className="skeleton skeleton-lg" />
      </div>
    );
  }

  const isPositive = summary.total_pnl >= 0;

  return (
    <div className="card portfolio-summary">
      <div className="portfolio-summary-item">
        <Wallet size={20} color="var(--accent-primary)" />
        <div>
          <span className="text-caption">Total Value</span>
          <p className="text-kpi text-price">{formatPrice(summary.total_value)}</p>
        </div>
      </div>
      <div className="portfolio-summary-item">
        {isPositive ? (
          <TrendingUp size={20} color="var(--color-bullish)" />
        ) : (
          <TrendingDown size={20} color="var(--color-bearish)" />
        )}
        <div>
          <span className="text-caption">Total P&L</span>
          <p
            className={`text-kpi text-price ${isPositive ? 'text-bullish' : 'text-bearish'}`}
          >
            {formatPercent(summary.total_pnl_percent)}
          </p>
        </div>
      </div>
      <div className="portfolio-summary-item">
        <Layers size={20} color="var(--text-secondary)" />
        <div>
          <span className="text-caption">Holdings</span>
          <p className="text-kpi">{summary.holdings_count}</p>
        </div>
      </div>
    </div>
  );
}
