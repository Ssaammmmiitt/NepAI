import type { OHLCDataPoint } from '../../types';
import { formatPrice, formatPercent, formatVolume } from '../../utils/formatters';
import { getSector, getTickerName } from '../../services/mockData';
import { TrendingUp, TrendingDown, Building2, BarChart3 } from 'lucide-react';

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
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold m-0">{ticker}</h2>
          <p className="text-xs text-text-secondary mt-1">{getTickerName(ticker)} — AI Stock Analysis</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${isBullish ? 'bg-bullish-bg text-bullish' : 'bg-bearish-bg text-bearish'}`}>
          {isBullish ? '🟩' : '🟥'} {formatPercent(change)}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-2 p-4 bg-bg-hover rounded-xl">
          <Building2 size={16} color="var(--color-text-secondary)" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-secondary">Sector</span>
            <p className="text-sm">{getSector(ticker)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 bg-bg-hover rounded-xl">
          <BarChart3 size={16} color="var(--color-accent-primary)" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-secondary">Current Price</span>
            <p className="font-mono font-bold text-xl">{formatPrice(latest.close)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 bg-bg-hover rounded-xl">
          {isBullish ? <TrendingUp size={16} color="var(--color-bullish)" /> : <TrendingDown size={16} color="var(--color-bearish)" />}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-secondary">Price Change</span>
            <p className={`font-mono font-bold text-xl ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
              {formatPercent(change)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 bg-bg-hover rounded-xl">
          <BarChart3 size={16} color="var(--color-text-secondary)" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-secondary">Volume</span>
            <p className="font-mono font-bold text-xl">{formatVolume(latest.volume)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
