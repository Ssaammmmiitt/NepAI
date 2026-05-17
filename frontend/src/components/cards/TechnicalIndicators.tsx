import type { IndicatorData } from '../../types';
import { Activity, Layers, TrendingUp } from 'lucide-react';

interface TechnicalIndicatorsProps {
  indicators: IndicatorData | null;
  loading: boolean;
}

export function TechnicalIndicators({ indicators, loading }: TechnicalIndicatorsProps) {
  if (loading) {
    return (
      <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow">
        <div className="h-12 bg-bg-hover rounded-lg animate-[shimmer_1.5s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-bg-hover/25 via-bg-card to-bg-hover/25" />
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow">
        <p className="text-xs text-text-secondary">No indicator data available</p>
      </div>
    );
  }

  const latestRSI = indicators.rsi[indicators.rsi.length - 1]?.value || 0;
  const latestMACD = indicators.macd.macd[indicators.macd.macd.length - 1]?.value || 0;
  const latestSignal = indicators.macd.signal[indicators.macd.signal.length - 1]?.value || 0;
  const latestHistogram = indicators.macd.histogram[indicators.macd.histogram.length - 1]?.value || 0;

  const rsiStatus = latestRSI > 70 ? 'Overbought' : latestRSI < 30 ? 'Oversold' : 'Neutral';
  const rsiColor = latestRSI > 70 ? 'var(--color-bearish)' : latestRSI < 30 ? 'var(--color-bullish)' : 'var(--color-accent-primary)';
  const macdBullish = latestMACD > latestSignal;

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Activity size={20} color="var(--color-accent-primary)" />
        <h3 className="text-xl font-semibold">📈 Technical Indicators</h3>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-bg-hover rounded-lg border-l-[3px] border-accent-primary">
        <Layers size={16} color="var(--color-accent-primary)" />
        <span className="text-xs text-text-secondary">
          Active Chart Overlays: Bollinger Bands (BB), EMA (Exponential Moving Average), and AI Prediction projections.
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 p-4 bg-bg-hover rounded-xl">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={16} color={rsiColor} />
            <span className="text-xs text-text-secondary">RSI (14)</span>
          </div>
          <p className="font-mono font-bold text-2xl" style={{ color: rsiColor }}>{latestRSI.toFixed(2)}</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono w-fit ${rsiStatus === 'Overbought' ? 'bg-bearish-bg text-bearish' : rsiStatus === 'Oversold' ? 'bg-bullish-bg text-bullish' : 'bg-bg-hover text-text-secondary'}`}>
            {rsiStatus}
          </span>
        </div>
        <div className="flex flex-col gap-2 p-4 bg-bg-hover rounded-xl">
          <div className="flex items-center gap-1.5">
            <Activity size={16} color={macdBullish ? 'var(--color-bullish)' : 'var(--color-bearish)'} />
            <span className="text-xs text-text-secondary">MACD</span>
          </div>
          <p className="font-mono font-bold text-2xl">
            {latestMACD.toFixed(2)} / {latestSignal.toFixed(2)}
          </p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono w-fit ${macdBullish ? 'bg-bullish-bg text-bullish' : 'bg-bearish-bg text-bearish'}`}>
            {macdBullish ? 'Positive momentum' : 'Negative momentum'} — Histogram: {latestHistogram.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
