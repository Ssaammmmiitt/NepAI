import type { StockTicker } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';

interface StockSummaryCardProps {
  stock: StockTicker;
  onClick?: () => void;
}

export function StockSummaryCard({ stock, onClick }: StockSummaryCardProps) {
  const isBullish = stock.change >= 0;

  return (
    <div
      className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow hover:shadow-glow cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xl font-semibold">{stock.ticker}</span>
          <p className="text-xs text-text-secondary">{stock.name}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono ${isBullish ? 'bg-bullish-bg text-bullish' : 'bg-bearish-bg text-bearish'}`}>
          {formatPercent(stock.change)}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="font-mono font-bold text-2xl">{formatPrice(stock.latest_close)}</span>
        <span className={`text-xs ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
          {isBullish ? '▲' : '▼'} {stock.change.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
