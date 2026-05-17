import type { PortfolioItem } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { X } from 'lucide-react';

interface PortfolioCardProps {
  item: PortfolioItem;
  onRemoveClick?: (ticker: string) => void;
}

export function PortfolioCard({ item, onRemoveClick }: PortfolioCardProps) {
  const isBullish = item.pnl >= 0;

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-accent-primary">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xl font-semibold">{item.ticker}</span>
          <p className="text-xs text-text-secondary">{item.quantity} shares @ {formatPrice(item.entry_price)}</p>
        </div>
        {onRemoveClick && (
          <button
            className="bg-none border-none text-text-secondary cursor-pointer p-1 rounded-lg transition-all duration-200 hover:bg-bearish-bg hover:text-bearish"
            onClick={() => onRemoveClick(item.ticker)}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">Current</span>
          <p className="font-mono">{formatPrice(item.current_price)}</p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">Predicted</span>
          <p className="font-mono" style={{ color: 'var(--color-chart-prediction)' }}>{formatPrice(item.predicted_price)}</p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">P&L</span>
          <p className={`font-mono ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
            {formatPercent(item.pnl_percent)}
          </p>
        </div>
      </div>
    </div>
  );
}
