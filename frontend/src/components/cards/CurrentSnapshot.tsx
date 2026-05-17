import type { OHLCDataPoint } from '../../types';
import { formatPrice, formatPercent, formatVolume } from '../../utils/formatters';
import { getSector, getTickerName } from '../../services/mockData';
import { TrendingUp, TrendingDown, Building2, BarChart3 } from 'lucide-react';
import './CurrentSnapshot.css';

interface CurrentSnapshotProps {
  ticker: string;
  ohlcData: OHLCDataPoint[];
}

export function CurrentSnapshot({ ticker, ohlcData }: CurrentSnapshotProps) {
  if (ohlcData.length === 0) return null;

  const latest = ohlcData[ohlcData.length - 1];
  const prev = ohlcData.length > 1 ? ohlcData[ohlcData.length - 2] : null;
  const change = prev && prev.close > 0
    ? ((latest.close - prev.close) / prev.close) * 100
    : 0;
  const isBullish = change >= 0;

  return (
    <div className="card current-snapshot">
      <div className="snapshot-header">
        <div>
          <h2 className="text-display">{ticker}</h2>
          <p className="text-caption">{getTickerName(ticker)} — AI Stock Analysis</p>
        </div>
        <span className={`snapshot-badge ${isBullish ? 'badge-bullish' : 'badge-bearish'}`}>
          {isBullish ? '🟩' : '🟥'} {formatPercent(change)}
        </span>
      </div>
      <div className="snapshot-grid">
        <div className="snapshot-item">
          <Building2 size={16} color="var(--text-secondary)" />
          <div>
            <span className="text-caption">Sector</span>
            <p className="text-body">{getSector(ticker)}</p>
          </div>
        </div>
        <div className="snapshot-item">
          <BarChart3 size={16} color="var(--accent-primary)" />
          <div>
            <span className="text-caption">Current Price</span>
            <p className="text-kpi text-price">{formatPrice(latest.close)}</p>
          </div>
        </div>
        <div className="snapshot-item">
          {isBullish ? <TrendingUp size={16} color="var(--color-bullish)" /> : <TrendingDown size={16} color="var(--color-bearish)" />}
          <div>
            <span className="text-caption">Price Change</span>
            <p className={`text-kpi text-price ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
              {formatPercent(change)}
            </p>
          </div>
        </div>
        <div className="snapshot-item">
          <BarChart3 size={16} color="var(--text-secondary)" />
          <div>
            <span className="text-caption">Volume</span>
            <p className="text-kpi">{formatVolume(latest.volume)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
