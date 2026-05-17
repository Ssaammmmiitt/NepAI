import type { PortfolioItem } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { X } from 'lucide-react';
import './PortfolioCard.css';

interface PortfolioCardProps {
  item: PortfolioItem;
  onRemove?: (ticker: string) => void;
}

export function PortfolioCard({ item, onRemove }: PortfolioCardProps) {
  const isBullish = item.pnl >= 0;

  return (
    <div className="card portfolio-card">
      <div className="portfolio-card-header">
        <div>
          <span className="text-heading">{item.ticker}</span>
          <p className="text-caption">{item.quantity} shares @ {formatPrice(item.entry_price)}</p>
        </div>
        {onRemove && (
          <button className="portfolio-remove" onClick={() => onRemove(item.ticker)}>
            <X size={16} />
          </button>
        )}
      </div>
      <div className="portfolio-card-body">
        <div>
          <span className="text-caption">Current</span>
          <p className="text-price">{formatPrice(item.current_price)}</p>
        </div>
        <div>
          <span className="text-caption">Predicted</span>
          <p className="text-price" style={{ color: 'var(--chart-prediction)' }}>{formatPrice(item.predicted_price)}</p>
        </div>
        <div>
          <span className="text-caption">P&L</span>
          <p className={`text-price ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
            {formatPercent(item.pnl_percent)}
          </p>
        </div>
      </div>
    </div>
  );
}
