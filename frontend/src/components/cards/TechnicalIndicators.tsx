import type { IndicatorData } from '../../types';
import { Activity, Layers, TrendingUp } from 'lucide-react';
import './TechnicalIndicators.css';

interface TechnicalIndicatorsProps {
  indicators: IndicatorData | null;
  loading: boolean;
}

export function TechnicalIndicators({ indicators, loading }: TechnicalIndicatorsProps) {
  if (loading) {
    return <div className="card technical-indicators"><div className="skeleton skeleton-md" /></div>;
  }

  if (!indicators) {
    return <div className="card technical-indicators"><p className="text-caption">No indicator data available</p></div>;
  }

  const latestRSI = indicators.rsi[indicators.rsi.length - 1]?.value || 0;
  const latestMACD = indicators.macd.macd[indicators.macd.macd.length - 1]?.value || 0;
  const latestSignal = indicators.macd.signal[indicators.macd.signal.length - 1]?.value || 0;
  const latestHistogram = indicators.macd.histogram[indicators.macd.histogram.length - 1]?.value || 0;

  const rsiStatus = latestRSI > 70 ? 'Overbought' : latestRSI < 30 ? 'Oversold' : 'Neutral';
  const rsiColor = latestRSI > 70 ? 'var(--color-bearish)' : latestRSI < 30 ? 'var(--color-bullish)' : 'var(--accent-primary)';
  const macdBullish = latestMACD > latestSignal;

  return (
    <div className="card technical-indicators">
      <div className="tech-header">
        <Activity size={20} color="var(--accent-primary)" />
        <h3 className="text-heading">📈 Technical Indicators</h3>
      </div>
      <div className="tech-overlays">
        <Layers size={16} color="var(--accent-primary)" />
        <span className="text-caption">
          Active Chart Overlays: Bollinger Bands (BB), EMA (Exponential Moving Average), and AI Prediction projections.
        </span>
      </div>
      <div className="tech-grid">
        <div className="tech-item">
          <div className="tech-item-header">
            <TrendingUp size={16} color={rsiColor} />
            <span className="text-caption">RSI (14)</span>
          </div>
          <p className="text-kpi text-price" style={{ color: rsiColor }}>{latestRSI.toFixed(2)}</p>
          <span className={`badge ${rsiStatus === 'Overbought' ? 'badge-bearish' : rsiStatus === 'Oversold' ? 'badge-bullish' : 'badge-neutral'}`}>
            {rsiStatus}
          </span>
        </div>
        <div className="tech-item">
          <div className="tech-item-header">
            <Activity size={16} color={macdBullish ? 'var(--color-bullish)' : 'var(--color-bearish)'} />
            <span className="text-caption">MACD</span>
          </div>
          <p className="text-kpi text-price">
            {latestMACD.toFixed(2)} / {latestSignal.toFixed(2)}
          </p>
          <span className={`badge ${macdBullish ? 'badge-bullish' : 'badge-bearish'}`}>
            {macdBullish ? 'Positive momentum' : 'Negative momentum'} — Histogram: {latestHistogram.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
