import type { StockTicker } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import './StockSummaryCard.css';

interface StockSummaryCardProps {
  stock: StockTicker;
  onClick?: () => void;
}

export function StockSummaryCard({ stock, onClick }: StockSummaryCardProps) {
  const isBullish = stock.change >= 0;

  return (
    <div className="card stock-summary-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="stock-summary-header">
        <div>
          <span className="text-heading">{stock.ticker}</span>
          <p className="text-caption">{stock.name}</p>
        </div>
        <span className={`badge ${isBullish ? 'badge-bullish' : 'badge-bearish'}`}>
          {formatPercent(stock.change)}
        </span>
      </div>
      <div className="stock-summary-body">
        <span className="text-kpi text-price">{formatPrice(stock.latest_close)}</span>
        <span className={`text-caption ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
          {isBullish ? '▲' : '▼'} {stock.change.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
