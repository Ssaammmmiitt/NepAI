import type { Prediction } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { Target, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

interface AIPredictionProps {
  prediction: Prediction | null;
  loading: boolean;
  currentPrice: number;
}

export function AIPrediction({ prediction, loading, currentPrice }: AIPredictionProps) {
  if (loading) {
    return (
      <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow">
        <div className="h-12 bg-bg-hover rounded-lg animate-[shimmer_1.5s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-bg-hover/25 via-bg-card to-bg-hover/25" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow">
        <p className="text-xs text-text-secondary">No prediction data available</p>
      </div>
    );
  }

  const dayChange = ((prediction.next_day.price - currentPrice) / currentPrice) * 100;
  const weekChange = ((prediction.next_week.price - currentPrice) / currentPrice) * 100;
  const dayBullish = dayChange >= 0;
  const weekBullish = weekChange >= 0;

  const hoursAgo = Math.round((Date.now() - new Date(prediction.generated_at).getTime()) / 3600000);

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Target size={20} color="var(--color-accent-primary)" />
        <h3 className="text-xl font-semibold">🤖 AI Price Prediction</h3>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-2 bg-accent-primary-glow rounded-lg border-l-[3px] border-accent-primary">
        <Clock size={14} color="var(--color-text-secondary)" />
        <span className="text-xs text-text-secondary">
          Model Accuracy: {(prediction.model_accuracy * 100).toFixed(1)}% — Trained {hoursAgo}h ago
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 p-4 bg-bg-hover rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Next Day Target</span>
            {dayBullish ? <ArrowUpRight size={16} color="var(--color-bullish)" /> : <ArrowDownRight size={16} color="var(--color-bearish)" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-2xl">{formatPrice(prediction.next_day.price)}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono ${dayBullish ? 'bg-bullish-bg text-bullish' : 'bg-bearish-bg text-bearish'}`}>
              {formatPercent(dayChange)}
            </span>
          </div>
          <span className="text-xs text-text-secondary">
            Range: {formatPrice(prediction.next_day.confidence_low)} — {formatPrice(prediction.next_day.confidence_high)}
          </span>
        </div>
        <div className="flex flex-col gap-1 p-4 bg-bg-hover rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Next Week Target</span>
            {weekBullish ? <ArrowUpRight size={16} color="var(--color-bullish)" /> : <ArrowDownRight size={16} color="var(--color-bearish)" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-2xl">{formatPrice(prediction.next_week.price)}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono ${weekBullish ? 'bg-bullish-bg text-bullish' : 'bg-bearish-bg text-bearish'}`}>
              {formatPercent(weekChange)}
            </span>
          </div>
          <span className="text-xs text-text-secondary">
            Range: {formatPrice(prediction.next_week.confidence_low)} — {formatPrice(prediction.next_week.confidence_high)}
          </span>
        </div>
      </div>
    </div>
  );
}
